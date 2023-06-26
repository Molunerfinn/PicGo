<template>
  <SelectFormItem
    v-model="form.language"
    :list="languageList"
    :label="$T('SETTINGS_CHOOSE_LANGUAGE')"
    :placeholder="$T('SETTINGS_CHOOSE_LANGUAGE')"
    @change="handleLanguageChange"
  />
</template>
<script lang="ts" setup>
import { reactive } from 'vue'
import { T as $T, i18nManager } from '@/i18n'
import { saveConfig, sendToMain } from '@/utils/dataSender'
import { GET_PICBEDS } from '~/universal/events/constants'
import SelectFormItem from '@/components/settings/SelectFormItem.vue'

interface IProps {
  settings: ISettingForm
}
const props = defineProps<IProps>()

const form = reactive(props.settings)

const languageList = i18nManager.languageList.map(item => ({
  label: item.label,
  value: item.value
}))

function handleLanguageChange (val: string) {
  i18nManager.setCurrentLanguage(val)
  saveConfig({
    'settings.language': val
  })
  sendToMain(GET_PICBEDS)
}

</script>
<script lang="ts">
export default {
  name: 'SelectAreaSettings'
}
</script>
<style lang='stylus'>
</style>
