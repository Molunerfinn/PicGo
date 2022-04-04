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
          @open="handleGetPicPeds"
          >
          <el-menu-item index="upload">
            <i class="el-icon-upload"></i>
            <span slot="title">{{ $T('UPLOAD_AREA') }}</span>
          </el-menu-item>
          <el-menu-item index="gallery">
            <i class="el-icon-picture"></i>
            <span slot="title">{{ $T('GALLERY') }}</span>
          </el-menu-item>
          <el-submenu
            index="sub-menu"
          >
            <template slot="title">
              <i class="el-icon-menu"></i>
              <span>{{ $T('PICBEDS_SETTINGS') }}</span>
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
            <span slot="title">{{ $T('PICGO_SETTINGS') }}</span>
          </el-menu-item>
          <el-menu-item index="plugin">
            <i class="el-icon-share"></i>
            <span slot="title">{{ $T('PLUGIN_SETTINGS') }}</span>
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
            <router-view v-if="$route && $route.meta && $route.meta.keepAlive"></router-view>
          </keep-alive>
        </transition>
        <transition name="picgo-fade" mode="out-in">
          <router-view :key="$route.path" v-if="!($route && $route.meta && $route.meta.keepAlive)"></router-view>
        </transition>
      </el-col>
    </el-row>
    <el-dialog
      :title="$T('SPONSOR_PICGO')"
      :visible.sync="visible"
      width="70%"
      top="10vh"
    >
      {{ $T('PICGO_SPONSOR_TEXT') }}
      <el-row class="support">
        <el-col :span="12">
          <img src="https://user-images.githubusercontent.com/12621342/34188165-e7cdf372-e56f-11e7-8732-1338c88b9bb7.jpg" :alt="$T('ALIPAY')">
          <div class="support-title">{{ $T('ALIPAY') }}</div>
        </el-col>
        <el-col :span="12">
          <img src="https://user-images.githubusercontent.com/12621342/34188201-212cda84-e570-11e7-9b7a-abb298699d85.jpg" :alt="$T('WECHATPAY')">
          <div class="support-title">{{ $T('WECHATPAY') }}</div>
        </el-col>
      </el-row>
    </el-dialog>
    <el-dialog
      class="qrcode-dialog"
      top="3vh"
      width="60%"
      :title="$T('PICBED_QRCODE')"
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
          :label="$T('CHOOSE_PICBED')"
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
            {{ $T('COPY_PICBED_CONFIG') }}
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
import {
  ipcRenderer,
  IpcRendererEvent,
  clipboard
} from 'electron'
import mixin from '@/utils/mixin'
import InputBoxDialog from '@/components/InputBoxDialog.vue'
import {
  MINIMIZE_WINDOW,
  CLOSE_WINDOW,
  SHOW_MAIN_PAGE_MENU,
  SHOW_MAIN_PAGE_QRCODE,
  SHOW_MAIN_PAGE_DONATION
} from '~/universal/events/constants'
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
  visible = false
  keyBindingVisible = false
  customLinkVisible = false
  os = ''
  picBed: IPicBedType[] = []
  qrcodeVisible = false
  picBedConfigString = ''
  choosedPicBedForQRCode: string[] = []
  created () {
    this.os = process.platform
    ipcRenderer.send('getPicBeds')
    ipcRenderer.on('getPicBeds', this.getPicBeds)
    this.handleGetPicPeds()
    ipcRenderer.on(SHOW_MAIN_PAGE_QRCODE, () => {
      this.qrcodeVisible = true
    })
    ipcRenderer.on(SHOW_MAIN_PAGE_DONATION, () => {
      this.visible = true
    })
  }

  @Watch('choosedPicBedForQRCode')
  choosedPicBedForQRCodeChange (val: string[]) {
    if (val.length > 0) {
      this.$nextTick(async () => {
        const picBedConfig = await this.getConfig('picBed')
        const config = pick(picBedConfig, ...this.choosedPicBedForQRCode)
        this.picBedConfigString = JSON.stringify(config)
      })
    }
  }

  handleGetPicPeds = () => {
    ipcRenderer.send('getPicBeds')
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
    ipcRenderer.send(MINIMIZE_WINDOW)
  }

  closeWindow () {
    ipcRenderer.send(CLOSE_WINDOW)
  }

  openDialog () {
    ipcRenderer.send(SHOW_MAIN_PAGE_MENU)
  }

  openMiniWindow () {
    ipcRenderer.send('openMiniWindow')
  }

  handleCopyPicBedConfig () {
    clipboard.writeText(this.picBedConfigString)
    this.$message.success(this.$T('COPY_PICBED_CONFIG_SUCCEED'))
  }

  getPicBeds (event: IpcRendererEvent, picBeds: IPicBedType[]) {
    this.picBed = picBeds
  }

  beforeRouteEnter (to: any, next: any) {
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
.setting-list-scroll
  height 425px
  overflow-y auto
  overflow-x hidden
  margin-right 0!important
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
