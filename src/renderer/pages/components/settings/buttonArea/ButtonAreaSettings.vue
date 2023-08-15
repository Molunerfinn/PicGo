<template>
  <ButtonFormItem
    :label="$T('SETTINGS_OPEN_CONFIG_FILE')"
    :button-label="$T('SETTINGS_CLICK_TO_OPEN')"
    @click="openFile('data.json')"
  />
  <ButtonFormItem
    :label="$T('SETTINGS_SET_LOG_FILE')"
    :button-label="$T('SETTINGS_CLICK_TO_SET')"
    @click="logFileDialogVisible = true"
  />
  <ButtonFormItem
    :label="$T('SETTINGS_SET_SHORTCUT')"
    :button-label="$T('SETTINGS_CLICK_TO_SET')"
    @click="goShortCutPage"
  />
  <ButtonFormItem
    :label="$T('SETTINGS_CUSTOM_LINK_FORMAT')"
    :button-label="$T('SETTINGS_CLICK_TO_SET')"
    @click="customLinkDialogVisible = true"
  />
  <ButtonFormItem
    :label="$T('SETTINGS_SET_PROXY_AND_MIRROR')"
    :button-label="$T('SETTINGS_CLICK_TO_SET')"
    @click="proxySettingDialogVisible = true"
  />
  <ButtonFormItem
    :label="$T('SETTINGS_SET_SERVER')"
    :button-label="$T('SETTINGS_CLICK_TO_SET')"
    @click="serverSettingDialogVisible = true"
  />
  <ButtonFormItem
    :label="$T('SETTINGS_CHECK_UPDATE')"
    :button-label="$T('SETTINGS_CLICK_TO_CHECK')"
    @click="checkUpdateDialogVisible = true"
  />
  <LogSettingDialog
    v-model="logFileDialogVisible"
    v-model:log-level="form.logLevel"
    v-model:log-file-size-limit="form.logFileSizeLimit"
  />
  <CustomLinkDialog
    v-model="customLinkDialogVisible"
    v-model:custom-link="form.customLink"
  />
  <ProxySettingDialog
    v-model="proxySettingDialogVisible"
    v-model:proxy="proxyString"
    v-model:npm-proxy="form.npmProxy"
    v-model:npm-registry="form.npmRegistry"
  />
  <ServerSettingsDialog
    v-model="serverSettingDialogVisible"
    v-model:host="form.server.host"
    v-model:port="form.server.port"
    v-model:enable="form.server.enable"
  />
  <CheckUpdateDialog
    v-model="checkUpdateDialogVisible"
    v-model:checkBetaUpdate="form.checkBetaUpdate"
  />
</template>
<script lang="ts" setup>
import ButtonFormItem from '@/components/settings/ButtonFormItem.vue'
import CustomLinkDialog from './CustomLinkDialog.vue'
import ProxySettingDialog from './ProxySettingDialog.vue'
import ServerSettingsDialog from './ServerSettingsDialog.vue'
import CheckUpdateDialog from './CheckUpdateDialog.vue'
import { T as $T } from '@/i18n'
import { sendToMain } from '@/utils/dataSender'
import { reactive, ref } from 'vue'
import { PICGO_OPEN_FILE } from '~/universal/events/constants'
import LogSettingDialog from './LogSettingDialog.vue'
import { useRouter } from 'vue-router'
import { SHORTKEY_PAGE } from '@/router/config'
import { useVModel } from '@/hooks/useVModel'

const $router = useRouter()

interface IProps {
  settings: ISettingForm
  proxy: string
}

const props = defineProps<IProps>()

const form = reactive(props.settings)
const proxyString = useVModel(props, 'proxy')

const logFileDialogVisible = ref(false)
const customLinkDialogVisible = ref(false)
const proxySettingDialogVisible = ref(false)
const serverSettingDialogVisible = ref(false)
const checkUpdateDialogVisible = ref(false)

function openFile (file: string) {
  sendToMain(PICGO_OPEN_FILE, file)
}

function goShortCutPage () {
  $router.push({
    name: SHORTKEY_PAGE
  })
}

</script>
<script lang="ts">
export default {
  name: 'ButtonAreaSettings'
}
</script>
<style lang='stylus'>
</style>
