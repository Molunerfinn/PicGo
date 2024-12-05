<template>
  <div id="picgo-setting">
    <el-row
      class="view-title"
      align="middle"
      justify="center"
    >
      {{ $T('PICGO_SETTINGS') }} -
      <el-icon
        class="el-icon-document"
        @click="goConfigPage"
      >
        <Reading />
      </el-icon>
    </el-row>
    <el-row class="setting-list">
      <el-col
        :span="20"
        :offset="2"
      >
        <el-row style="width: 100%">
          <el-form
            label-position="left"
            label-width="50%"
            size="small"
          >
            <SelectAreaSettings
              :settings="form"
            />
            <ButtonAreaSettings
              v-model:proxy="proxy"
              :settings="form"
            />
            <SwitchAreaSettings
              :settings="form"
            />
            <CustomAreaSettings
              :settings="form"
            />
          </el-form>
        </el-row>
      </el-col>
    </el-row>
  </div>
</template>
<script lang="ts" setup>
import { ElForm } from 'element-plus'
import { Reading } from '@element-plus/icons-vue'
import { IConfig } from 'picgo'
import { T as $T } from '@/i18n/index'
import { enforceNumber, isLinux } from '~/universal/utils/common'
import { onBeforeMount, reactive, ref } from 'vue'
import { getConfig } from '@/utils/dataSender'
import ButtonAreaSettings from './components/settings/buttonArea/ButtonAreaSettings.vue'
import SwitchAreaSettings from './components/settings/switchArea/SwitchAreaSettings.vue'
import CustomAreaSettings from './components/settings/customArea/CustomAreaSettings.vue'
import SelectAreaSettings from './components/settings/selectArea/SelectAreaSettings.vue'
import { openURL } from '@/utils/common'
import { IStartupMode } from '#/types/enum'

const form = reactive<ISettingForm>({
  showUpdateTip: false,
  showPicBedList: [],
  autoStart: false,
  rename: false,
  autoRename: false,
  uploadNotification: false,
  miniWindowOnTop: false,
  logLevel: ['all'],
  autoCopyUrl: true,
  checkBetaUpdate: true,
  useBuiltinClipboard: false,
  language: 'zh-CN',
  logFileSizeLimit: 10,
  encodeOutputURL: true,
  showDockIcon: true,
  customLink: '$url',
  npmProxy: '',
  npmRegistry: '',
  server: {
    port: 36677,
    host: '127.0.0.1',
    enable: true
  },
  startupMode: IStartupMode.HIDE
})

const proxy = ref('')

onBeforeMount(() => {
  initData()
})

async function initData () {
  const config = (await getConfig<IConfig>())!
  if (config !== undefined) {
    const settings = config.settings || {}
    const picBed = config.picBed
    form.showUpdateTip = settings.showUpdateTip || false
    form.autoStart = settings.autoStart || false
    form.rename = settings.rename || false
    form.autoRename = settings.autoRename || false
    form.uploadNotification = settings.uploadNotification || false
    form.miniWindowOnTop = settings.miniWindowOnTop || false
    form.logLevel = initLogLevel(settings.logLevel || [])
    form.autoCopyUrl = settings.autoCopyUrl === undefined ? true : settings.autoCopyUrl
    form.checkBetaUpdate = settings.checkBetaUpdate === undefined ? true : settings.checkBetaUpdate
    form.useBuiltinClipboard = settings.useBuiltinClipboard === undefined ? false : settings.useBuiltinClipboard
    form.language = settings.language ?? 'zh-CN'
    form.encodeOutputURL = settings.encodeOutputURL === undefined ? false : settings.encodeOutputURL
    form.customLink = settings.customLink || '$url'
    form.npmProxy = settings.npmProxy || ''
    form.npmRegistry = settings.npmRegistry || ''
    proxy.value = picBed.proxy || ''
    form.server = settings.server
    form.logFileSizeLimit = enforceNumber(settings.logFileSizeLimit) || 10
    form.showDockIcon = settings.showDockIcon === undefined ? true : settings.showDockIcon
    form.startupMode = settings.startupMode || (isLinux ? IStartupMode.SHOW_MINI_WINDOW : IStartupMode.HIDE)
  }
}

function initLogLevel (logLevel: string | string[]) {
  if (!Array.isArray(logLevel)) {
    if (logLevel && logLevel.length > 0) {
      logLevel = [logLevel]
    } else {
      logLevel = ['all']
    }
  }
  return logLevel
}

function goConfigPage () {
  openURL('https://picgo.github.io/PicGo-Doc/zh/guide/config.html#picgo设置')
}

</script>
<script lang="ts">
export default {
  name: 'SettingPage'
}
</script>
<style lang='stylus'>
.el-message
  left 60%
.view-title
  .el-icon-document
    margin-left 8px
    cursor pointer
    transition color .2s ease-in-out
    &:hover
      color #49B1F5
#picgo-setting
  .sub-title
    font-size 14px
  .setting-list
    height 360px
    box-sizing border-box
    overflow-y auto
    overflow-x hidden
    width 100%
  .setting-list
    .el-form
      width: 100%
      &-item
        display: flex
        justify-content space-between
        padding-top 8px
        padding-bottom 8px
        border-bottom 1px solid darken(#eee, 50%)
        margin-bottom 0
        &:last-child
          border-bottom none
        &::after
          display none
        &::before
          display none
        &__content
          display flex
          justify-content flex-end
          flex-basis: 50%
      .el-form-item__label
        line-height 32px
        padding-bottom 0
        color #eee
        flex-basis: 50%
        flex-shrink: 0
      .el-form-item__custom-label
        display flex
        align-items center
      .el-button-group
        width 100%
        .el-button
          width 50%
      .el-radio-group
        margin-left 25px
      .el-switch__label
        color #eee
        &.is-active
          color #409EFF
      .el-icon-question
        margin-left 4px
        color #eee
        cursor pointer
        transition .2s color ease-in-out
        &:hover
          color #409EFF
      .el-checkbox-group
        label
          margin-right 30px
          width 100px
      .el-checkbox+.el-checkbox
        margin-right 30px
        margin-left 0
      .confirm-button
        width 100%
  .server-dialog
    .notice-text
      color: #49B1F5
    .el-dialog__body
      padding-top: 0
    .el-form-item
      margin-bottom: 10px
</style>
