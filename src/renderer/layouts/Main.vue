<template>
  <div id="main-page">
    <div
      class="fake-title-bar"
      :class="{ 'darwin': os === 'darwin' }"
    >
      <div class="fake-title-bar__title">
        PicGo - {{ version }}
      </div>
      <div
        v-if="os !== 'darwin'"
        class="handle-bar"
      >
        <el-icon
          class="minus"
          @click="minimizeWindow"
        >
          <Minus />
        </el-icon>
        <el-icon
          class="plus"
          @click="openMiniWindow"
        >
          <CirclePlus />
        </el-icon>
        <el-icon
          class="close"
          @click="closeWindow"
        >
          <Close />
        </el-icon>
      </div>
    </div>
    <el-row
      style="padding-top: 22px;"
      class="main-content"
    >
      <el-col
        class="side-bar-menu"
      >
        <el-menu
          class="picgo-sidebar"
          :default-active="defaultActive"
          :unique-opened="true"
          @select="handleSelect"
          @open="handleGetPicPeds"
        >
          <el-menu-item :index="routerConfig.UPLOAD_PAGE">
            <el-icon>
              <UploadFilled />
            </el-icon>
            <span>{{ $T('UPLOAD_AREA') }}</span>
          </el-menu-item>
          <el-menu-item :index="routerConfig.GALLERY_PAGE">
            <el-icon>
              <PictureFilled />
            </el-icon>
            <span>{{ $T('GALLERY') }}</span>
          </el-menu-item>
          <el-sub-menu
            index="sub-menu"
          >
            <template #title>
              <el-icon>
                <Menu />
              </el-icon>
              <span>{{ $T('PICBEDS_SETTINGS') }}</span>
            </template>
            <template
              v-for="item in picBed"
            >
              <el-menu-item
                v-if="item.visible"
                :key="item.type"
                :index="`${routerConfig.UPLOADER_CONFIG_PAGE}-${item.type}`"
              >
                <span>{{ item.name }}</span>
              </el-menu-item>
            </template>
          </el-sub-menu>
          <el-menu-item :index="routerConfig.SETTING_PAGE">
            <el-icon>
              <Setting />
            </el-icon>
            <span>{{ $T('PICGO_SETTINGS') }}</span>
          </el-menu-item>
          <el-menu-item :index="routerConfig.PLUGIN_PAGE">
            <el-icon>
              <Share />
            </el-icon>
            <span>{{ $T('PLUGIN_SETTINGS') }}</span>
          </el-menu-item>
        </el-menu>
        <el-icon
          class="info-window"
          @click="openMenu"
        >
          <InfoFilled />
        </el-icon>
      </el-col>
      <el-col
        :span="19"
        :offset="5"
        style="height: 428px"
        class="main-wrapper"
        :class="{ 'darwin': os === 'darwin' }"
      >
        <router-view
          v-slot="{ Component }"
        >
          <transition
            name="picgo-fade"
            mode="out-in"
          >
            <keep-alive :include="keepAlivePages">
              <component
                :is="Component"
              />
            </keep-alive>
          </transition>
        </router-view>
      </el-col>
    </el-row>
    <el-dialog
      v-model="visible"
      :title="$T('SPONSOR_PICGO')"
      width="70%"
      top="10vh"
    >
      {{ $T('PICGO_SPONSOR_TEXT') }}
      <el-row class="support">
        <el-col :span="12">
          <img
            src="https://user-images.githubusercontent.com/12621342/34188165-e7cdf372-e56f-11e7-8732-1338c88b9bb7.jpg"
            :alt="$T('ALIPAY')"
          >
          <div class="support-title">
            {{ $T('ALIPAY') }}
          </div>
        </el-col>
        <el-col :span="12">
          <img
            src="https://user-images.githubusercontent.com/12621342/34188201-212cda84-e570-11e7-9b7a-abb298699d85.jpg"
            :alt="$T('WECHATPAY')"
          >
          <div class="support-title">
            {{ $T('WECHATPAY') }}
          </div>
        </el-col>
      </el-row>
    </el-dialog>
    <el-dialog
      v-model="qrcodeVisible"
      class="qrcode-dialog"
      top="3vh"
      width="60%"
      :title="$T('PICBED_QRCODE')"
      :modal-append-to-body="false"
      lock-scroll
    >
      <el-form
        label-position="left"
        label-width="70px"
        size="small"
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
            />
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
<script lang="ts" setup>
// import { Component, Vue, Watch } from 'vue-property-decorator'
import {
  Setting,
  UploadFilled,
  PictureFilled,
  Menu,
  Share,
  InfoFilled,
  Minus,
  CirclePlus,
  Close
} from '@element-plus/icons-vue'
import { ElMessage as $message } from 'element-plus'
import { T as $T } from '@/i18n/index'
import { ref, onBeforeUnmount, Ref, onBeforeMount, watch, nextTick, reactive } from 'vue'
import { onBeforeRouteUpdate, useRouter } from 'vue-router'
import QrcodeVue from 'qrcode.vue'
import pick from 'lodash/pick'
import pkg from 'root/package.json'
import * as config from '@/router/config'
import {
  ipcRenderer,
  IpcRendererEvent,
  clipboard
} from 'electron'
import InputBoxDialog from '@/components/dialog/InputBoxDialog.vue'
import {
  MINIMIZE_WINDOW,
  CLOSE_WINDOW,
  SHOW_MAIN_PAGE_MENU,
  SHOW_MAIN_PAGE_QRCODE,
  SHOW_MAIN_PAGE_DONATION,
  GET_PICBEDS
} from '~/universal/events/constants'
import { getConfig, sendToMain } from '@/utils/dataSender'
const version = ref(process.env.NODE_ENV === 'production' ? pkg.version : 'Dev')
const routerConfig = reactive(config)
const defaultActive = ref(routerConfig.UPLOAD_PAGE)
const visible = ref(false)
const os = ref('')
const $router = useRouter()
const picBed: Ref<IPicBedType[]> = ref([])
const qrcodeVisible = ref(false)
const picBedConfigString = ref('')
const choosedPicBedForQRCode: Ref<string[]> = ref([])

const keepAlivePages = $router.getRoutes().filter(item => item.meta.keepAlive).map(item => item.name as string)

onBeforeMount(() => {
  os.value = process.platform
  sendToMain(GET_PICBEDS)
  ipcRenderer.on(GET_PICBEDS, getPicBeds)
  handleGetPicPeds()
  ipcRenderer.on(SHOW_MAIN_PAGE_QRCODE, () => {
    qrcodeVisible.value = true
  })
  ipcRenderer.on(SHOW_MAIN_PAGE_DONATION, () => {
    visible.value = true
  })
})

watch(() => choosedPicBedForQRCode, (val) => {
  if (val.value.length > 0) {
    nextTick(async () => {
      const picBedConfig = await getConfig('picBed')
      const config = pick(picBedConfig, ...choosedPicBedForQRCode.value)
      picBedConfigString.value = JSON.stringify(config)
    })
  }
}, { deep: true })

const handleGetPicPeds = () => {
  sendToMain(GET_PICBEDS)
}

const handleSelect = (index: string) => {
  defaultActive.value = index
  const type = index.match(routerConfig.UPLOADER_CONFIG_PAGE)
  if (type === null) {
    $router.push({
      name: index
    })
  } else {
    const type = index.replace(`${routerConfig.UPLOADER_CONFIG_PAGE}-`, '')
    $router.push({
      name: routerConfig.UPLOADER_CONFIG_PAGE,
      params: {
        type
      }
    })
    // if (this.$builtInPicBed.includes(picBed)) {
    //   this.$router.push({
    //     name: picBed
    //   })
    // } else {
    //   this.$router.push({
    //     name: 'others',
    //     params: {
    //       type: picBed
    //     }
    //   })
    // }
  }
}

function minimizeWindow () {
  sendToMain(MINIMIZE_WINDOW)
}

function closeWindow () {
  sendToMain(CLOSE_WINDOW)
}

function openMenu () {
  sendToMain(SHOW_MAIN_PAGE_MENU)
}

function openMiniWindow () {
  sendToMain('openMiniWindow')
}

function handleCopyPicBedConfig () {
  clipboard.writeText(picBedConfigString.value)
  $message.success($T('COPY_PICBED_CONFIG_SUCCEED'))
}

function getPicBeds (event: IpcRendererEvent, picBeds: IPicBedType[]) {
  picBed.value = picBeds
}

onBeforeRouteUpdate(async (to) => {
  if (to.params.type) {
    defaultActive.value = `${routerConfig.UPLOADER_CONFIG_PAGE}-${to.params.type}`
  } else {
    defaultActive.value = to.name as string
  }
})

onBeforeUnmount(() => {
  ipcRenderer.removeListener(GET_PICBEDS, getPicBeds)
})

</script>
<script lang="ts">
export default {
  name: 'MainPage'
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
    transition all 150ms linear
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
      .el-icon
        cursor pointer
        font-size 16px
        margin-left 5px
      .el-icon.minus
        &:hover
          color #409EFF
      .el-icon.close
        &:hover
          color #F15140
      .el-icon.plus
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
    .info-window
      cursor pointer
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
  .el-sub-menu__title
    color #eee
    &:hover
      background transparent
      span
        color #fff
  .el-sub-menu
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
