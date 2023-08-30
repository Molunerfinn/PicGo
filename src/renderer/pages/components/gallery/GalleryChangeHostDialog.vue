<template>
  <div class="">
    <ConfirmDialog
      v-model="visible"
      title="修改HOST"
      @confirm="handleConfirm"
    >
      <template #body>
        123
      </template>
    </ConfirmDialog>
  </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue'
import ConfirmDialog from '../dialog/ConfirmDialog.vue'
import { useIPCOn } from '@/hooks/useIPC'
import { IRPCActionType } from '~/universal/types/enum'

const visible = ref(false)
useIPCOn(IRPCActionType.OPEN_CHANGE_HOST_DIALOG, () => {
  visible.value = true
})
const handleConfirm = () => {
  visible.value = false
}

</script>
<script lang="ts">
export default {
  name: 'GalleryChangeHostDialog'
}
</script>
<style lang='stylus'>
</style>
