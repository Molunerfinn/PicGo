<template>
  <el-form
    label-position="left"
    label-width="50%"
    size="small"
  >
    <el-form-item
      :label="label"
    >
      <el-select
        v-model="currentValue"
        size="small"
        style="width: 100%"
        :placeholder="placeholder"
        @change="handleChange"
      >
        <el-option
          v-for="item in list"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>
  </el-form>
</template>
<script lang="ts" setup generic="T extends string | number">
import { useVModel } from '@/hooks/useVModel'

interface IProps {
  modelValue: T
  label: string
  placeholder?: string
  list: {
    label: string
    value: T
  }[]
}

const props = defineProps<IProps>()
const emit = defineEmits(['change'])

const currentValue = useVModel(props, 'modelValue')

const handleChange = (val: T) => {
  emit('change', val)
}

</script>
<script lang="ts">
export default {
  name: 'SelectFormItem'
}
</script>
<style lang='stylus'>
</style>
