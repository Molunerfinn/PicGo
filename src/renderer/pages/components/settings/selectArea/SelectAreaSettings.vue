<template>
  <SelectFormItem
    v-model="form.language"
    :list="languageList"
    :label="$T('SETTINGS_CHOOSE_LANGUAGE')"
    :placeholder="$T('SETTINGS_CHOOSE_LANGUAGE')"
    @change="handleLanguageChange"
  />
  <SelectFormItem
    v-model="form.startupMode"
    :list="startupModeList"
    :label="$T('SETTINGS_STARTUP_MODE')"
    @change="handleChangeStartupMode"
  />
</template>
<script lang="ts" setup>
import { reactive } from 'vue'
import { T as $T, i18nManager } from '@/i18n'
import { saveConfig, sendToMain } from '@/utils/dataSender'
import { GET_PICBEDS } from '~/universal/events/constants'
import SelectFormItem from '@/components/settings/SelectFormItem.vue'
import { IStartupMode } from '~/universal/types/enum'
import { isMacOS } from '~/universal/utils/common'

interface IProps {
  settings: ISettingForm
}
const props = defineProps<IProps>()

const form = reactive(props.settings)

const languageList = i18nManager.languageList.map(item => ({
  label: item.label,
  value: item.value
}))

const startupModeList = [
  {
    label: $T('SETTINGS_STARTUP_MODE_MAIN_WINDOW'),
    value: IStartupMode.SHOW_MAIN_WINDOW
  },
  {
    label: $T('SETTINGS_STARTUP_MODE_MINI_WINDOW'),
    value: IStartupMode.SHOW_MINI_WINDOW,
    hide: isMacOS
  },
  {
    label: $T('SETTINGS_STARTUP_MODE_HIDE'),
    value: IStartupMode.HIDE
  }
].filter(item => !item.hide)

function handleLanguageChange (val: string) {
  i18nManager.setCurrentLanguage(val)
  saveConfig({
    'settings.language': val
  })
  sendToMain(GET_PICBEDS)
}

function handleChangeStartupMode (val: IStartupMode) {
  saveConfig({
    'settings.startupMode': val
  })
}

</script>
<script lang="ts">
export default {
  name: 'SelectAreaSettings'
}
</script>
<style lang='stylus'>
</style>
