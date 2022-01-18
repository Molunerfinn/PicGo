<template>
  <div id="plugin-view">
    <div class="view-title">
      {{ $T('PLUGIN_SETTINGS') }} -
      <el-tooltip :content="pluginListToolTip" placement="right">
        <i class="el-icon-goods" @click="goAwesomeList"></i>
      </el-tooltip>
      <el-tooltip :content="importLocalPluginToolTip" placement="left">
        <i class="el-icon-download" @click="handleImportLocalPlugin"/>
      </el-tooltip>
    </div>
    <el-row class="handle-bar" :class="{ 'cut-width': pluginList.length > 6 }">
      <el-input
        v-model="searchText"
        :placeholder="$T('PLUGIN_SEARCH_PLACEHOLDER')"
        size="small"
      >
        <i slot="suffix" class="el-input__icon el-icon-close" v-if="searchText" @click="cleanSearch" style="cursor: pointer"></i>
      </el-input>
    </el-row>
    <el-row :gutter="10" class="plugin-list" v-loading="loading">
      <el-col :span="12" v-for="item in pluginList" :key="item.fullName">
        <div class="plugin-item" :class="{ 'darwin': os === 'darwin' }">
          <div class="cli-only-badge" v-if="!item.gui" title="CLI only">CLI</div>
          <img class="plugin-item__logo" :src="item.logo"
            :onerror="defaultLogo"
          >
          <div
            class="plugin-item__content"
            :class="{ disabled: !item.enabled }"
          >
            <div class="plugin-item__name" @click="openHomepage(item.homepage)">
              {{ item.name }} <small>{{ ' ' + item.version }}</small>
            </div>
            <div class="plugin-item__desc" :title="item.description">
              {{ item.description }}
            </div>
            <div class="plugin-item__info-bar">
              <span class="plugin-item__author">
                {{ item.author }}
              </span>
              <span class="plugin-item__config" >
                <template v-if="searchText">
                  <template v-if="!item.hasInstall">
                    <span class="config-button install" v-if="!item.ing" @click="installPlugin(item)">
                      {{ $T('PLUGIN_INSTALL') }}
                    </span>
                    <span v-else-if="item.ing" class="config-button ing">
                      {{ $T('PLUGIN_INSTALLING') }}
                    </span>
                  </template>
                  <span v-else class="config-button ing">
                    {{ $T('PLUGIN_INSTALLED') }}
                  </span>
                </template>
                <template v-else>
                  <span v-if="item.ing" class="config-button ing">
                    {{ $T('PLUGIN_DOING_SOMETHING') }}
                  </span>
                  <template v-else>
                    <i
                      v-if="item.enabled"
                      class="el-icon-setting"
                      @click="buildContextMenu(item)"
                    ></i>
                    <i
                      v-else
                      class="el-icon-remove-outline"
                      @click="buildContextMenu(item)"
                    ></i>
                  </template>
                </template>
              </span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
    <el-row v-show="needReload" class="reload-mask" :class="{ 'cut-width': pluginList.length > 6 }">
      <el-button type="primary" @click="reloadApp" size="mini" round>{{ $T('TIPS_NEED_RELOAD') }}</el-button>
    </el-row>
    <el-dialog
      :visible.sync="dialogVisible"
      :modal-append-to-body="false"
      :title="$T('CONFIG_THING', {
        c: configName
      })"
      width="70%"
    >
      <config-form
        :config="config"
        :type="currentType"
        :id="configName"
        ref="configForm"
      >
      </config-form>
      <span slot="footer">
        <el-button @click="dialogVisible = false" round>{{ $T('CANCEL') }}</el-button>
        <el-button type="primary" @click="handleConfirmConfig" round>{{ $T('CONFIRM') }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>
<script lang="ts">
import {
  Component,
  Vue,
  Watch
} from 'vue-property-decorator'
import ConfigForm from '@/components/ConfigForm.vue'
import { debounce } from 'lodash'
import {
  ipcRenderer,
  IpcRendererEvent
} from 'electron'
import { handleStreamlinePluginName } from '~/universal/utils/common'
import {
  OPEN_URL,
  RELOAD_APP,
  PICGO_CONFIG_PLUGIN,
  PICGO_HANDLE_PLUGIN_ING,
  PICGO_TOGGLE_PLUGIN,
  SHOW_PLUGIN_PAGE_MENU
} from '#/events/constants'

@Component({
  name: 'plugin',
  components: {
    ConfigForm
  }
})
export default class extends Vue {
  searchText = ''
  pluginList: IPicGoPlugin[] = []
  menu: Electron.Menu | null = null
  config: any[] = []
  currentType = ''
  configName = ''
  dialogVisible = false
  pluginNameList: string[] = []
  loading = true
  needReload = false
  pluginListToolTip = this.$T('PLUGIN_LIST')importLocalPluginToolTip = this.$T('PLUGIN_IMPORT_LOCAL')
  id = ''
  os = ''
  defaultLogo: string = 'this.src="https://cdn.jsdelivr.net/gh/Molunerfinn/PicGo@dev/public/roundLogo.png"'
  get npmSearchText () {
    return this.searchText.match('picgo-plugin-')
      ? this.searchText
      : this.searchText !== ''
        ? `picgo-plugin-${this.searchText}`
        : this.searchText
  }

  @Watch('npmSearchText')
  onNpmSearchTextChange (val: string) {
    if (val) {
      this.loading = true
      this.pluginList = []
      this.getSearchResult(val)
    } else {
      this.getPluginList()
    }
  }

  @Watch('dialogVisible')
  onDialogVisible (val: boolean) {
    if (val) {
      // @ts-ignore
      document.querySelector('.main-content.el-row').style.zIndex = 101
    } else {
      // @ts-ignore
      document.querySelector('.main-content.el-row').style.zIndex = 10
    }
  }

  async created () {
    this.os = process.platform
    ipcRenderer.on('hideLoading', () => {
      this.loading = false
    })
    ipcRenderer.on('pluginList', (evt: IpcRendererEvent, list: IPicGoPlugin[]) => {
      this.pluginList = list
      this.pluginNameList = list.map(item => item.fullName)
      this.loading = false
    })
    ipcRenderer.on('installPlugin', (evt: IpcRendererEvent, { success, body }: {
      success: boolean,
      body: string
    }) => {
      this.loading = false
      this.pluginList.forEach(item => {
        if (item.fullName === body) {
          item.ing = false
          item.hasInstall = success
        }
      })
    })
    ipcRenderer.on('updateSuccess', (evt: IpcRendererEvent, plugin: string) => {
      this.loading = false
      this.pluginList.forEach(item => {
        if (item.fullName === plugin) {
          item.ing = false
          item.hasInstall = true
        }
        this.getPicBeds()
      })
      this.handleReload()
      this.getPluginList()
    })
    ipcRenderer.on('uninstallSuccess', (evt: IpcRendererEvent, plugin: string) => {
      this.loading = false
      this.pluginList = this.pluginList.filter(item => {
        if (item.fullName === plugin) { // restore Uploader & Transformer after uninstalling
          if (item.config.transformer.name) {
            this.handleRestoreState('transformer', item.config.transformer.name)
          }
          if (item.config.uploader.name) {
            this.handleRestoreState('uploader', item.config.uploader.name)
          }
          this.getPicBeds()
        }
        return item.fullName !== plugin
      })
      this.pluginNameList = this.pluginNameList.filter(item => item !== plugin)
    })
    ipcRenderer.on(PICGO_CONFIG_PLUGIN, (evt: IpcRendererEvent, currentType: string, configName: string, config: any) => {
      this.currentType = currentType
      this.configName = configName
      this.dialogVisible = true
      this.config = config
    })
    ipcRenderer.on(PICGO_HANDLE_PLUGIN_ING, (evt: IpcRendererEvent, fullName: string) => {
      this.pluginList.forEach(item => {
        if (item.fullName === fullName || (item.name === fullName)) {
          item.ing = true
        }
      })
      this.loading = true
    })
    ipcRenderer.on(PICGO_TOGGLE_PLUGIN, (evt: IpcRendererEvent, fullName: string, enabled: boolean) => {
      const plugin = this.pluginList.find(item => item.fullName === fullName)
      if (plugin) {
        plugin.enabled = enabled
        this.getPicBeds()
        this.needReload = true
      }
    })
    this.getPluginList()
    this.getSearchResult = debounce(this.getSearchResult, 50)
    this.needReload = await this.getConfig<boolean>('needReload') || false
  }

  async buildContextMenu (plugin: IPicGoPlugin) {
    ipcRenderer.send(SHOW_PLUGIN_PAGE_MENU, plugin)
  }

  getPluginList () {
    ipcRenderer.send('getPluginList')
  }

  getPicBeds () {
    ipcRenderer.send('getPicBeds')
  }

  installPlugin (item: IPicGoPlugin) {
    if (!item.gui) {
      this.$confirm(this.$T('TIPS_PLUGIN_NOT_GUI_IMPLEMENT'), this.$T('TIPS_NOTICE'), {
        confirmButtonText: this.$T('CONFIRM'),
        cancelButtonText: this.$T('CANCEL'),
        type: 'warning'
      }).then(() => {
        item.ing = true
        ipcRenderer.send('installPlugin', item.fullName)
      }).catch(() => {
        console.log('Install canceled')
      })
    } else {
      item.ing = true
      ipcRenderer.send('installPlugin', item.fullName)
    }
  }

  uninstallPlugin (val: string) {
    this.pluginList.forEach(item => {
      if (item.name === val) {
        item.ing = true
      }
    })
    this.loading = true
    ipcRenderer.send('uninstallPlugin', val)
  }

  updatePlugin (val: string) {
    this.pluginList.forEach(item => {
      if (item.fullName === val) {
        item.ing = true
      }
    })
    this.loading = true
    ipcRenderer.send('updatePlugin', val)
  }

  reloadApp () {
    ipcRenderer.send(RELOAD_APP)
  }

  async handleReload () {
    this.saveConfig({
      needReload: true
    })
    this.needReload = true
    const successNotification = new Notification(this.$T('PLUGIN_UPDATE_SUCCEED'), {
      body: this.$T('TIPS_NEED_RELOAD')
    })
    successNotification.onclick = () => {
      this.reloadApp()
    }
  }

  cleanSearch () {
    this.searchText = ''
  }

  async handleConfirmConfig () {
    // @ts-ignore
    const result = await this.$refs.configForm.validate()
    if (result !== false) {
      switch (this.currentType) {
        case 'plugin':
          this.saveConfig({
            [`${this.configName}`]: result
          })
          break
        case 'uploader':
          this.saveConfig({
            [`picBed.${this.configName}`]: result
          })
          break
        case 'transformer':
          this.saveConfig({
            [`transformer.${this.configName}`]: result
          })
          break
      }
      const successNotification = new Notification(this.$T('SETTINGS_RESULT'), {
        body: this.$T('TIPS_SET_SUCCEED')
      })
      successNotification.onclick = () => {
        return true
      }
      this.dialogVisible = false
      this.getPluginList()
    }
  }

  getSearchResult (val: string) {
    // this.$http.get(`https://api.npms.io/v2/search?q=${val}`)
    this.$http.get(`https://registry.npmjs.com/-/v1/search?text=${val}`)
      .then((res: INPMSearchResult) => {
        this.pluginList = res.data.objects
          .filter((item:INPMSearchResultObject) => {
            return item.package.name.includes('picgo-plugin-')
          })
          .map((item: INPMSearchResultObject) => {
            return this.handleSearchResult(item)
          })
        this.loading = false
      })
      .catch(err => {
        console.log(err)
        this.loading = false
      })
  }

  handleSearchResult (item: INPMSearchResultObject) {
    const name = handleStreamlinePluginName(item.package.name)
    let gui = false
    if (item.package.keywords && item.package.keywords.length > 0) {
      if (item.package.keywords.includes('picgo-gui-plugin')) {
        gui = true
      }
    }
    return {
      name: name,
      fullName: item.package.name,
      author: item.package.author.name,
      description: item.package.description,
      logo: `https://cdn.jsdelivr.net/npm/${item.package.name}/logo.png`,
      config: {},
      homepage: item.package.links ? item.package.links.homepage : '',
      hasInstall: this.pluginNameList.some(plugin => plugin === item.package.name),
      version: item.package.version,
      gui,
      ing: false // installing or uninstalling
    }
  }

  // restore Uploader & Transformer
  async handleRestoreState (item: string, name: string) {
    if (item === 'uploader') {
      const current = await this.getConfig('picBed.current')
      if (current === name) {
        this.saveConfig({
          'picBed.current': 'smms',
          'picBed.uploader': 'smms'
        })
      }
    }
    if (item === 'transformer') {
      const current = await this.getConfig('picBed.transformer')
      if (current === name) {
        this.saveConfig({
          'picBed.transformer': 'path'
        })
      }
    }
  }

  openHomepage (url: string) {
    if (url) {
      ipcRenderer.send(OPEN_URL, url)
    }
  }

  goAwesomeList () {
    ipcRenderer.send(OPEN_URL, 'https://github.com/PicGo/Awesome-PicGo')
  }

  saveConfig (data: IObj) {
    ipcRenderer.send('picgoSaveData', data)
  }

  handleImportLocalPlugin () {
    ipcRenderer.send('importLocalPlugin')
    this.loading = true
  }

  beforeDestroy () {
    ipcRenderer.removeAllListeners('pluginList')
    ipcRenderer.removeAllListeners('installPlugin')
    ipcRenderer.removeAllListeners('uninstallSuccess')
    ipcRenderer.removeAllListeners('updateSuccess')
    ipcRenderer.removeAllListeners('hideLoading')
  }
}
</script>
<style lang='stylus'>
$darwinBg = #172426
#plugin-view
  position relative
  padding 0 20px 0
  .el-loading-mask
    background-color rgba(0, 0, 0, 0.8)
  .plugin-list
    height: 339px;
    box-sizing: border-box;
    padding: 8px 15px;
    overflow-y: auto;
    overflow-x: hidden;
    position: absolute;
    top: 70px;
    left: 5px;
    transition: all 0.2s ease-in-out 0.1s;
    width: 100%
    .el-loading-mask
      left: 20px
      width: calc(100% - 40px)
  .view-title
    color #eee
    font-size 20px
    text-align center
    margin 10px auto
    position relative
    i.el-icon-goods
      font-size 20px
      vertical-align middle
      cursor pointer
      transition color .2s ease-in-out
      &:hover
        color #49B1F5
    i.el-icon-download
      position absolute
      right 0
      top 8px
      font-size 20px
      vertical-align middle
      cursor pointer
      transition color .2s ease-in-out
      &:hover
        color #49B1F5
  .handle-bar
    margin-bottom 20px
    &.cut-width
      padding-right: 8px
  .el-input__inner
    border-radius 0
  .plugin-item
    box-sizing border-box
    height 80px
    background #444
    padding 8px
    user-select text
    transition all .2s ease-in-out
    margin-bottom 10px
    position relative
    .cli-only-badge
      position absolute
      right 0px
      top 0
      font-size 12px
      padding 3px 8px
      background #49B1F5
      color #eee
    &.darwin
      background transparentify($darwinBg, #000, 0.75)
      &:hover
        background transparentify($darwinBg, #000, 0.85)
    &:hover
      background #333
    &__logo
      width 64px
      height 64px
      float left
    &__content
      float left
      width calc(100% - 72px)
      height 64px
      color #ddd
      margin-left 8px
      display flex
      flex-direction column
      justify-content space-between
      &.disabled
        color #aaa
    &__name
      font-size 16px
      height 22px
      line-height 22px
      // font-weight 600
      font-weight 600
      cursor pointer
      transition all .2s ease-in-out
      &:hover
        color: #1B9EF3
    &__desc
      font-size 14px
      height 21px
      line-height 21px
      overflow hidden
      text-overflow ellipsis
      white-space nowrap
    &__info-bar
      font-size 14px
      height 21px
      line-height 28px
      position relative
    &__author
      overflow hidden
      text-overflow ellipsis
      white-space nowrap
    &__config
      float right
      font-size 16px
      cursor pointer
      transition all .2s ease-in-out
      &:hover
        color: #1B9EF3
    .config-button
      font-size 12px
      color #ddd
      background #222
      padding 1px 8px
      height 18px
      line-height 18px
      text-align center
      position absolute
      top 4px
      right 20px
      transition all .2s ease-in-out
      &.reload
        right 0px
      &.ing
        right 0px
      &.install
        right 0px
        &:hover
          background: #1B9EF3
          color #fff
  .reload-mask
    position absolute
    width calc(100% - 40px)
    bottom -320px
    text-align center
    background rgba(0,0,0,0.4)
    padding 10px 0
    &.cut-width
      width calc(100% - 48px)
</style>
