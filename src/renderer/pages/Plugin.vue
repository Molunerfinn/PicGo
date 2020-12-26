<template>
  <div id="plugin-view">
    <div class="view-title">
      插件设置 - <i class="el-icon-goods" @click="goAwesomeList"></i>
    </div>
    <el-row class="handle-bar" :class="{ 'cut-width': pluginList.length > 6 }">
      <el-input
        v-model="searchText"
        placeholder="搜索npm上的PicGo插件，或者点击上方按钮查看优秀插件列表"
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
                      安装
                    </span>
                    <span v-else-if="item.ing" class="config-button ing">
                      安装中
                    </span>
                  </template>
                  <span v-else class="config-button ing">
                    已安装
                  </span>
                </template>
                <template v-else>
                  <span v-if="item.ing" class="config-button ing">
                    进行中
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
      <el-button type="primary" @click="reloadApp" size="mini" round>重启以生效</el-button>
    </el-row>
    <el-dialog
      :visible.sync="dialogVisible"
      :modal-append-to-body="false"
      :title="`配置${configName}`"
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
        <el-button @click="dialogVisible = false" round>取消</el-button>
        <el-button type="primary" @click="handleConfirmConfig" round>确定</el-button>
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
  remote,
  IpcRendererEvent
} from 'electron'
import { handleStreamlinePluginName } from '~/universal/utils/common'
const { Menu } = remote

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
  created () {
    this.os = process.platform
    ipcRenderer.on('pluginList', (evt: IpcRendererEvent, list: IPicGoPlugin[]) => {
      this.pluginList = list
      this.pluginNameList = list.map(item => item.fullName)
      this.loading = false
    })
    ipcRenderer.on('installSuccess', (evt: IpcRendererEvent, plugin: string) => {
      this.loading = false
      this.pluginList.forEach(item => {
        if (item.fullName === plugin) {
          item.ing = false
          item.hasInstall = true
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
    this.getPluginList()
    this.getSearchResult = debounce(this.getSearchResult, 50)
    this.needReload = this.$db.get('needReload')
  }
  buildContextMenu (plugin: IPicGoPlugin) {
    const _this = this
    let menu = [{
      label: '启用插件',
      enabled: !plugin.enabled,
      click () {
        _this.letPicGoSaveData({
          [`picgoPlugins.${plugin.fullName}`]: true
        })
        plugin.enabled = true
        _this.getPicBeds()
      }
    }, {
      label: '禁用插件',
      enabled: plugin.enabled,
      click () {
        _this.letPicGoSaveData({
          [`picgoPlugins.${plugin.fullName}`]: false
        })
        plugin.enabled = false
        _this.getPicBeds()
        if (plugin.config.transformer.name) {
          _this.handleRestoreState('transformer', plugin.config.transformer.name)
        }
        if (plugin.config.uploader.name) {
          _this.handleRestoreState('uploader', plugin.config.uploader.name)
        }
      }
    }, {
      label: '卸载插件',
      click () {
        _this.uninstallPlugin(plugin.fullName)
      }
    }, {
      label: '更新插件',
      click () {
        _this.updatePlugin(plugin.fullName)
      }
    }]
    for (let i in plugin.config) {
      if (plugin.config[i].config.length > 0) {
        const obj = {
          label: `配置${i} - ${plugin.config[i].fullName || plugin.config[i].name}`,
          click () {
            _this.currentType = i
            _this.configName = plugin.config[i].fullName || plugin.config[i].name
            _this.dialogVisible = true
            _this.config = plugin.config[i].config
          }
        }
        menu.push(obj)
      }
    }

    // handle transformer
    if (plugin.config.transformer.name) {
      let currentTransformer = this.$db.get('picBed.transformer') || 'path'
      let pluginTransformer = plugin.config.transformer.name
      const obj = {
        label: `${currentTransformer === pluginTransformer ? '禁用' : '启用'}transformer - ${plugin.config.transformer.name}`,
        click () {
          _this.toggleTransformer(plugin.config.transformer.name)
        }
      }
      menu.push(obj)
    }

    // plugin custom menus
    if (plugin.guiMenu) {
      menu.push({
        // @ts-ignore
        type: 'separator'
      })
      for (let i of plugin.guiMenu) {
        menu.push({
          label: i.label,
          click () {
            ipcRenderer.send('pluginActions', plugin.fullName, i.label)
          }
        })
      }
    }

    this.menu = Menu.buildFromTemplate(menu)
    this.menu.popup()
  }
  getPluginList () {
    ipcRenderer.send('getPluginList')
  }
  getPicBeds () {
    ipcRenderer.send('getPicBeds')
  }
  installPlugin (item: IPicGoPlugin) {
    if (!item.gui) {
      this.$confirm('该插件未对可视化界面进行优化, 是否继续安装?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        item.ing = true
        ipcRenderer.send('installPlugin', item.name)
      }).catch(() => {
        console.log('Install canceled')
      })
    } else {
      item.ing = true
      ipcRenderer.send('installPlugin', item.name)
    }
  }
  uninstallPlugin (val: string) {
    this.pluginList.forEach(item => {
      if (item.name === val) {
        item.ing = true
      }
    })
    ipcRenderer.send('uninstallPlugin', val)
  }
  updatePlugin (val: string) {
    this.pluginList.forEach(item => {
      if (item.fullName === val) {
        item.ing = true
      }
    })
    ipcRenderer.send('updatePlugin', val)
  }
  reloadApp () {
    remote.app.relaunch()
    remote.app.exit(0)
  }
  handleReload () {
    this.$db.set('needReload', true)
    this.needReload = true
    const successNotification = new Notification('更新成功', {
      body: '请点击此通知重启应用以生效'
    })
    successNotification.onclick = () => {
      this.reloadApp()
    }
  }
  cleanSearch () {
    this.searchText = ''
  }
  toggleTransformer (transformer: string) {
    let currentTransformer = this.$db.get('picBed.transformer') || 'path'
    if (currentTransformer === transformer) {
      this.letPicGoSaveData({
        'picBed.transformer': 'path'
      })
    } else {
      this.letPicGoSaveData({
        'picBed.transformer': transformer
      })
    }
  }
  async handleConfirmConfig () {
    // @ts-ignore
    const result = await this.$refs.configForm.validate()
    if (result !== false) {
      switch (this.currentType) {
        case 'plugin':
          this.letPicGoSaveData({
            [`${this.configName}`]: result
          })
          break
        case 'uploader':
          this.letPicGoSaveData({
            [`picBed.${this.configName}`]: result
          })
          break
        case 'transformer':
          this.letPicGoSaveData({
            [`transformer.${this.configName}`]: result
          })
          break
      }
      const successNotification = new Notification('设置结果', {
        body: '设置成功'
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
  handleRestoreState (item: string, name: string) {
    if (item === 'uploader') {
      const current = this.$db.get('picBed.current')
      if (current === name) {
        this.letPicGoSaveData({
          'picBed.current': 'smms',
          'picBed.uploader': 'smms'
        })
      }
    }
    if (item === 'transformer') {
      const current = this.$db.get('picBed.transformer')
      if (current === name) {
        this.letPicGoSaveData({
          'picBed.transformer': 'path'
        })
      }
    }
  }
  openHomepage (url: string) {
    if (url) {
      remote.shell.openExternal(url)
    }
  }
  goAwesomeList () {
    remote.shell.openExternal('https://github.com/PicGo/Awesome-PicGo')
  }
  letPicGoSaveData (data: IObj) {
    ipcRenderer.send('picgoSaveData', data)
  }
  beforeDestroy () {
    ipcRenderer.removeAllListeners('pluginList')
    ipcRenderer.removeAllListeners('installSuccess')
    ipcRenderer.removeAllListeners('uninstallSuccess')
    ipcRenderer.removeAllListeners('updateSuccess')
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
    i.el-icon-goods
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
