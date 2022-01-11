<template>
  <el-dialog
    :title="inputBoxOptions.title || $T('INPUT')"
    :visible.sync="showInputBoxVisible"
    :modal-append-to-body="false"
  >
    <el-input
      v-model="inputBoxValue"
      :placeholder="inputBoxOptions.placeholder"></el-input>
    <span slot="footer">
      <el-button @click="handleInputBoxCancel" round>{{ $T('CANCEL') }}</el-button>
      <el-button type="primary" @click="handleInputBoxConfirm" round>{{ $T('CONFIRM') }}</el-button>
    </span>
  </el-dialog>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { ipcRenderer, IpcRendererEvent } from 'electron'
import {
  SHOW_INPUT_BOX,
  SHOW_INPUT_BOX_RESPONSE
} from '~/universal/events/constants'
@Component({
  name: 'input-box-dialog'
})
export default class extends Vue {
  inputBoxValue = ''
  showInputBoxVisible = false
  inputBoxOptions = {
    title: '',
    placeholder: ''
  }

  created () {
    ipcRenderer.on(SHOW_INPUT_BOX, this.ipcEventHandler)
    this.$bus.$on(SHOW_INPUT_BOX, this.initInputBoxValue)
  }

  ipcEventHandler (evt: IpcRendererEvent, options: IShowInputBoxOption) {
    this.initInputBoxValue(options)
  }

  initInputBoxValue (options: IShowInputBoxOption) {
    this.inputBoxValue = options.value || ''
    this.inputBoxOptions.title = options.title || ''
    this.inputBoxOptions.placeholder = options.placeholder || ''
    this.showInputBoxVisible = true
  }

  handleInputBoxCancel () {
    // TODO: RPCServer
    this.showInputBoxVisible = false
    ipcRenderer.send(SHOW_INPUT_BOX, '')
    this.$bus.$emit(SHOW_INPUT_BOX_RESPONSE, '')
  }

  handleInputBoxConfirm () {
    this.showInputBoxVisible = false
    ipcRenderer.send(SHOW_INPUT_BOX, this.inputBoxValue)
    this.$bus.$emit(SHOW_INPUT_BOX_RESPONSE, this.inputBoxValue)
  }

  beforeDestroy () {
    ipcRenderer.removeListener(SHOW_INPUT_BOX, this.ipcEventHandler)
    this.$bus.$off(SHOW_INPUT_BOX)
  }
}
</script>
<style lang='stylus'>
</style>
