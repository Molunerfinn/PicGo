<template>
  <div class="toolbox-handler">
    <ElButton
      type="text"
      @click="() => props.handler(value)"
    >
      {{ props.handlerText }}
    </ElButton>
  </div>
</template>
<script lang="ts" setup>
import { IToolboxItemCheckStatus } from '~/universal/types/enum'
interface IProps {
  status: IToolboxItemCheckStatus
  value: any
  handlerText: string
  handler: (value: any) => void | Promise<void>
}

const props = defineProps<IProps>()

</script>
<script lang="ts">
export default {
  name: 'ToolboxHandler'
}
</script>
<style lang='stylus'>
</style>
