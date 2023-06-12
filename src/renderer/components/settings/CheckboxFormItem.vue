<template>
  <el-form-item>
    <template #label>
      <el-row align="middle">
        {{ props.settingText }}
        <template v-if="props.tooltips">
          <el-tooltip
            class="item"
            effect="dark"
            :content="props.tooltips"
            placement="right"
          >
            <el-icon style="margin-left: 4px">
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
import { ref, watch } from 'vue'
import { QuestionFilled } from '@element-plus/icons-vue'

interface IProps {
  tooltips?: string
  settingProps: string
  settingText: string
  defaultValue: boolean
}

const props = defineProps<IProps>()

// to fix v-model blank bug
watch(() => props.defaultValue, (v) => {
  value.value = v
})

const value = ref<boolean>(props.defaultValue)
const emit = defineEmits(['change'])

const handleChange = (val: ICheckBoxValueType) => {
  saveConfig(props.settingProps, val)
  emit('change', val)
}

</script>
<script lang="ts">
export default {
  name: 'CheckboxFormItem'
}

</script>
<style lang='stylus'>
</style>
