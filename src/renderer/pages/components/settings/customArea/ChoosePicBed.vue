<template>
  <el-form-item
    :style="{ marginRight: '-64px' }"
    :label="$T('CHOOSE_SHOWED_PICBED')"
  >
    <el-checkbox-group
      v-model="showPicBedList"
      @change="handleShowPicBedListChange"
    >
      <el-checkbox
        v-for="item in picBed"
        :key="item.name"
        :label="item.name"
      />
    </el-checkbox-group>
  </el-form-item>
</template>
<script lang="ts" setup>
import { onBeforeMount, ref } from 'vue'
import { T as $T } from '@/i18n'
import { GET_PICBEDS } from '#/events/constants'
import { saveConfig, sendToMain } from '@/utils/dataSender'
import { useIPCOn } from '@/hooks/useIPC'
import { useVModel } from '@/hooks/useVModel'

interface IProps {
  showPicBedList: string[]
}
const props = defineProps<IProps>()

const picBed = ref<IPicBedType[]>([])
const showPicBedList = useVModel(props, 'showPicBedList')

function handleShowPicBedListChange (val: ISwitchValueType[]) {
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

onBeforeMount(() => {
  sendToMain(GET_PICBEDS)
  useIPCOn(GET_PICBEDS, getPicBeds)
})

function getPicBeds (event: Event, picBeds: IPicBedType[]) {
  picBed.value = picBeds
  showPicBedList.value = picBed.value.map(item => {
    if (item.visible) {
      return item.name
    }
    return null
  }).filter(item => item) as string[]
}

</script>
<script lang="ts">
export default {
  name: 'ChoosePicBed'
}
</script>
<style lang='stylus'>
</style>
