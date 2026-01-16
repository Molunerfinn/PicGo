<template>
  <el-dialog
    v-model="showInputBoxVisible"
    :title="inputBoxOptions.title || $T('INPUT')"
    :append-to-body="true"
    :width="inputBoxOptions.width + 'px'"
  >
    <el-input
      v-model="inputBoxValue"
      :placeholder="inputBoxOptions.placeholder"
      :type="inputBoxOptions.inputType || 'text'"
      :show-password="inputBoxOptions.inputType === 'password'"
      :rows="inputBoxOptions.inputType === 'textarea' ? 6 : undefined"
      :class="{ 'input-box__textarea': inputBoxOptions.inputType === 'textarea' }"
    />
    <el-input
      v-if="inputBoxOptions.hasConfirm"
      v-model="inputBoxConfirmValue"
      class="mt-[12px]"
      :placeholder="inputBoxOptions.confirmPlaceholder"
      :type="inputBoxOptions.inputType || 'text'"
      :show-password="inputBoxOptions.inputType === 'password'"
    />
    <div
      v-if="confirmError"
      class="mt-[8px] text-[12px] text-[#f56c6c] leading-[18px]"
    >
      {{ confirmError }}
    </div>
    <template #footer>
      <el-button
        round
        @click="handleInputBoxCancel"
      >
        {{ $T('CANCEL') }}
      </el-button>
      <el-button
        type="primary"
        round
        @click="handleInputBoxConfirm"
      >
        {{ $T('CONFIRM') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { ref, reactive, onBeforeUnmount, onBeforeMount, watch } from 'vue'
import { ipcRenderer, IpcRendererEvent } from 'electron'
import {
  SHOW_INPUT_BOX,
  SHOW_INPUT_BOX_RESPONSE
} from '~/universal/events/constants'
import $bus from '@/utils/bus'
import { sendToMain } from '@/utils/dataSender'
import { T as $T } from '@/i18n/index'
const inputBoxValue = ref('')
const inputBoxConfirmValue = ref('')
const confirmError = ref('')
const showInputBoxVisible = ref(false)
const inputBoxOptions = reactive({
  title: '',
  placeholder: '',
  inputType: 'text' as 'text' | 'textarea' | 'password',
  width: 500,
  hasConfirm: false,
  confirmPlaceholder: ''
})

onBeforeMount(() => {
  ipcRenderer.on(SHOW_INPUT_BOX, ipcEventHandler)
  $bus.on(SHOW_INPUT_BOX, initInputBoxValue)
})

function ipcEventHandler (evt: IpcRendererEvent, options: IShowInputBoxOption) {
  initInputBoxValue(options)
}

function initInputBoxValue (options: IShowInputBoxOption) {
  inputBoxValue.value = options.value || ''
  inputBoxConfirmValue.value = options.confirm?.value || ''
  inputBoxOptions.title = options.title || ''
  inputBoxOptions.placeholder = options.placeholder || ''
  inputBoxOptions.inputType = options.inputType || 'text'
  inputBoxOptions.width = options.width || 400
  inputBoxOptions.hasConfirm = !!options.confirm
  inputBoxOptions.confirmPlaceholder = options.confirm?.placeholder || ''
  confirmError.value = ''
  showInputBoxVisible.value = true
}

function handleInputBoxCancel () {
  // TODO: RPCServer
  showInputBoxVisible.value = false
  sendToMain(SHOW_INPUT_BOX, '')
  $bus.emit(SHOW_INPUT_BOX_RESPONSE, '')
}

function handleInputBoxConfirm () {
  if (inputBoxOptions.hasConfirm && inputBoxValue.value !== inputBoxConfirmValue.value) {
    confirmError.value = $T('INPUT_BOX_CONFIRM_MISMATCH')
    return
  }
  showInputBoxVisible.value = false
  sendToMain(SHOW_INPUT_BOX, inputBoxValue.value)
  $bus.emit(SHOW_INPUT_BOX_RESPONSE, inputBoxValue.value)
}

watch([inputBoxValue, inputBoxConfirmValue], () => {
  confirmError.value = ''
})

onBeforeUnmount(() => {
  ipcRenderer.removeListener(SHOW_INPUT_BOX, ipcEventHandler)
  $bus.off(SHOW_INPUT_BOX)
})

</script>
<script lang="ts">
export default {
  name: 'InputBoxDialog'
}
</script>
<style lang='stylus'>
.input-box__textarea
  .el-textarea__inner
    resize vertical
    max-height 240px
</style>
