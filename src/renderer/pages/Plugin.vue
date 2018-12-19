<template>
  <div id="plugin-view">
    <div class="view-title">
      插件设置
    </div>
    <el-row class="handle-bar" :class="{ 'cut-width': pluginList.length > 6 }">
      <el-input
        v-model="searchText"
        placeholder="搜索npm上的PicGo插件"
        size="small"
      >
        <i slot="suffix" class="el-input__icon el-icon-close" v-if="searchText" @click="cleanSearch" style="cursor: pointer"></i>
      </el-input>
    </el-row>
    <el-row :gutter="10" class="plugin-list" v-loading="loading">
      <el-col :span="12" v-for="(item, index) in pluginList" :key="item.name">
        <div class="plugin-item">
          <img class="plugin-item__logo" :src="item.logo"
          onerror="this.src='static/logo.png'"
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
                    卸载中
                  </span>
                  <template v-else>
                    <i
                      v-if="item.enabled"
                      class="el-icon-setting"
                      @click="buildContextMenu(item)"
                    ></i>
                    <i
                      v-else="!item.enabled"
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
    <el-dialog
      :visible.sync="dialogVisible"
      :modal-append-to-body="false"
      :title="`配置${configName}`"
      width="70%"
    >
      <config-form
        :config="config"
        :type="currentType"
        :name="configName"
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
<script>
import ConfigForm from '@/components/ConfigForm'
import { debounce } from 'lodash'
export default {
  name: 'plugin',
  components: {
    ConfigForm
  },
  data () {
    return {
      searchText: '',
      pluginList: [],
      menu: null,
      config: [],
      currentType: '',
      configName: '',
      dialogVisible: false,
      pluginNameList: [],
      loading: true
    }
  },
  computed: {
    npmSearchText () {
      return this.searchText.match('picgo-plugin-')
        ? this.searchText
        : this.searchText !== ''
          ? `picgo-plugin-${this.searchText}`
          : this.searchText
    }
  },
  watch: {
    npmSearchText (val) {
      if (val) {
        this.loading = true
        this.pluginList = []
        this.getSearchResult(val)
      } else {
        this.getPluginList()
      }
    }
  },
  created () {
    this.$electron.ipcRenderer.on('pluginList', (evt, list) => {
      this.pluginList = list
      this.pluginNameList = list.map(item => item.name)
      this.loading = false
    })
    this.$electron.ipcRenderer.on('installSuccess', (evt, plugin) => {
      this.loading = false
      this.pluginList.forEach(item => {
        if (item.name === plugin) {
          item.ing = false
          item.hasInstall = true
        }
      })
    })
    this.$electron.ipcRenderer.on('uninstallSuccess', (evt, plugin) => {
      this.loading = false
      this.pluginList = this.pluginList.filter(item => {
        if (item.name === plugin) { // restore Uploader & Transformer after uninstalling
          if (item.config.transformer.name) {
            this.handleRestoreState('transformer')
          }
          if (item.config.uploader.name) {
            this.handleRestoreState('uploader')
          }
        }
        return item.name !== plugin
      })
      this.pluginNameList = this.pluginNameList.filter(item => item !== plugin)
    })
    this.getPluginList()
    this.getSearchResult = debounce(this.getSearchResult, 50)
  },
  methods: {
    buildContextMenu (plugin) {
      const _this = this
      let menu = [{
        label: '启用插件',
        enabled: !plugin.enabled,
        click () {
          _this.$db.read().set(`plugins.picgo-plugin-${plugin.name}`, true).write()
          plugin.enabled = true
        }
      }, {
        label: '禁用插件',
        enabled: plugin.enabled,
        click () {
          _this.$db.read().set(`plugins.picgo-plugin-${plugin.name}`, false).write()
          plugin.enabled = false
        }
      }, {
        label: '卸载插件',
        click () {
          _this.uninstallPlugin(plugin.name)
        }
      }]
      for (let i in plugin.config) {
        if (plugin.config[i].config.length > 0) {
          const obj = {
            label: `配置${i} - ${plugin.config[i].name}`,
            click () {
              _this.currentType = i
              _this.configName = plugin.config[i].name
              _this.dialogVisible = true
              _this.config = plugin.config[i].config
            }
          }
          menu.push(obj)
        }
      }
      this.menu = this.$electron.remote.Menu.buildFromTemplate(menu)
      this.menu.popup(this.$electron.remote.getCurrentWindow())
    },
    getPluginList () {
      this.$electron.ipcRenderer.send('getPluginList')
    },
    installPlugin (item) {
      item.ing = true
      this.$electron.ipcRenderer.send('installPlugin', item.name)
    },
    uninstallPlugin (val) {
      this.pluginList.forEach(item => {
        if (item.name === val) {
          item.ing = true
        }
      })
      this.$electron.ipcRenderer.send('uninstallPlugin', val)
    },
    reloadApp () {
      this.$electron.remote.app.relaunch()
      this.$electron.remote.app.exit(0)
    },
    cleanSearch () {
      this.searchText = ''
    },
    async handleConfirmConfig () {
      const result = await this.$refs.configForm.validate()
      if (result !== false) {
        switch (this.currentType) {
          case 'plugin':
            this.$db.read().set(`picgo-plugin-${this.configName}`, result).write()
            break
          case 'uploader':
            this.$db.read().set(`picBed.${this.configName}`, result).write()
            break
          case 'transformer':
            this.$db.read().set(`transformer.${this.configName}`, result).write()
            break
        }
        const successNotification = new window.Notification('设置结果', {
          body: '设置成功'
        })
        successNotification.onclick = () => {
          return true
        }
        this.dialogVisible = false
        this.getPluginList()
      }
    },
    getSearchResult: function (val) {
      // this.$http.get(`https://api.npms.io/v2/search?q=${val}`)
      this.$http.get(`https://registry.npmjs.com/-/v1/search?text=${val}`)
        .then(res => {
          this.pluginList = res.data.objects.map(item => {
            return this.handleSearchResult(item)
          })
          this.loading = false
        })
        .catch(err => {
          console.log(err)
          this.loading = false
        })
    },
    handleSearchResult (item) {
      const name = item.package.name.replace(/picgo-plugin-/, '')
      return {
        name: name,
        author: item.package.author.name,
        description: item.package.description,
        logo: `https://cdn.jsdelivr.net/npm/${item.package.name}/logo.png`,
        config: {},
        homepage: item.package.links ? item.package.links.homepage : '',
        hasInstall: this.pluginNameList.some(plugin => plugin === item.package.name.replace(/picgo-plugin-/, '')),
        version: item.package.version,
        ing: false // installing or uninstalling
      }
    },
    // restore Uploader & Transformer
    handleRestoreState (item) {
      if (item === 'uploader') {
        this.$db.set('picBed.current', 'smms')
      }
      if (item === 'transformer') {
        this.$db.set('picBed.transformer', 'path')
      }
    },
    openHomepage (url) {
      if (url) {
        this.$electron.remote.shell.openExternal(url)
      }
    }
  },
  beforeDestroy () {
    this.$electron.ipcRenderer.removeAllListeners('pluginList')
    this.$electron.ipcRenderer.removeAllListeners('installSuccess')
    this.$electron.ipcRenderer.removeAllListeners('uninstallSuccess')
  }
}
</script>
<style lang='stylus'>
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
</style>