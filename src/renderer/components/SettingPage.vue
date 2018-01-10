<template>
  <div id="setting-page">
    <div class="fake-title-bar">
      PicGo - {{ version }}
    </div>
    <el-row style="padding-top: 22px;">
      <el-col :span="5">
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
          <i class="el-icon-setting" @click="openDialog"></i>
        </el-menu>
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
  </div>
</template>
<script>
import pkg from '../../../package.json'
import { remote } from 'electron'
const { Menu, dialog } = remote
export default {
  name: 'setting-page',
  data () {
    return {
      version: pkg.version,
      defaultActive: 'upload',
      menu: null,
      visible: false
    }
  },
  created () {
    this.buildMenu()
  },
  methods: {
    handleSelect (index) {
      this.$router.push({
        name: index
      })
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
      this.menu.popup(remote.getCurrentWindow)
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
  .picgo-sidebar
    height calc(100vh - 22px)
  .el-menu
    border-right none
    background transparent
    position fixed
    .el-icon-setting
      position absolute
      bottom 4px
      left 4px
      cursor pointer
      color #878d99
      transition .2s all ease-in-out
      &:hover
        color #409EFF
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
  .support
    text-align center
    &-title
      text-align center
      color #878d99
</style>