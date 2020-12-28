<template>
  <div id="main-page">
    <div class="fake-title-bar" :class="{ 'darwin': os === 'darwin' }">
      <div class="fake-title-bar__title">
        PicGo - {{ version }}
      </div>
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
      <el-col
        :span="19"
        :offset="5"
        style="height: 428px"
        class="main-wrapper"
        :class="{ 'darwin': os === 'darwin' }">
        <transition name="picgo-fade" mode="out-in">
          <keep-alive>
            <router-view v-if="$route.meta.keepAlive"></router-view>
          </keep-alive>
        </transition>
        <transition name="picgo-fade" mode="out-in">
          <router-view :key="$route.path" v-if="!$route.meta.keepAlive"></router-view>
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
    <el-dialog
      class="qrcode-dialog"
      top="3vh"
      width="60%"
      title="图床配置二维码"
      :visible.sync="qrcodeVisible"
      :modal-append-to-body="false"
      lock-scroll
    >
      <el-form
        label-position="left"
        label-width="70px"
        size="mini"
      >
        <el-form-item
          label="选择图床"
        >
          <el-select
            v-model="choosedPicBedForQRCode"
            multiple
            collapse-tags
          >
            <el-option
              v-for="item in picBed"
              :key="item.type"
              :label="item.name"
              :value="item.type"
            ></el-option>
          </el-select>
          <el-button
            v-show="choosedPicBedForQRCode.length > 0"
            type="primary"
            round
            class="copy-picbed-config"
            @click="handleCopyPicBedConfig"
          >
            复制图床配置
          </el-button>
        </el-form-item>
      </el-form>
      <div class="qrcode-container">
        <qrcode-vue
          v-show="choosedPicBedForQRCode.length > 0"
          :size="280"
          :value="picBedConfigString"
        />
      </div>
    </el-dialog>
    <input-box-dialog />
  </div>
</template>
<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import QrcodeVue from 'qrcode.vue'
import pick from 'lodash/pick'
import pkg from 'root/package.json'
import keyDetect from '@/utils/key-binding'
import {
  remote,
  ipcRenderer,
  IpcRendererEvent,
  clipboard
} from 'electron'
import db from '#/datastore'
import mixin from '@/utils/mixin'
import InputBoxDialog from '@/components/InputBoxDialog.vue'
const { Menu, dialog, BrowserWindow } = remote
const customLinkRule = (rule: string, value: string, callback: (arg0?: Error) => void) => {
  if (!/\$url/.test(value)) {
    return callback(new Error('必须含有$url'))
  } else {
    return callback()
  }
}
@Component({
  name: 'main-page',
  mixins: [mixin],
  components: {
    InputBoxDialog,
    QrcodeVue
  }
})
export default class extends Vue {
  version = process.env.NODE_ENV === 'production' ? pkg.version : 'Dev'
  defaultActive = 'upload'
  menu: Electron.Menu | null = null
  visible = false
  keyBindingVisible = false
  customLinkVisible = false
  customLink = {
    value: db.get('customLink') || '$url'
  }
  rules = {
    value: [
      { validator: customLinkRule, trigger: 'blur' }
    ]
  }
  os = ''
  shortKey: IShortKeyMap = {
    upload: db.get('shortKey.upload')
  }
  picBed: IPicBedType[] = []
  qrcodeVisible = false
  picBedConfigString = ''
  choosedPicBedForQRCode: string[] = []
  created () {
    this.os = process.platform
    this.buildMenu()
    ipcRenderer.send('getPicBeds')
    ipcRenderer.on('getPicBeds', this.getPicBeds)
  }

  @Watch('choosedPicBedForQRCode')
  choosedPicBedForQRCodeChange (val: string[], oldVal: string[]) {
    if (val.length > 0) {
      this.$nextTick(() => {
        const picBedConfig = db.get('picBed')
        const config = pick(picBedConfig, ...this.choosedPicBedForQRCode)
        this.picBedConfigString = JSON.stringify(config)
      })
    }
  }

  handleSelect (index: string) {
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
  }
  minimizeWindow () {
    const window = BrowserWindow.getFocusedWindow()
    window!.minimize()
  }
  closeWindow () {
    const window = BrowserWindow.getFocusedWindow()
    if (process.platform === 'linux') {
      window!.hide()
    } else {
      window!.close()
    }
  }
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
        label: '生成图床配置二维码',
        click () {
          _this.qrcodeVisible = true
        }
      }
    ]
    this.menu = Menu.buildFromTemplate(template)
  }
  openDialog () {
    // this.menu!.popup(remote.getCurrentWindow())
    this.menu!.popup()
  }
  keyDetect (type: string, event: KeyboardEvent) {
    this.shortKey[type] = keyDetect(event).join('+')
  }
  cancelKeyBinding () {
    this.keyBindingVisible = false
    this.shortKey = db.get('shortKey')
  }
  cancelCustomLink () {
    this.customLinkVisible = false
    this.customLink.value = db.get('customLink') || '$url'
  }
  confirmCustomLink () {
    // @ts-ignore
    this.$refs.customLink.validate((valid: boolean) => {
      if (valid) {
        db.set('customLink', this.customLink.value)
        this.customLinkVisible = false
        ipcRenderer.send('updateCustomLink')
      } else {
        return false
      }
    })
  }
  openMiniWindow () {
    ipcRenderer.send('openMiniWindow')
  }
  handleCopyPicBedConfig () {
    clipboard.writeText(this.picBedConfigString)
    this.$message.success('图床配置复制成功')
  }
  getPicBeds (event: IpcRendererEvent, picBeds: IPicBedType[]) {
    this.picBed = picBeds
  }
  beforeRouteEnter (to: any, from: any, next: any) {
    next((vm: this) => {
      vm.defaultActive = to.name
    })
  }
  beforeDestroy () {
    ipcRenderer.removeListener('getPicBeds', this.getPicBeds)
  }
}
</script>
<style lang='stylus'>
$darwinBg = transparentify(#172426, #000, 0.7)
.picgo-fade
  &-enter,
  &-leave,
  &-leave-active
    opacity 0
  &-enter-active,
  &-leave-active
    transition all 100ms linear
.view-title
  color #eee
  font-size 20px
  text-align center
  margin 10px auto
#main-page
  .qrcode-dialog
    .qrcode-container
      display flex
      justify-content center
    .el-dialog__body
      padding-top 10px
    .copy-picbed-config
      margin-left 10px
    .el-input__inner
      border-radius 14px
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
    &.darwin
      background transparent
      background-image linear-gradient(
        to right,
        transparent 0%,
        transparent 167px,
        $darwinBg 167px,
        $darwinBg 100%
      )
      .fake-title-bar__title
        padding-left 167px
    .handle-bar
      position absolute
      top 2px
      right 4px
      z-index 10000
      -webkit-app-region no-drag
      i
        cursor pointer
        font-size 16px
        margin-left 5px
      .el-icon-minus
        &:hover
          color #409EFF
      .el-icon-close
        &:hover
          color #F15140
      .el-icon-circle-plus-outline
        &:hover
          color #69C282
  .main-wrapper
    &.darwin
      background $darwinBg
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
      cursor poiter
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
