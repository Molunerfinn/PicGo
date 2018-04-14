<template>
  <div id="setting-page">
    <div class="fake-title-bar">
      PicGo - {{ version }}
      <div class="handle-bar" v-if="os === 'win32'">
        <i class="el-icon-minus" @click="minimizeWindow"></i>
        <i class="el-icon-close" @click="closeWindow"></i>
      </div>
    </div>
    <el-row style="padding-top: 22px;" class="main-content">
      <el-col :span="5" class="side-bar-menu">
        <el-menu
          class="picgo-sidebar"
          :default-active="defaultActive"
          @select="handleSelect"
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
            <el-menu-item index="weibo">
              <i class="el-icon-ui-weibo"></i>
              <span slot="title">微博设置</span>
            </el-menu-item>
            <el-menu-item index="qiniu">
              <i class="el-icon-ui-qiniu"></i>
              <span slot="title">七牛云设置</span>
            </el-menu-item>
            <el-menu-item index="tcyun">
              <i class="el-icon-ui-tcyun"></i>
              <span slot="title">腾讯COS设置</span>
            </el-menu-item>
            <el-menu-item index="upyun">
              <i class="el-icon-ui-upyun"></i>
              <span slot="title">又拍云设置</span>
            </el-menu-item>
            <el-menu-item index="github">
              <i class="el-icon-ui-github"></i>
              <span slot="title">GitHub设置</span>
            </el-menu-item>
          </el-submenu>
        </el-menu>
        <i class="el-icon-setting" @click="openDialog"></i>
      </el-col>
      <el-col :span="19" :offset="5">
        <router-view></router-view>
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
import pkg from '../../../package.json'
import keyDetect from 'utils/key-binding'
import { remote } from 'electron'
import db from '../../datastore'
const { Menu, dialog, BrowserWindow } = remote
export default {
  name: 'setting-page',
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
      }
    }
  },
  created () {
    this.os = process.platform
    this.buildMenu()
  },
  methods: {
    handleSelect (index) {
      this.$router.push({
        name: index
      })
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
        },
        {
          label: '修改快捷键',
          click () {
            _this.keyBindingVisible = true
          }
        },
        {
          label: '自定义链接格式',
          click () {
            _this.customLinkVisible = true
          }
        },
        {
          label: '打开更新助手',
          type: 'checkbox',
          checked: _this.$db.get('picBed.showUpdateTip').value(),
          click () {
            const value = _this.$db.read().get('picBed.showUpdateTip').value()
            _this.$db.read().set('picBed.showUpdateTip', !value).write()
          }
        }
      ]
      this.menu = Menu.buildFromTemplate(template)
    },
    openDialog () {
      this.menu.popup(remote.getCurrentWindow)
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
    }
  },
  beforeRouteEnter: (to, from, next) => {
    next(vm => {
      vm.defaultActive = to.name
    })
  }
}
</script>
<style lang='stylus'>
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
      width 40px
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
  .side-bar-menu
    position fixed
    height calc(100vh - 22px)
    overflow-x hidden
    overflow-y auto
    width 170px
    .el-icon-setting
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
</style>