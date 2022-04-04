<template>
  <div id="picgo-setting">
    <div class="view-title">
      {{ $T('PICGO_SETTINGS') }} - <i class="el-icon-document" @click="goConfigPage"></i>
    </div>
    <el-row class="setting-list">
      <el-col :span="20" :offset="2">
        <el-row>
        <el-form
          label-position="left"
          label-width="10"
          size="small"
        >
          <el-form-item
            :label="$T('SETTINGS_CHOOSE_LANGUAGE')"
          >
            <!-- <el-button type="primary" round size="mini" @click="openFile('data.json')">{{ $T('SETTINGS_CLICK_TO_OPEN') }}</el-button> -->
            <el-select
              v-model="currentLanguage"
              size="mini"
              style="width: 100%"
              @change="handleLanguageChange"
              :placeholder="$T('SETTINGS_CHOOSE_LANGUAGE')">
              <el-option
                v-for="item in languageList"
                :key="item.value"
                :label="item.label"
                :value="item.value">
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item
            :label="$T('SETTINGS_OPEN_CONFIG_FILE')"
          >
            <el-button type="primary" round size="mini" @click="openFile('data.json')">{{ $T('SETTINGS_CLICK_TO_OPEN') }}</el-button>
          </el-form-item>
          <el-form-item
            :label="$T('SETTINGS_SET_LOG_FILE')"
          >
            <el-button type="primary" round size="mini" @click="openLogSetting">{{ $T('SETTINGS_CLICK_TO_SET') }}</el-button>
          </el-form-item>
          <el-form-item
            :label="$T('SETTINGS_SET_SHORTCUT')"
          >
            <el-button type="primary" round size="mini" @click="goShortCutPage">{{ $T('SETTINGS_CLICK_TO_SET') }}</el-button>
          </el-form-item>
          <el-form-item
            :label="$T('SETTINGS_CUSTOM_LINK_FORMAT')"
          >
            <el-button type="primary" round size="mini" @click="customLinkVisible = true">{{ $T('SETTINGS_CLICK_TO_SET') }}</el-button>
          </el-form-item>
          <el-form-item
            :label="$T('SETTINGS_SET_PROXY_AND_MIRROR')"
          >
            <el-button type="primary" round size="mini" @click="proxyVisible = true">{{ $T('SETTINGS_CLICK_TO_SET') }}</el-button>
          </el-form-item>
          <el-form-item
            :label="$T('SETTINGS_SET_SERVER')"
          >
            <el-button type="primary" round size="mini" @click="serverVisible = true">{{ $T('SETTINGS_CLICK_TO_SET') }}</el-button>
          </el-form-item>
          <el-form-item
            :label="$T('SETTINGS_CHECK_UPDATE')"
          >
            <el-button type="primary" round size="mini" @click="checkUpdate">{{ $T('SETTINGS_CLICK_TO_CHECK') }}</el-button>
          </el-form-item>
          <el-form-item
            :label="$T('SETTINGS_OPEN_UPDATE_HELPER')"
          >
            <el-switch
              v-model="form.updateHelper"
              :active-text="$T('SETTINGS_OPEN')"
              :inactive-text="$T('SETTINGS_CLOSE')"
              @change="updateHelperChange"
            ></el-switch>
          </el-form-item>
          <el-form-item
            v-show="form.updateHelper"
            :label="$T('SETTINGS_ACCEPT_BETA_UPDATE')"
          >
            <el-switch
              v-model="form.checkBetaUpdate"
              :active-text="$T('SETTINGS_OPEN')"
              :inactive-text="$T('SETTINGS_CLOSE')"
              @change="checkBetaUpdateChange"
            ></el-switch>
          </el-form-item>
          <el-form-item
            :label="$T('SETTINGS_LAUNCH_ON_BOOT')"
          >
            <el-switch
              v-model="form.autoStart"
              :active-text="$T('SETTINGS_OPEN')"
              :inactive-text="$T('SETTINGS_CLOSE')"
              @change="handleAutoStartChange"
            ></el-switch>
          </el-form-item>
          <el-form-item
            :label="$T('SETTINGS_RENAME_BEFORE_UPLOAD')"
          >
            <el-switch
              v-model="form.rename"
              :active-text="$T('SETTINGS_OPEN')"
              :inactive-text="$T('SETTINGS_CLOSE')"
              @change="handleRename"
            ></el-switch>
          </el-form-item>
          <el-form-item
            :label="$T('SETTINGS_TIMESTAMP_RENAME')"
          >
            <el-switch
              v-model="form.autoRename"
              :active-text="$T('SETTINGS_OPEN')"
              :inactive-text="$T('SETTINGS_CLOSE')"
              @change="handleAutoRename"
            ></el-switch>
          </el-form-item>
          <el-form-item
            :label="$T('SETTINGS_OPEN_UPLOAD_TIPS')"
          >
            <el-switch
              v-model="form.uploadNotification"
              :active-text="$T('SETTINGS_OPEN')"
              :inactive-text="$T('SETTINGS_CLOSE')"
              @change="handleUploadNotification"
            ></el-switch>
          </el-form-item>
          <el-form-item
            v-if="os !== 'darwin'"
            :label="$T('SETTINGS_MINI_WINDOW_ON_TOP')"
          >
            <el-switch
              v-model="form.miniWindowOntop"
              :active-text="$T('SETTINGS_OPEN')"
              :inactive-text="$T('SETTINGS_CLOSE')"
              @change="handleMiniWindowOntop"
            ></el-switch>
          </el-form-item>
          <el-form-item
            :label="$T('SETTINGS_AUTO_COPY_URL_AFTER_UPLOAD')"
          >
            <el-switch
              v-model="form.autoCopyUrl"
              :active-text="$T('SETTINGS_OPEN')"
              :inactive-text="$T('SETTINGS_CLOSE')"
              @change="handleAutoCopyUrl"
            ></el-switch>
          </el-form-item>
          <el-form-item
          >
            <div class="el-form-item__custom-label" slot="label">
             {{ $T('SETTINGS_USE_BUILTIN_CLIPBOARD_UPLOAD') }}
            <el-tooltip class="item" effect="dark" :content="$T('BUILTIN_CLIPBOARD_TIPS')" placement="right">
              <i class="el-icon-question"></i>
            </el-tooltip>
            </div>
            <el-switch
              v-model="form.useBuiltinClipboard"
              :active-text="$T('SETTINGS_OPEN')"
              :inactive-text="$T('SETTINGS_CLOSE')"
              @change="useBuiltinClipboardChange"
            ></el-switch>
          </el-form-item>
          <el-form-item
            :style="{ marginRight: '-64px' }"
            :label="$T('CHOOSE_SHOWED_PICBED')"
          >
            <el-checkbox-group
              v-model="form.showPicBedList"
              @change="handleShowPicBedListChange"
            >
              <el-checkbox
                v-for="item in picBed"
                :label="item.name"
                :key="item.name"
              ></el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-form>
        </el-row>
      </el-col>
    </el-row>
    <el-dialog
      :title="$T('SETTINGS_CUSTOM_LINK_FORMAT')"
      :visible.sync="customLinkVisible"
      :modal-append-to-body="false"
    >
      <el-form
        label-position="top"
        :model="customLink"
        ref="customLink"
        :rules="rules"
        size="small"
      >
        <el-form-item
          prop="value"
        >
          <div class="custom-title">
            {{ $T('SETTINGS_TIPS_PLACEHOLDER_URL') }}
          </div>
          <div class="custom-title">
            {{ $T('SETTINGS_TIPS_PLACEHOLDER_FILENAME') }}
          </div>
          <el-input
            class="align-center"
            v-model="customLink.value"
            :autofocus="true"
          ></el-input>
        </el-form-item>
      </el-form>
      <div>
        {{ $T('SETTINGS_TIPS_SUCH_AS') }}[$fileName]($url)
      </div>
      <span slot="footer">
        <el-button @click="cancelCustomLink" round>{{ $T('CANCEL') }}</el-button>
        <el-button type="primary" @click="confirmCustomLink" round>{{ $T('CONFIRM') }}</el-button>
      </span>
    </el-dialog>
    <el-dialog
      :title="$T('SETTINGS_SET_PROXY_AND_MIRROR')"
      :visible.sync="proxyVisible"
      :modal-append-to-body="false"
      width="70%"
    >
      <el-form
        label-position="right"
        :model="customLink"
        ref="customLink"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item
          :label="$T('SETTINGS_UPLOAD_PROXY')"
        >
          <el-input
            v-model="proxy"
            :autofocus="true"
            :placeholder="`${$T('SETTINGS_TIPS_SUCH_AS')}：http://127.0.0.1:1080`"
          ></el-input>
        </el-form-item>
        <el-form-item
          :label="$T('SETTINGS_PLUGIN_INSTALL_PROXY')"
        >
          <el-input
            v-model="npmProxy"
            :autofocus="true"
            :placeholder="`${$T('SETTINGS_TIPS_SUCH_AS')}：http://127.0.0.1:1080`"
          ></el-input>
        </el-form-item>
        <el-form-item
          :label="$T('SETTINGS_PLUGIN_INSTALL_MIRROR')"
        >
          <el-input
            v-model="npmRegistry"
            :autofocus="true"
            :placeholder="`${$T('SETTINGS_TIPS_SUCH_AS')}：https://registry.npm.taobao.org/`"
          ></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="cancelProxy" round>{{ $T('CANCEL') }}</el-button>
        <el-button type="primary" @click="confirmProxy" round>{{ $T('CONFIRM') }}</el-button>
      </span>
    </el-dialog>
    <el-dialog
      :title="$T('SETTINGS_CHECK_UPDATE')"
      :visible.sync="checkUpdateVisible"
      :modal-append-to-body="false"
    >
      <div>
        {{ $T('SETTINGS_CURRENT_VERSION') }}: {{ version }}
      </div>
      <div>
        {{ $T('SETTINGS_NEWEST_VERSION') }}: {{ latestVersion ? latestVersion : `${$T('SETTINGS_GETING')}...` }}
      </div>
      <div v-if="needUpdate">
        {{ $T('SETTINGS_TIPS_HAS_NEW_VERSION') }}
      </div>
      <span slot="footer">
        <el-button @click="cancelCheckVersion" round>{{ $T('CANCEL') }}</el-button>
        <el-button type="primary" @click="confirmCheckVersion" round>{{ $T('CONFIRM') }}</el-button>
      </span>
    </el-dialog>
    <el-dialog
      :title="$T('SETTINGS_SET_LOG_FILE')"
      :visible.sync="logFileVisible"
      :modal-append-to-body="false"
    >
      <el-form
        label-position="right"
        label-width="100px"
      >
        <el-form-item
          :label="$T('SETTINGS_LOG_FILE')"
        >
          <el-button type="primary" round size="mini" @click="openFile('picgo.log')">{{ $T('SETTINGS_CLICK_TO_OPEN') }}</el-button>
        </el-form-item>
        <el-form-item
          :label="$T('SETTINGS_LOG_LEVEL')"
        >
          <el-select
            v-model="form.logLevel"
            multiple
            collapse-tags
          >
            <el-option
              v-for="(value, key) of logLevel"
              :key="key"
              :label="value"
              :value="key"
              :disabled="handleLevelDisabled(key)"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="cancelLogLevelSetting" round>{{ $T('CANCEL') }}</el-button>
        <el-button type="primary" @click="confirmLogLevelSetting" round>{{ $T('CONFIRM') }}</el-button>
      </span>
    </el-dialog>
    <el-dialog
      class="server-dialog"
      width="60%"
      :title="$T('SETTINGS_SET_PICGO_SERVER')"
      :visible.sync="serverVisible"
      :modal-append-to-body="false"
    >
      <div class="notice-text">
        {{ $T('SETTINGS_TIPS_SERVER_NOTICE') }}
      </div>
      <el-form
        label-position="right"
        label-width="120px"
      >
        <el-form-item
          :label="$T('SETTINGS_ENABLE_SERVER')"
        >
          <el-switch
            v-model="server.enable"
            :active-text="$T('SETTINGS_OPEN')"
            :inactive-text="$T('SETTINGS_CLOSE')"
          ></el-switch>
        </el-form-item>
        <template v-if="server.enable">
          <el-form-item
            :label="$T('SETTINGS_SET_SERVER_HOST')"
          >
            <el-input
              type="input"
              v-model="server.host"
              :placeholder="$T('SETTINGS_TIP_PLACEHOLDER_HOST')"
            ></el-input>
          </el-form-item>
          <el-form-item
            :label="$T('SETTINGS_SET_SERVER_PORT')"
          >
            <el-input
              type="number"
              v-model="server.port"
              :placeholder="$T('SETTINGS_TIP_PLACEHOLDER_PORT')"
            ></el-input>
          </el-form-item>
        </template>
      </el-form>
      <span slot="footer">
        <el-button @click="cancelServerSetting" round>{{ $T('CANCEL') }}</el-button>
        <el-button type="primary" @click="confirmServerSetting" round>{{ $T('CONFIRM') }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>
<script lang="ts">
import keyDetect from '@/utils/key-binding'
import pkg from 'root/package.json'
import { IConfig } from 'picgo'
import { PICGO_OPEN_FILE, OPEN_URL, CHANGE_LANGUAGE } from '#/events/constants'
import {
  ipcRenderer
} from 'electron'
import { Component, Vue } from 'vue-property-decorator'
import { T, languageList } from '~/universal/i18n'
// import db from '#/datastore'
const releaseUrl = 'https://api.github.com/repos/Molunerfinn/PicGo/releases/latest'
const releaseUrlBackup = 'https://cdn.jsdelivr.net/gh/Molunerfinn/PicGo@latest/package.json'
const downloadUrl = 'https://github.com/Molunerfinn/PicGo/releases/latest'
const customLinkRule = (rule: string, value: string, callback: (arg0?: Error) => void) => {
  if (!/\$url/.test(value)) {
    return callback(new Error(T('TIPS_MUST_CONTAINS_URL')))
  } else {
    return callback()
  }
}

@Component({
  name: 'picgo-setting'
})
export default class extends Vue {
  form: ISettingForm = {
    updateHelper: false,
    showPicBedList: [],
    autoStart: false,
    rename: false,
    autoRename: false,
    uploadNotification: false,
    miniWindowOntop: false,
    logLevel: ['all'],
    autoCopyUrl: true,
    checkBetaUpdate: true,
    useBuiltinClipboard: false,
    language: 'zh-CN'
  }

  languageList = languageList.map(item => ({
    label: item,
    value: item
  }))

  currentLanguage = 'zh-CN'
  picBed: IPicBedType[] = []
  logFileVisible = false
  keyBindingVisible = false
  customLinkVisible = false
  checkUpdateVisible = false
  serverVisible = false
  proxyVisible = false
  customLink = {
    value: '$url'
  }

  shortKey: IShortKeyMap = {
    upload: ''
  }

  proxy = ''
  npmRegistry = ''
  npmProxy = ''
  rules = {
    value: [
      { validator: customLinkRule, trigger: 'blur' }
    ]
  }

  logLevel = {
    all: this.$T('SETTINGS_LOG_LEVEL_ALL'),
    success: this.$T('SETTINGS_LOG_LEVEL_SUCCESS'),
    error: this.$T('SETTINGS_LOG_LEVEL_ERROR'),
    info: this.$T('SETTINGS_LOG_LEVEL_INFO'),
    warn: this.$T('SETTINGS_LOG_LEVEL_WARN'),
    none: this.$T('SETTINGS_LOG_LEVEL_NONE')
  }

  server = {
    port: 36677,
    host: '127.0.0.1',
    enable: true
  }

  version = pkg.version
  latestVersion = ''
  os = ''

  get needUpdate () {
    if (this.latestVersion) {
      return this.compareVersion2Update(this.version, this.latestVersion)
    } else {
      return false
    }
  }

  created () {
    this.os = process.platform
    ipcRenderer.send('getPicBeds')
    ipcRenderer.on('getPicBeds', this.getPicBeds)
    this.initData()
  }

  async initData () {
    const config = (await this.getConfig<IConfig>())!
    if (config !== undefined) {
      const settings = config.settings || {}
      const picBed = config.picBed
      this.form.updateHelper = settings.showUpdateTip || false
      this.form.autoStart = settings.autoStart || false
      this.form.rename = settings.rename || false
      this.form.autoRename = settings.autoRename || false
      this.form.uploadNotification = settings.uploadNotification || false
      this.form.miniWindowOntop = settings.miniWindowOntop || false
      this.form.logLevel = this.initLogLevel(settings.logLevel || [])
      this.form.autoCopyUrl = settings.autoCopy === undefined ? true : settings.autoCopy
      this.form.checkBetaUpdate = settings.checkBetaUpdate === undefined ? true : settings.checkBetaUpdate
      this.form.useBuiltinClipboard = settings.useBuiltinClipboard === undefined ? false : settings.useBuiltinClipboard
      this.form.language = settings.language ?? 'zh-CN'
      this.currentLanguage = settings.language ?? 'zh-CN'
      this.customLink.value = settings.customLink || '$url'
      this.shortKey.upload = settings.shortKey.upload
      this.proxy = picBed.proxy || ''
      this.npmRegistry = settings.registry || ''
      this.npmProxy = settings.proxy || ''
      this.server = settings.server || {
        port: 36677,
        host: '127.0.0.1',
        enable: true
      }
    }
  }

  initLogLevel (logLevel: string | string[]) {
    if (!Array.isArray(logLevel)) {
      if (logLevel && logLevel.length > 0) {
        logLevel = [logLevel]
      } else {
        logLevel = ['all']
      }
    }
    return logLevel
  }

  getPicBeds (event: Event, picBeds: IPicBedType[]) {
    this.picBed = picBeds
    this.form.showPicBedList = this.picBed.map(item => {
      if (item.visible) {
        return item.name
      }
      return null
    }).filter(item => item) as string[]
  }

  openFile (file: string) {
    ipcRenderer.send(PICGO_OPEN_FILE, file)
  }

  openLogSetting () {
    this.logFileVisible = true
  }

  keyDetect (type: string, event: KeyboardEvent) {
    this.shortKey[type] = keyDetect(event).join('+')
  }

  async cancelCustomLink () {
    this.customLinkVisible = false
    this.customLink.value = await this.getConfig<string>('settings.customLink') || '$url'
  }

  confirmCustomLink () {
    // @ts-ignore
    this.$refs.customLink.validate((valid: boolean) => {
      if (valid) {
        this.saveConfig('settings.customLink', this.customLink.value)
        this.customLinkVisible = false
        ipcRenderer.send('updateCustomLink')
      } else {
        return false
      }
    })
  }

  async cancelProxy () {
    this.proxyVisible = false
    this.proxy = await this.getConfig<string>('picBed.proxy') || ''
  }

  confirmProxy () {
    this.proxyVisible = false
    this.saveConfig({
      'picBed.proxy': this.proxy,
      'settings.proxy': this.npmProxy,
      'settings.registry': this.npmRegistry
    })
    const successNotification = new Notification(this.$T('SETTINGS_SET_PROXY_AND_MIRROR'), {
      body: this.$T('TIPS_SET_SUCCEED')
    })
    successNotification.onclick = () => {
      return true
    }
  }

  updateHelperChange (val: boolean) {
    this.saveConfig('settings.showUpdateTip', val)
  }

  checkBetaUpdateChange (val: boolean) {
    this.saveConfig('settings.checkBetaUpdate', val)
  }

  useBuiltinClipboardChange (val: boolean) {
    this.saveConfig('settings.useBuiltinClipboard', val)
  }

  handleShowPicBedListChange (val: string[]) {
    const list = this.picBed.map(item => {
      if (!val.includes(item.name)) {
        item.visible = false
      } else {
        item.visible = true
      }
      return item
    })
    this.saveConfig({
      'picBed.list': list
    })
    ipcRenderer.send('getPicBeds')
  }

  handleAutoStartChange (val: boolean) {
    this.saveConfig('settings.autoStart', val)
    ipcRenderer.send('autoStart', val)
  }

  handleRename (val: boolean) {
    this.saveConfig({
      'settings.rename': val
    })
  }

  handleAutoRename (val: boolean) {
    this.saveConfig({
      'settings.autoRename': val
    })
  }

  compareVersion2Update (current: string, latest: string) {
    const currentVersion = current.split('.').map(item => parseInt(item))
    const latestVersion = latest.split('.').map(item => parseInt(item))

    for (let i = 0; i < 3; i++) {
      if (currentVersion[i] < latestVersion[i]) {
        return true
      }
      if (currentVersion[i] > latestVersion[i]) {
        return false
      }
    }
    return false
  }

  checkUpdate () {
    this.checkUpdateVisible = true
    this.$http.get(releaseUrl)
      .then(res => {
        this.latestVersion = res.data.name
      }).catch(async () => {
        this.$http.get(releaseUrlBackup)
          .then(res => {
            this.latestVersion = res.data.version
          }).catch(() => {
            this.latestVersion = this.$T('TIPS_NETWORK_ERROR')
          })
      })
  }

  confirmCheckVersion () {
    if (this.needUpdate) {
      ipcRenderer.send(OPEN_URL, downloadUrl)
    }
    this.checkUpdateVisible = false
  }

  cancelCheckVersion () {
    this.checkUpdateVisible = false
  }

  handleUploadNotification (val: boolean) {
    this.saveConfig({
      'settings.uploadNotification': val
    })
  }

  handleMiniWindowOntop (val: boolean) {
    this.saveConfig('settings.miniWindowOntop', val)
    this.$message.info(this.$T('TIPS_NEED_RELOAD'))
  }

  handleAutoCopyUrl (val: boolean) {
    this.saveConfig('settings.autoCopy', val)
    const successNotification = new Notification(this.$T('SETTINGS_AUTO_COPY_URL_AFTER_UPLOAD'), {
      body: this.$T('TIPS_SET_SUCCEED')
    })
    successNotification.onclick = () => {
      return true
    }
  }

  confirmLogLevelSetting () {
    if (this.form.logLevel.length === 0) {
      return this.$message.error(this.$T('TIPS_PLEASE_CHOOSE_LOG_LEVEL'))
    }
    this.saveConfig({
      'settings.logLevel': this.form.logLevel
    })
    const successNotification = new Notification(this.$T('SETTINGS_SET_LOG_FILE'), {
      body: this.$T('TIPS_SET_SUCCEED')
    })
    successNotification.onclick = () => {
      return true
    }
    this.logFileVisible = false
  }

  async cancelLogLevelSetting () {
    this.logFileVisible = false
    let logLevel = await this.getConfig<string | string[]>('settings.logLevel')
    if (!Array.isArray(logLevel)) {
      if (logLevel && logLevel.length > 0) {
        logLevel = [logLevel]
      } else {
        logLevel = ['all']
      }
    }
    this.form.logLevel = logLevel
  }

  confirmServerSetting () {
    // @ts-ignore
    this.server.port = parseInt(this.server.port, 10)
    this.saveConfig({
      'settings.server': this.server
    })
    const successNotification = new Notification(this.$T('SETTINGS_SET_PICGO_SERVER'), {
      body: this.$T('TIPS_SET_SUCCEED')
    })
    successNotification.onclick = () => {
      return true
    }
    this.serverVisible = false
    ipcRenderer.send('updateServer')
  }

  async cancelServerSetting () {
    this.serverVisible = false
    this.server = await this.getConfig('settings.server') || {
      port: 36677,
      host: '127.0.0.1',
      enable: true
    }
  }

  handleLevelDisabled (val: string) {
    const currentLevel = val
    let flagLevel
    const result = this.form.logLevel.some(item => {
      if (item === 'all' || item === 'none') {
        flagLevel = item
      }
      return (item === 'all' || item === 'none')
    })
    if (result) {
      if (currentLevel !== flagLevel) {
        return true
      }
    } else if (this.form.logLevel.length > 0) {
      if (val === 'all' || val === 'none') {
        return true
      }
    }
    return false
  }

  handleLanguageChange (val: string) {
    this.$i18n.setLanguage(val)
    this.forceUpdate()
    ipcRenderer.send(CHANGE_LANGUAGE, val)
    this.saveConfig({
      'settings.language': val
    })
  }

  goConfigPage () {
    ipcRenderer.send(OPEN_URL, 'https://picgo.github.io/PicGo-Doc/zh/guide/config.html#picgo设置')
  }

  goShortCutPage () {
    this.$router.push('shortKey')
  }

  beforeDestroy () {
    ipcRenderer.removeListener('getPicBeds', this.getPicBeds)
  }
}
</script>
<style lang='stylus'>
.el-message
  left 60%
.view-title
  .el-icon-document
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
  .setting-list
    .el-form
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
      label
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
      .el-input__inner
        border-radius 19px
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
