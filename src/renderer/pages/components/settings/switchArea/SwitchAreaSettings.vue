<template>
  <SwitchFormItem
    v-model="form.showUpdateTip"
    setting-props="showUpdateTip"
    :label="$T('SETTINGS_OPEN_UPDATE_HELPER')"
  />
  <SwitchFormItem
    v-show="form.showUpdateTip"
    v-model="form.checkBetaUpdate"
    setting-props="checkBetaUpdate"
    :label="$T('SETTINGS_ACCEPT_BETA_UPDATE')"
  />
  <SwitchFormItem
    v-model="form.autoStart"
    setting-props="autoStart"
    :label="$T('SETTINGS_LAUNCH_ON_BOOT')"
    @change="handleAutoStartChange"
  />
  <SwitchFormItem
    v-model="form.rename"
    setting-props="rename"
    :label="$T('SETTINGS_RENAME_BEFORE_UPLOAD')"
  />
  <SwitchFormItem
    v-model="form.autoRename"
    setting-props="autoRename"
    :label="$T('SETTINGS_TIMESTAMP_RENAME')"
  />
  <SwitchFormItem
    v-model="form.uploadNotification"
    setting-props="uploadNotification"
    :label="$T('SETTINGS_OPEN_UPLOAD_TIPS')"
  />
  <SwitchFormItem
    v-if="os !== 'darwin'"
    v-model="form.miniWindowOnTop"
    :label="$T('SETTINGS_MINI_WINDOW_ON_TOP')"
    setting-props="miniWindowOnTop"
    @change="handleMiniWindowOnTop"
  />
  <SwitchFormItem
    v-model="form.autoCopyUrl"
    :label="$T('SETTINGS_AUTO_COPY_URL_AFTER_UPLOAD')"
    setting-props="autoCopyUrl"
  />
  <SwitchFormItem
    v-model="form.useBuiltinClipboard"
    :label="$T('SETTINGS_USE_BUILTIN_CLIPBOARD_UPLOAD')"
    :tooltips="$T('BUILTIN_CLIPBOARD_TIPS')"
    setting-props="useBuiltinClipboard"
  />
  <SwitchFormItem
    v-model="form.encodeOutputURL"
    :label="$T('SETTINGS_ENCODE_OUTPUT_URL')"
    setting-props="encodeOutputURL"
  />
  <SwitchFormItem
    v-if="os === 'darwin'"
    v-model="form.showDockIcon"
    setting-props="showDockIcon"
    :label="$T('SETTINGS_SHOW_DOCK_ICON')"
    @change="handleShowDockIcon"
  />
</template>
<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { T as $T } from '@/i18n/index'
import { ElMessage as $message } from 'element-plus'
import { sendRPC, sendToMain } from '@/utils/dataSender'
import { IRPCActionType } from '~/universal/types/enum'
import SwitchFormItem from '@/components/settings/SwitchFormItem.vue'

const os = ref(process.platform)

interface IProps {
  settings: ISettingForm
}
const props = defineProps<IProps>()

const form = reactive(props.settings)

function handleAutoStartChange (val: ISwitchValueType) {
  sendToMain('autoStart', val)
}

function handleMiniWindowOnTop () {
  $message.info($T('TIPS_NEED_RELOAD'))
}

function handleShowDockIcon (val: ISwitchValueType) {
  sendRPC(IRPCActionType.SHOW_DOCK_ICON, val)
}

</script>
<script lang="ts">
export default {
  name: 'SwitchAreaSettings'
}
</script>
<style lang='stylus'>
</style>
