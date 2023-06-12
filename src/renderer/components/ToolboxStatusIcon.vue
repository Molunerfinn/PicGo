<template>
  <el-icon
    :color="color"
    class="toolbox-status-icon"
  >
    <template v-if="props.status === IToolboxItemCheckStatus.SUCCESS">
      <SuccessFilled />
    </template>
    <template v-if="props.status === IToolboxItemCheckStatus.ERROR">
      <CircleCloseFilled />
    </template>
    <template v-if="props.status === IToolboxItemCheckStatus.LOADING">
      <Loading />
    </template>
  </el-icon>
</template>
<script lang="ts" setup>
import { CircleCloseFilled, Loading, SuccessFilled } from '@element-plus/icons-vue'
import { computed } from 'vue'
import { IToolboxItemCheckStatus } from '~/universal/types/enum'
interface IProps {
  status: IToolboxItemCheckStatus
}

const props = defineProps<IProps>()

const color = computed(() => {
  switch (props.status) {
    case IToolboxItemCheckStatus.SUCCESS:
      return '#67C23A'
    case IToolboxItemCheckStatus.ERROR:
      return '#F56C6C'
    default:
      return '#909399'
  }
})

</script>
<script lang="ts">
export default {
  name: 'ToolboxStatusIcon'
}
</script>
<style lang='stylus'>
.toolbox-status-icon {
  margin-left: 8px;
}
</style>
