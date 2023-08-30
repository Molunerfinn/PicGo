<template>
  <ElDialog
    v-model="visible"
    :title="title"
    @close="handleClose"
  >
    <slot name="body" />
    <template #footer>
      <slot
        v-if="footerSlots"
        name="footer"
      />
      <template v-else>
        <ElButton
          type="default"
          round
          @click="handleCancel"
        >
          {{ cancelButtonText }}
        </ElButton>
        <ElButton
          type="primary"
          round
          @click="handleConfirm"
        >
          {{ confirmButtonText }}
        </ElButton>
      </template>
    </template>
  </ElDialog>
</template>
<script lang="ts" setup>
import { useVModel } from '@/hooks/useVModel'
import { T as $T } from '@/i18n/index'
import { useSlots, ref } from 'vue'

interface IProps {
  modelValue: boolean
  title: string
  confirmButtonText?: string
  cancelButtonText?: string
}
const props = withDefaults(defineProps<IProps>(), {
  confirmButtonText: $T('CONFIRM'),
  cancelButtonText: $T('CANCEL')
})
const $emit = defineEmits(['confirm', 'cancel', 'close'])

const isCancel = ref(false)
const isConfirm = ref(false)

const visible = useVModel(props, 'modelValue')

const handleClose = () => {
  if (isConfirm.value) {
    return
  }
  if (isCancel.value) {
    $emit('cancel')
    isCancel.value = false
  } else {
    $emit('close')
  }
}

const handleCancel = () => {
  isCancel.value = true
  visible.value = false
}

const handleConfirm = () => {
  isConfirm.value = true
  $emit('confirm')
}

const footerSlots = !!useSlots().footer

</script>
<script lang="ts">
export default {
  name: 'ConfirmDialog'
}
</script>
<style lang='stylus'>
</style>
