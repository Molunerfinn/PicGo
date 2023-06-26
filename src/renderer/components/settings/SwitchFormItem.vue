<template>
  <el-form-item>
    <template #label>
      <el-row align="middle">
        {{ props.label }}
        <template v-if="props.tooltips">
          <el-tooltip
            class="item"
            effect="dark"
            :content="props.tooltips"
            placement="right"
          >
            <el-icon class="ml-[4px] cursor-pointer hover:text-blue">
              <QuestionFilled />
            </el-icon>
          </el-tooltip>
        </template>
      </el-row>
    </template>
    <el-switch
      v-model="value"
      :active-text="$T('SETTINGS_OPEN')"
      :inactive-text="$T('SETTINGS_CLOSE')"
      @change="handleChange"
    />
  </el-form-item>
</template>
<script lang="ts" setup>
import { T as $T } from '@/i18n'
import { saveConfig } from '@/utils/dataSender'
import { QuestionFilled } from '@element-plus/icons-vue'
import { showNotification } from '@/utils/common'
import { useVModel } from '@/hooks/useVModel'

interface IProps {
  tooltips?: string
  settingProps: keyof ISettingForm
  label: string
  modelValue: boolean
}

const props = defineProps<IProps>()

const emit = defineEmits(['update:modelValue', 'change'])

const value = useVModel(props, 'modelValue')

const handleChange = (value: ISwitchValueType) => {
  saveConfig(`settings.${props.settingProps}`, value)
  emit('update:modelValue', value)
  emit('change', value)
  showNotification(props.label, $T('TIPS_SET_SUCCEED'))
}

</script>
<script lang="ts">
export default {
  name: 'SwitchFormItem'
}
</script>
<style lang='stylus'>
</style>
