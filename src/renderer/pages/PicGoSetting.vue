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
            <el-form-item
              :label="$T('SETTINGS_CHOOSE_LANGUAGE')"
            >
              <!-- <el-button type="primary" round size="small" @click="openFile('data.json')">{{ $T('SETTINGS_CLICK_TO_OPEN') }}</el-button> -->
              <el-select
                v-model="currentLanguage"
                size="small"
                style="width: 100%"
                :placeholder="$T('SETTINGS_CHOOSE_LANGUAGE')"
                @change="handleLanguageChange"
              >
                <el-option
                  v-for="item in languageList"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item
              :label="$T('SETTINGS_OPEN_CONFIG_FILE')"
            >
              <el-button
                type="primary"
                round
                size="small"
                @click="openFile('data.json')"
              >
                {{ $T('SETTINGS_CLICK_TO_OPEN') }}
              </el-button>
            </el-form-item>
            <el-form-item
              :label="$T('SETTINGS_SET_LOG_FILE')"
            >
              <el-button
                type="primary"
                round
                size="small"
                @click="openLogSetting"
              >
                {{ $T('SETTINGS_CLICK_TO_SET') }}
              </el-button>
            </el-form-item>
            <el-form-item
              :label="$T('SETTINGS_SET_SHORTCUT')"
            >
              <el-button
                type="primary"
                round
                size="small"
                @click="goShortCutPage"
              >
                {{ $T('SETTINGS_CLICK_TO_SET') }}
              </el-button>
            </el-form-item>
            <el-form-item
              :label="$T('SETTINGS_CUSTOM_LINK_FORMAT')"
            >
              <el-button
                type="primary"
                round
                size="small"
                @click="customLinkVisible = true"
              >
                {{ $T('SETTINGS_CLICK_TO_SET') }}
              </el-button>
            </el-form-item>
            <el-form-item
              :label="$T('SETTINGS_SET_PROXY_AND_MIRROR')"
            >
              <el-button
                type="primary"
                round
                size="small"
                @click="proxyVisible = true"
              >
                {{ $T('SETTINGS_CLICK_TO_SET') }}
              </el-button>
            </el-form-item>
            <el-form-item
              :label="$T('SETTINGS_SET_SERVER')"
            >
              <el-button
                type="primary"
                round
                size="small"
                @click="serverVisible = true"
              >
                {{ $T('SETTINGS_CLICK_TO_SET') }}
              </el-button>
            </el-form-item>
            <el-form-item
              :label="$T('SETTINGS_CHECK_UPDATE')"
            >
              <el-button
                type="primary"
                round
                size="small"
                @click="checkUpdate"
              >
                {{ $T('SETTINGS_CLICK_TO_CHECK') }}
              </el-button>
            </el-form-item>
            <el-form-item
              :label="$T('SETTINGS_OPEN_UPDATE_HELPER')"
            >
              <el-switch
                v-model="form.updateHelper"
                :active-text="$T('SETTINGS_OPEN')"
                :inactive-text="$T('SETTINGS_CLOSE')"
                @change="updateHelperChange"
              />
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
              />
            </el-form-item>
            <el-form-item
              :label="$T('SETTINGS_LAUNCH_ON_BOOT')"
            >
              <el-switch
                v-model="form.autoStart"
                :active-text="$T('SETTINGS_OPEN')"
                :inactive-text="$T('SETTINGS_CLOSE')"
                @change="handleAutoStartChange"
              />
            </el-form-item>
            <el-form-item
              :label="$T('SETTINGS_RENAME_BEFORE_UPLOAD')"
            >
              <el-switch
                v-model="form.rename"
                :active-text="$T('SETTINGS_OPEN')"
                :inactive-text="$T('SETTINGS_CLOSE')"
                @change="handleRename"
              />
            </el-form-item>
            <el-form-item
              :label="$T('SETTINGS_TIMESTAMP_RENAME')"
            >
              <el-switch
                v-model="form.autoRename"
                :active-text="$T('SETTINGS_OPEN')"
                :inactive-text="$T('SETTINGS_CLOSE')"
                @change="handleAutoRename"
              />
            </el-form-item>
            <el-form-item
              :label="$T('SETTINGS_OPEN_UPLOAD_TIPS')"
            >
              <el-switch
                v-model="form.uploadNotification"
                :active-text="$T('SETTINGS_OPEN')"
                :inactive-text="$T('SETTINGS_CLOSE')"
                @change="handleUploadNotification"
              />
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
              />
            </el-form-item>
            <el-form-item
              :label="$T('SETTINGS_AUTO_COPY_URL_AFTER_UPLOAD')"
            >
              <el-switch
                v-model="form.autoCopyUrl"
                :active-text="$T('SETTINGS_OPEN')"
                :inactive-text="$T('SETTINGS_CLOSE')"
                @change="handleAutoCopyUrl"
              />
            </el-form-item>
            <el-form-item>
              <template #label>
                <el-row align="middle">
                  {{ $T('SETTINGS_USE_BUILTIN_CLIPBOARD_UPLOAD') }}
                  <el-tooltip
                    class="item"
                    effect="dark"
                    :content="$T('BUILTIN_CLIPBOARD_TIPS')"
                    placement="right"
                  >
                    <el-icon style="margin-left: 4px">
                      <QuestionFilled />
                    </el-icon>
                  </el-tooltip>
                </el-row>
              </template>
              <el-switch
                v-model="form.useBuiltinClipboard"
                :active-text="$T('SETTINGS_OPEN')"
                :inactive-text="$T('SETTINGS_CLOSE')"
                @change="useBuiltinClipboardChange"
              />
            </el-form-item>
            <el-form-item
              :label="$T('SETTINGS_ENCODE_OUTPUT_URL')"
            >
              <el-switch
                v-model="form.encodeOutputURL"
                :active-text="$T('SETTINGS_OPEN')"
                :inactive-text="$T('SETTINGS_CLOSE')"
                @change="handleEncodeOutputURL"
              />
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
                  :key="item.name"
                  :label="item.name"
                />
              </el-checkbox-group>
            </el-form-item>
          </el-form>
        </el-row>
      </el-col>
    </el-row>
    <el-dialog
      v-model="customLinkVisible"
      :title="$T('SETTINGS_CUSTOM_LINK_FORMAT')"
      :modal-append-to-body="false"
    >
      <el-form
        ref="$customLink"
        label-position="top"
        :model="customLink"
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
          <div class="custom-title">
            {{ $T('SETTINGS_TIPS_PLACEHOLDER_EXTNAME') }}
          </div>
          <el-input
            v-model="customLink.value"
            class="align-center"
            :autofocus="true"
          />
        </el-form-item>
      </el-form>
      <div>
        {{ $T('SETTINGS_TIPS_SUCH_AS') }}[$fileName]($url)
      </div>
      <template #footer>
        <el-button
          round
          @click="cancelCustomLink"
        >
          {{ $T('CANCEL') }}
        </el-button>
        <el-button
          type="primary"
          round
          @click="confirmCustomLink"
        >
          {{ $T('CONFIRM') }}
        </el-button>
      </template>
    </el-dialog>
    <el-dialog
      v-model="proxyVisible"
      :title="$T('SETTINGS_SET_PROXY_AND_MIRROR')"
      :modal-append-to-body="false"
      width="70%"
    >
      <el-form
        label-position="right"
        :model="customLink"
        label-width="120px"
      >
        <el-form-item
          :label="$T('SETTINGS_UPLOAD_PROXY')"
        >
          <el-input
            v-model="proxy"
            :autofocus="true"
            :placeholder="`${$T('SETTINGS_TIPS_SUCH_AS')}：http://127.0.0.1:1080`"
          />
        </el-form-item>
        <el-form-item
          :label="$T('SETTINGS_PLUGIN_INSTALL_PROXY')"
        >
          <el-input
            v-model="npmProxy"
            :autofocus="true"
            :placeholder="`${$T('SETTINGS_TIPS_SUCH_AS')}：http://127.0.0.1:1080`"
          />
        </el-form-item>
        <el-form-item
          :label="$T('SETTINGS_PLUGIN_INSTALL_MIRROR')"
        >
          <el-input
            v-model="npmRegistry"
            :autofocus="true"
            :placeholder="`${$T('SETTINGS_TIPS_SUCH_AS')}：https://registry.npmmirror.com`"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button
          round
          @click="cancelProxy"
        >
          {{ $T('CANCEL') }}
        </el-button>
        <el-button
          type="primary"
          round
          @click="confirmProxy"
        >
          {{ $T('CONFIRM') }}
        </el-button>
      </template>
    </el-dialog>
    <el-dialog
      v-model="checkUpdateVisible"
      :title="$T('SETTINGS_CHECK_UPDATE')"
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
      <template #footer>
        <el-button
          round
          @click="cancelCheckVersion"
        >
          {{ $T('CANCEL') }}
        </el-button>
        <el-button
          type="primary"
          round
          @click="confirmCheckVersion"
        >
          {{ $T('CONFIRM') }}
        </el-button>
      </template>
    </el-dialog>
    <el-dialog
      v-model="logFileVisible"
      :title="$T('SETTINGS_SET_LOG_FILE')"
      :modal-append-to-body="false"
      width="500px"
    >
      <el-form
        label-position="right"
        label-width="150px"
      >
        <el-form-item
          :label="$T('SETTINGS_LOG_FILE')"
        >
          <el-button
            type="primary"
            round
            size="small"
            @click="openFile('picgo.log')"
          >
            {{ $T('SETTINGS_CLICK_TO_OPEN') }}
          </el-button>
        </el-form-item>
        <el-form-item
          :label="$T('SETTINGS_LOG_LEVEL')"
        >
          <el-select
            v-model="form.logLevel"
            multiple
            collapse-tags
            style="width: 100%;"
          >
            <el-option
              v-for="(value, key) of logLevel"
              :key="key"
              :label="value"
              :value="key"
              :disabled="handleLevelDisabled(key)"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          :label="`${$T('SETTINGS_LOG_FILE_SIZE')} (MB)`"
        >
          <el-input-number
            v-model="form.logFileSizeLimit"
            style="width: 100%;"
            :placeholder="`${$T('SETTINGS_TIPS_SUCH_AS')}：10`"
            :controls="false"
            :min="1"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button
          round
          @click="cancelLogLevelSetting"
        >
          {{ $T('CANCEL') }}
        </el-button>
        <el-button
          type="primary"
          round
          @click="confirmLogLevelSetting"
        >
          {{ $T('CONFIRM') }}
        </el-button>
      </template>
    </el-dialog>
    <el-dialog
      v-model="serverVisible"
      class="server-dialog"
      width="60%"
      :title="$T('SETTINGS_SET_PICGO_SERVER')"
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
          />
        </el-form-item>
        <template v-if="server.enable">
          <el-form-item
            :label="$T('SETTINGS_SET_SERVER_HOST')"
          >
            <el-input
              v-model="server.host"
              type="input"
              :placeholder="$T('SETTINGS_TIP_PLACEHOLDER_HOST')"
            />
          </el-form-item>
          <el-form-item
            :label="$T('SETTINGS_SET_SERVER_PORT')"
          >
            <el-input
              v-model="server.port"
              type="number"
              :placeholder="$T('SETTINGS_TIP_PLACEHOLDER_PORT')"
            />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button
          round
          @click="cancelServerSetting"
        >
          {{ $T('CANCEL') }}
        </el-button>
        <el-button
          type="primary"
          round
          @click="confirmServerSetting"
        >
          {{ $T('CONFIRM') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script lang="ts" setup>
import { ElForm, ElMessage as $message, FormRules } from 'element-plus'
import { Reading, QuestionFilled } from '@element-plus/icons-vue'
import pkg from 'root/package.json'
import { IConfig } from 'picgo'
import { PICGO_OPEN_FILE, OPEN_URL, GET_PICBEDS } from '#/events/constants'
import {
  ipcRenderer
} from 'electron'
import { i18nManager, T as $T } from '@/i18n/index'
import { enforceNumber } from '~/universal/utils/common'
import { compare } from 'compare-versions'
import { STABLE_RELEASE_URL, BETA_RELEASE_URL } from '#/utils/static'
import { computed, onBeforeMount, onBeforeUnmount, reactive, ref } from 'vue'
import { getConfig, saveConfig, sendToMain, triggerRPC } from '@/utils/dataSender'
import { useRouter } from 'vue-router'
import { SHORTKEY_PAGE } from '@/router/config'
import { IRPCActionType } from '~/universal/types/enum'

const $customLink = ref<InstanceType<typeof ElForm> | null>(null)

const customLinkRule = (rule: any, value: string, callback: (arg0?: Error) => void) => {
  if (!/\$url/.test(value) && !/\$fileName/.test(value) && !/\$extName/.test(value)) {
    return callback(new Error($T('TIPS_MUST_CONTAINS_URL')))
  } else {
    return callback()
  }
}
const $router = useRouter()
const form = reactive<ISettingForm>({
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
  language: 'zh-CN',
  logFileSizeLimit: 10,
  encodeOutputURL: true
})

const languageList = i18nManager.languageList.map(item => ({
  label: item.label,
  value: item.value
}))

const currentLanguage = ref('zh-CN')

const picBed = ref<IPicBedType[]>([])

const logFileVisible = ref(false)
const customLinkVisible = ref(false)
const checkUpdateVisible = ref(false)
const serverVisible = ref(false)
const proxyVisible = ref(false)

const customLink = reactive({
  value: '$url'
})

const shortKey = reactive<IShortKeyMap>({
  upload: ''
})

const proxy = ref('')
const npmRegistry = ref('')
const npmProxy = ref('')
const rules = reactive<FormRules>({
  value: [
    { validator: customLinkRule, trigger: 'blur' }
  ]
})

const logLevel = {
  all: $T('SETTINGS_LOG_LEVEL_ALL'),
  success: $T('SETTINGS_LOG_LEVEL_SUCCESS'),
  error: $T('SETTINGS_LOG_LEVEL_ERROR'),
  info: $T('SETTINGS_LOG_LEVEL_INFO'),
  warn: $T('SETTINGS_LOG_LEVEL_WARN'),
  none: $T('SETTINGS_LOG_LEVEL_NONE')
}

const server = ref({
  port: 36677,
  host: '127.0.0.1',
  enable: true
})

const version = pkg.version
const latestVersion = ref('')
const os = ref('')

const needUpdate = computed(() => {
  if (latestVersion.value) {
    return compareVersion2Update(version, latestVersion.value)
  } else {
    return false
  }
})

onBeforeMount(() => {
  os.value = process.platform
  sendToMain(GET_PICBEDS)
  ipcRenderer.on(GET_PICBEDS, getPicBeds)
  initData()
})

async function initData () {
  const config = (await getConfig<IConfig>())!
  if (config !== undefined) {
    const settings = config.settings || {}
    const picBed = config.picBed
    form.updateHelper = settings.showUpdateTip || false
    form.autoStart = settings.autoStart || false
    form.rename = settings.rename || false
    form.autoRename = settings.autoRename || false
    form.uploadNotification = settings.uploadNotification || false
    form.miniWindowOntop = settings.miniWindowOntop || false
    form.logLevel = initLogLevel(settings.logLevel || [])
    form.autoCopyUrl = settings.autoCopy === undefined ? true : settings.autoCopy
    form.checkBetaUpdate = settings.checkBetaUpdate === undefined ? true : settings.checkBetaUpdate
    form.useBuiltinClipboard = settings.useBuiltinClipboard === undefined ? false : settings.useBuiltinClipboard
    form.language = settings.language ?? 'zh-CN'
    form.encodeOutputURL = settings.encodeOutputURL === undefined ? true : settings.encodeOutputURL
    currentLanguage.value = settings.language ?? 'zh-CN'
    customLink.value = settings.customLink || '$url'
    shortKey.upload = settings.shortKey.upload
    proxy.value = picBed.proxy || ''
    npmRegistry.value = settings.registry || ''
    npmProxy.value = settings.proxy || ''
    server.value = settings.server || {
      port: 36677,
      host: '127.0.0.1',
      enable: true
    }
    form.logFileSizeLimit = enforceNumber(settings.logFileSizeLimit) || 10
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

function getPicBeds (event: Event, picBeds: IPicBedType[]) {
  picBed.value = picBeds
  form.showPicBedList = picBed.value.map(item => {
    if (item.visible) {
      return item.name
    }
    return null
  }).filter(item => item) as string[]
}

function openFile (file: string) {
  sendToMain(PICGO_OPEN_FILE, file)
}

function openLogSetting () {
  logFileVisible.value = true
}

async function cancelCustomLink () {
  customLinkVisible.value = false
  customLink.value = await getConfig<string>('settings.customLink') || '$url'
}

function confirmCustomLink () {
  $customLink.value?.validate((valid: boolean) => {
    if (valid) {
      saveConfig('settings.customLink', customLink.value)
      customLinkVisible.value = false
      sendToMain('updateCustomLink')
    } else {
      return false
    }
  })
}

async function cancelProxy () {
  proxyVisible.value = false
  proxy.value = await getConfig<string>('picBed.proxy') || ''
}

function confirmProxy () {
  proxyVisible.value = false
  saveConfig({
    'picBed.proxy': proxy.value,
    'settings.proxy': npmProxy.value,
    'settings.registry': npmRegistry.value
  })
  const successNotification = new Notification($T('SETTINGS_SET_PROXY_AND_MIRROR'), {
    body: $T('TIPS_SET_SUCCEED')
  })
  successNotification.onclick = () => {
    return true
  }
}

function updateHelperChange (val: ICheckBoxValueType) {
  saveConfig('settings.showUpdateTip', val)
}

function checkBetaUpdateChange (val: ICheckBoxValueType) {
  saveConfig('settings.checkBetaUpdate', val)
}

function useBuiltinClipboardChange (val: ICheckBoxValueType) {
  saveConfig('settings.useBuiltinClipboard', val)
}

function handleShowPicBedListChange (val: ICheckBoxValueType[]) {
  const list = picBed.value.map(item => {
    if (!val.includes(item.name)) {
      item.visible = false
    } else {
      item.visible = true
    }
    return item
  })
  saveConfig({
    'picBed.list': list
  })
  sendToMain(GET_PICBEDS)
}

function handleAutoStartChange (val: ICheckBoxValueType) {
  saveConfig('settings.autoStart', val)
  sendToMain('autoStart', val)
}

function handleRename (val: ICheckBoxValueType) {
  saveConfig({
    'settings.rename': val
  })
}

function handleAutoRename (val: ICheckBoxValueType) {
  saveConfig({
    'settings.autoRename': val
  })
}

function compareVersion2Update (current: string, latest: string): boolean {
  return compare(current, latest, '<')
}

async function checkUpdate () {
  checkUpdateVisible.value = true
  const version = await triggerRPC<string>(IRPCActionType.GET_LATEST_VERSION, form.checkBetaUpdate)
  if (version) {
    latestVersion.value = version
  } else {
    latestVersion.value = $T('TIPS_NETWORK_ERROR')
  }
}

function confirmCheckVersion () {
  if (needUpdate.value) {
    sendToMain(OPEN_URL, form.checkBetaUpdate ? BETA_RELEASE_URL : STABLE_RELEASE_URL)
  }
  checkUpdateVisible.value = false
}

function cancelCheckVersion () {
  checkUpdateVisible.value = false
}

function handleUploadNotification (val: ICheckBoxValueType) {
  saveConfig({
    'settings.uploadNotification': val
  })
}

function handleMiniWindowOntop (val: ICheckBoxValueType) {
  saveConfig('settings.miniWindowOntop', val)
  $message.info($T('TIPS_NEED_RELOAD'))
}

function handleAutoCopyUrl (val: ICheckBoxValueType) {
  saveConfig('settings.autoCopy', val)
  const successNotification = new Notification($T('SETTINGS_AUTO_COPY_URL_AFTER_UPLOAD'), {
    body: $T('TIPS_SET_SUCCEED')
  })
  successNotification.onclick = () => {
    return true
  }
}

function handleEncodeOutputURL (val: ICheckBoxValueType) {
  saveConfig('settings.encodeOutputURL', val)
  const successNotification = new Notification($T('SETTINGS_ENCODE_OUTPUT_URL'), {
    body: $T('TIPS_SET_SUCCEED')
  })
  successNotification.onclick = () => {
    return true
  }
}

function confirmLogLevelSetting () {
  if (form.logLevel.length === 0) {
    return $message.error($T('TIPS_PLEASE_CHOOSE_LOG_LEVEL'))
  }
  saveConfig({
    'settings.logLevel': form.logLevel,
    'settings.logFileSizeLimit': form.logFileSizeLimit
  })
  const successNotification = new Notification($T('SETTINGS_SET_LOG_FILE'), {
    body: $T('TIPS_SET_SUCCEED')
  })
  successNotification.onclick = () => {
    return true
  }
  logFileVisible.value = false
}

async function cancelLogLevelSetting () {
  logFileVisible.value = false
  let logLevel = await getConfig<string | string[]>('settings.logLevel')
  const logFileSizeLimit = await getConfig<number>('settings.logFileSizeLimit') || 10
  if (!Array.isArray(logLevel)) {
    if (logLevel && logLevel.length > 0) {
      logLevel = [logLevel]
    } else {
      logLevel = ['all']
    }
  }
  form.logLevel = logLevel
  form.logFileSizeLimit = logFileSizeLimit
}

function confirmServerSetting () {
  server.value.port = parseInt(server.value.port as unknown as string, 10)
  saveConfig({
    'settings.server': server.value
  })
  const successNotification = new Notification($T('SETTINGS_SET_PICGO_SERVER'), {
    body: $T('TIPS_SET_SUCCEED')
  })
  successNotification.onclick = () => {
    return true
  }
  serverVisible.value = false
  sendToMain('updateServer')
}

async function cancelServerSetting () {
  serverVisible.value = false
  server.value = await getConfig('settings.server') || {
    port: 36677,
    host: '127.0.0.1',
    enable: true
  }
}

function handleLevelDisabled (val: string) {
  const currentLevel = val
  let flagLevel
  const result = form.logLevel.some(item => {
    if (item === 'all' || item === 'none') {
      flagLevel = item
    }
    return (item === 'all' || item === 'none')
  })
  if (result) {
    if (currentLevel !== flagLevel) {
      return true
    }
  } else if (form.logLevel.length > 0) {
    if (val === 'all' || val === 'none') {
      return true
    }
  }
  return false
}

function handleLanguageChange (val: string) {
  i18nManager.setCurrentLanguage(val)
  saveConfig({
    'settings.language': val
  })
  sendToMain(GET_PICBEDS)
}

function goConfigPage () {
  sendToMain(OPEN_URL, 'https://picgo.github.io/PicGo-Doc/zh/guide/config.html#picgo设置')
}

function goShortCutPage () {
  $router.push({
    name: SHORTKEY_PAGE
  })
}

onBeforeUnmount(() => {
  ipcRenderer.removeListener(GET_PICBEDS, getPicBeds)
})

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
