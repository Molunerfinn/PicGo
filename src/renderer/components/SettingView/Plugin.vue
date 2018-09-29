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
          <div class="plugin-item__content">
            <div class="plugin-item__name">
              {{ item.name }}
            </div>
            <div class="plugin-item__desc">
              {{ item.description }}
            </div>
            <div class="plugin-item__info-bar">
              <span class="plugin-item__author">
                {{ item.author }}
              </span>
              <span class="plugin-item__config" >
                <template v-if="searchText">
                  <span class="config-button install" v-if="!item.hasInstall" @click="installPlugin(item.name)">
                    安装
                  </span>
                  <span class="config-button" v-if="item.reload" @click="reloadApp">
                    重启
                  </span>
                </template>
                <i
                  v-else
                  class="el-icon-setting"
                  @click="buildContextMenu(item)"
                ></i>
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
import ConfigForm from '../ConfigForm'
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
        this.getSearchResult(val)
      } else {
        this.getPluginList()
      }
    }
  },
  created () {
    this.$electron.ipcRenderer.on('pluginList', (evt, list) => {
      this.pluginList = list.map(item => item)
      this.pluginNameList = list.map(item => item.name)
      this.loading = false
    })
    this.getPluginList()
    this.getSearchResult = debounce(this.getSearchResult, 250)
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
          // plugin.reload = true
        }
      }, {
        label: '禁用插件',
        enabled: plugin.enabled,
        click () {
          _this.$db.read().set(`plugins.picgo-plugin-${plugin.name}`, false).write()
          plugin.enabled = false
          // plugin.reload = true
        }
      }, {
        label: '卸载插件',
        click () {
          _this.loading = true
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
    installPlugin (val) {
      this.$electron.ipcRenderer.send('installPlugin', val)
    },
    uninstallPlugin (val) {
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
      this.$http.get(`https://api.npms.io/v2/search?q=${val}`)
        .then(res => {
          console.log(res.data.results)
          this.pluginList = res.data.results.map(item => {
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
      return {
        name: item.package.name.replace(/picgo-plugin-/, ''),
        author: item.package.author.name,
        description: item.package.description,
        logo: `https://cdn.jsdelivr.net/npm/${item.package.name}/logo.png`,
        config: {},
        homepage: item.package.links ? item.package.links.homepage : '',
        hasInstall: this.pluginNameList.some(plugin => plugin === item.package.name),
        installing: false,
        reload: false
      }
    }
  }
}
</script>
<style lang='stylus'>
#plugin-view
  position relative
  padding 0 20px 0
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
    cursor pointer
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
      color #aaa
      margin-left 8px
      display flex
      flex-direction column
      justify-content space-between
    &__name
      font-size 16px
      height 22px
      line-height 22px
      // font-weight 600
      font-weight 600
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
      &:hover
        background: #1B9EF3
        color #fff
      &.install
        right 0px
</style>