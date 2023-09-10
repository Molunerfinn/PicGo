<template>
  <el-dialog
    v-model="showInputBoxVisible"
    :title="inputBoxOptions.title || $T('INPUT')"
    :modal-append-to-body="false"
  >
    <el-input
      v-model="inputBoxValue"
      :placeholder="inputBoxOptions.placeholder"
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
  placeholder: ''
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
</style>
