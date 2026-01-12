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
      :rows="inputBoxOptions.inputType === 'textarea' ? 6 : undefined"
      :class="{ 'input-box__textarea': inputBoxOptions.inputType === 'textarea' }"
    />
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
import { ref, reactive, onBeforeUnmount, onBeforeMount } from 'vue'
import { ipcRenderer, IpcRendererEvent } from 'electron'
import {
  SHOW_INPUT_BOX,
  SHOW_INPUT_BOX_RESPONSE
} from '~/universal/events/constants'
import $bus from '@/utils/bus'
import { sendToMain } from '@/utils/dataSender'
const inputBoxValue = ref('')
const showInputBoxVisible = ref(false)
const inputBoxOptions = reactive({
  title: '',
  placeholder: '',
  inputType: 'text' as 'text' | 'textarea',
  width: 500
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
  inputBoxOptions.title = options.title || ''
  inputBoxOptions.placeholder = options.placeholder || ''
  inputBoxOptions.inputType = options.inputType || 'text'
  inputBoxOptions.width = options.width || 400
  showInputBoxVisible.value = true
}

function handleInputBoxCancel () {
  // TODO: RPCServer
  showInputBoxVisible.value = false
  sendToMain(SHOW_INPUT_BOX, '')
  $bus.emit(SHOW_INPUT_BOX_RESPONSE, '')
}

function handleInputBoxConfirm () {
  showInputBoxVisible.value = false
  sendToMain(SHOW_INPUT_BOX, inputBoxValue.value)
  $bus.emit(SHOW_INPUT_BOX_RESPONSE, inputBoxValue.value)
}

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
