<template>
  <ChoosePicBed
    v-model:showPicBedList="form.showPicBedList"
  />
</template>
<script lang="ts" setup>
import { reactive } from 'vue'
import ChoosePicBed from './ChoosePicBed.vue'

interface IProps {
  settings: ISettingForm
}
const props = defineProps<IProps>()
const form = reactive(props.settings)
</script>
<script lang="ts">
export default {
  name: 'CustomAreaSettings'
}
</script>
<style lang='stylus'>
</style>
