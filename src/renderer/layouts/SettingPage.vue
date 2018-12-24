<template>
  <div id="setting-page">
    <div class="fake-title-bar">
      PicGo - {{ version }}
      <div class="handle-bar" v-if="os !== 'darwin'">
        <i class="el-icon-minus" @click="minimizeWindow"></i>
        <i class="el-icon-circle-plus-outline" @click="openMiniWindow"></i>
        <i class="el-icon-close" @click="closeWindow"></i>
      </div>
    </div>
    <el-row style="padding-top: 22px;" class="main-content">
      <el-col :span="5" class="side-bar-menu">
        <el-menu
          class="picgo-sidebar"
          :default-active="defaultActive"
          @select="handleSelect"
          :unique-opened="true"
          >
          <el-menu-item index="upload">
            <i class="el-icon-upload"></i>
            <span slot="title">上传区</span>
          </el-menu-item>
          <el-menu-item index="gallery">
            <i class="el-icon-picture"></i>
            <span slot="title">相册</span>
          </el-menu-item>
          <el-submenu
            index="sub-menu"
          >
            <template slot="title">
              <i class="el-icon-menu"></i>
              <span>图床设置</span>
            </template>
            <template
              v-for="item in picBed"
            >
              <el-menu-item
                v-if="item.visible"
                :index="`picbeds-${item.type}`"
                :key="item.type"
              >
                <!-- <i :class="`el-icon-ui-${item.type}`"></i> -->
                <span slot="title">{{ item.name }}</span>
              </el-menu-item>
            </template>
          </el-submenu>
          <el-menu-item index="setting">
            <i class="el-icon-setting"></i>
            <span slot="title">PicGo设置</span>
          </el-menu-item>
          <el-menu-item index="plugin">
            <i class="el-icon-share"></i>
            <span slot="title">插件设置</span>
          </el-menu-item>
        </el-menu>
        <i class="el-icon-info setting-window" @click="openDialog"></i>
      </el-col>
      <el-col :span="19" :offset="5" style="height: 428px">
        <transition name="picgo-fade" mode="out-in">
          <router-view :key="$route.params ? $route.params.type : $route.path"></router-view>
        </transition>
      </el-col>
    </el-row>
    <el-dialog
      title="赞助PicGo"
      :visible.sync="visible"
      width="70%"
      top="10vh"
    >
      PicGo是免费开源的软件，如果你喜欢它，对你有帮助，不妨请我喝杯咖啡？
      <el-row class="support">
        <el-col :span="12">
          <img src="https://user-images.githubusercontent.com/12621342/34188165-e7cdf372-e56f-11e7-8732-1338c88b9bb7.jpg" alt="支付宝">
          <div class="support-title">支付宝</div>
        </el-col>
        <el-col :span="12">
          <img src="https://user-images.githubusercontent.com/12621342/34188201-212cda84-e570-11e7-9b7a-abb298699d85.jpg" alt="支付宝">
          <div class="support-title">微信</div>
        </el-col>
      </el-row>
    </el-dialog>
    <el-dialog
      title="修改快捷键"
      :visible.sync="keyBindingVisible"
    >
      <el-form
        label-width="80px"
      >
        <el-form-item
          label="快捷上传"
        >
          <el-input 
            class="align-center"
            @keydown.native.prevent="keyDetect('upload', $event)"
            v-model="shortKey.upload"
            :autofocus="true"
          ></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="cancelKeyBinding">取消</el-button>
        <el-button type="primary" @click="confirmKeyBinding">确定</el-button>
      </span>
    </el-dialog>
    <el-dialog
      title="自定义链接格式"
      :visible.sync="customLinkVisible"
    >
      <el-form
        label-position="top"
        :model="customLink"
        ref="customLink"
        :rules="rules"
      >
        <el-form-item
          label="用占位符$url来表示url的位置"
          prop="value"
        >
          <el-input 
            class="align-center"
            v-model="customLink.value"
            :autofocus="true"
          ></el-input>
        </el-form-item>
      </el-form>
      <div>
        如[]($url)
      </div>
      <span slot="footer">
        <el-button @click="cancelCustomLink">取消</el-button>
        <el-button type="primary" @click="confirmCustomLink">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>
<script>
import pkg from 'root/package.json'
import keyDetect from 'utils/key-binding'
import { remote } from 'electron'
import db from '~/datastore'
import mixin from '@/utils/mixin'
const { Menu, dialog, BrowserWindow } = remote
export default {
  name: 'setting-page',
  mixins: [mixin],
  data () {
    const customLinkRule = (rule, value, callback) => {
      if (!/\$url/.test(value)) {
        return callback(new Error('必须含有$url'))
      } else {
        return callback()
      }
    }
    return {
      version: process.env.NODE_ENV === 'production' ? pkg.version : 'Dev',
      defaultActive: 'upload',
      menu: null,
      visible: false,
      keyBindingVisible: false,
      customLinkVisible: false,
      customLink: {
        value: db.read().get('customLink').value() || '$url'
      },
      rules: {
        value: [
          { validator: customLinkRule, trigger: 'blur' }
        ]
      },
      os: '',
      shortKey: {
        upload: db.read().get('shortKey.upload').value()
      },
      picBed: []
    }
  },
  created () {
    this.os = process.platform
    this.buildMenu()
    this.$electron.ipcRenderer.send('getPicBeds')
    this.$electron.ipcRenderer.on('getPicBeds', this.getPicBeds)
  },
  methods: {
    handleSelect (index) {
      const type = index.match(/picbeds-/)
      if (type === null) {
        this.$router.push({
          name: index
        })
      } else {
        const picBed = index.replace(/picbeds-/, '')
        if (this.$builtInPicBed.includes(picBed)) {
          this.$router.push({
            name: picBed
          })
        } else {
          this.$router.push({
            name: 'others',
            params: {
              type: picBed
            }
          })
        }
      }
    },
    minimizeWindow () {
      const window = BrowserWindow.getFocusedWindow()
      window.minimize()
    },
    closeWindow () {
      const window = BrowserWindow.getFocusedWindow()
      window.close()
    },
    buildMenu () {
      const _this = this
      const template = [
        {
          label: '关于',
          click () {
            dialog.showMessageBox({
              title: 'PicGo',
              message: 'PicGo',
              detail: `Version: ${pkg.version}\nAuthor: Molunerfinn\nGithub: https://github.com/Molunerfinn/PicGo`
            })
          }
        },
        {
          label: '赞助PicGo',
          click () {
            _this.visible = true
          }
        }
      ]
      this.menu = Menu.buildFromTemplate(template)
    },
    openDialog () {
      this.menu.popup(remote.getCurrentWindow())
    },
    keyDetect (type, event) {
      this.shortKey[type] = keyDetect(event).join('+')
    },
    cancelKeyBinding () {
      this.keyBindingVisible = false
      this.shortKey = db.read().get('shortKey').value()
    },
    confirmKeyBinding () {
      const oldKey = db.read().get('shortKey').value()
      db.read().set('shortKey', this.shortKey).write()
      this.keyBindingVisible = false
      this.$electron.ipcRenderer.send('updateShortKey', oldKey)
    },
    cancelCustomLink () {
      this.customLinkVisible = false
      this.customLink.value = db.read().get('customLink').value() || '$url'
    },
    confirmCustomLink () {
      this.$refs.customLink.validate((valid) => {
        if (valid) {
          db.read().set('customLink', this.customLink.value).write()
          this.customLinkVisible = false
          this.$electron.ipcRenderer.send('updateCustomLink')
        } else {
          return false
        }
      })
    },
    openMiniWindow () {
      this.$electron.ipcRenderer.send('openMiniWindow')
    },
    getPicBeds (event, picBeds) {
      this.picBed = picBeds
    }
  },
  beforeRouteEnter: (to, from, next) => {
    next(vm => {
      vm.defaultActive = to.name
    })
  },
  beforeDestroy () {
    this.$electron.ipcRenderer.removeListener('getPicBeds', this.getPicBeds)
  }
}
</script>
<style lang='stylus'>
.picgo-fade
  &-enter,
  &-leave,
  &-leave-active
    opacity 0
  &-enter-active,
  &-leave-active
    transition opacity 100ms linear
.view-title
  color #eee
  font-size 20px
  text-align center
  margin 10px auto
#setting-page
  .fake-title-bar
    -webkit-app-region drag
    height h = 22px
    width 100%
    text-align center
    color #eee
    font-size 12px
    line-height h
    position fixed
    z-index 100
    .handle-bar
      position absolute
      top 2px
      right 4px
      width 60px
      z-index 10000
      -webkit-app-region no-drag
      i
        cursor pointer
        font-size 16px
      .el-icon-minus
        &:hover
          color #409EFF
      .el-icon-close
        &:hover
          color #F15140
      .el-icon-circle-plus-outline
        &:hover
          color #69C282
  .side-bar-menu
    position fixed
    height calc(100vh - 22px)
    overflow-x hidden
    overflow-y auto
    width 170px
    .el-icon-info.setting-window
      position fixed 
      bottom 4px
      left 4px
      cursor pointer
      color #878d99
      transition .2s all ease-in-out
      &:hover
        color #409EFF
  .el-menu
    border-right none
    background transparent
    width 170px
    &-item
      color #eee
      position relative
      &:focus,
      &:hover
        color #fff
        background transparent
      &.is-active
        color active-color = #409EFF
        &:before
          content ''
          position absolute
          width 3px 
          height 20px
          right 0
          top 18px
          background active-color
  .el-submenu__title
    span
      color #eee
    &:hover
      background transparent
      span
        color #fff
  .el-submenu
    .el-menu-item
      min-width 166px
      &.is-active
        &:before
          top 16px
  .main-content
    padding-top 22px
    position relative
    z-index 10
  .el-dialog__body 
    padding 20px
  .support
    text-align center
    &-title
      text-align center
      color #878d99
  .align-center
    input
      text-align center
*::-webkit-scrollbar
  width 8px
  height 8px
*::-webkit-scrollbar-thumb
  border-radius 4px
  background #6f6f6f
*::-webkit-scrollbar-track
  background-color transparent
</style>