<template>
  <div id="plugin-view">
    <div class="view-title">
      插件设置
    </div>
    <el-row class="handle-bar">
      <el-input
        v-model="searchText"
        placeholder="搜索npm上的PicGo插件"
        size="small"
      ></el-input>
    </el-row>
    <el-row :gutter="10" class="plugin-list">
      <el-col :span="12" v-for="(item, index) in pluginList" :key="item.name">
        <div class="plugin-item">
          <img class="plugin-item__logo" :src="'file://' + item.logo">
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
                <span class="reload-button" v-if="item.reload" @click="reloadApp">
                  重启
                </span>
                <i
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
      dialogVisible: false
    }
  },
  created () {
    this.$electron.ipcRenderer.on('pluginList', (evt, list) => {
      this.pluginList = list.map(item => {
        item.reload = false
        return item
      })
    })
    this.getPluginList()
    document.addEventListener('keydown', (e) => {
      if (e.which === 123) {
        this.$electron.remote.getCurrentWindow().toggleDevTools()
      }
    })
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
          plugin.reload = true
        }
      }, {
        label: '禁用插件',
        enabled: plugin.enabled,
        click () {
          _this.$db.read().set(`plugins.picgo-plugin-${plugin.name}`, false).write()
          plugin.enabled = false
          plugin.reload = true
        }
      }]
      for (let i in plugin.config) {
        if (plugin.config[i].config.length > 0) {
          const obj = {
            label: `配置${i} - ${plugin.config[i].name}`,
            click () {
              _this.configType = i
              _this.configName = plugin.config[i].name
              _this.dialogVisible = true
              _this.config = plugin.config[i].config
              console.log(plugin.config[i].config)
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
    reloadApp () {
      this.$electron.remote.app.relaunch()
      this.$electron.remote.app.exit(0)
    },
    handleConfirmConfig () {
      console.log(this.$refs.configForm)
      this.$refs.configForm.validate()
    }
  }
}
</script>
<style lang='stylus'>
.view-title
  color #eee
  font-size 20px
  text-align center
  margin 10px auto
#plugin-view
  padding 0 20px 0
  .handle-bar
    margin-bottom 20px
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
    .reload-button
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
</style>