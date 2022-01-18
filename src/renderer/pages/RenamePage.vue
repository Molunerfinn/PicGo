<template>
  <div id="rename-page">
    <el-form
      @submit.native.prevent
    >
      <el-form-item
        :label="$T('FILE_RENAME')"
      >
        <el-input
          v-model="fileName"
          size="small"
          @keyup.enter.native="confirmName"
        ></el-input>
      </el-form-item>
    </el-form>
    <el-row>
      <div class="pull-right">
        <el-button @click="cancel" round size="mini">{{ $T('CANCEL') }}</el-button>
        <el-button type="primary" @click="confirmName" round size="mini">{{ $T('CONFIRM') }}</el-button>
      </div>
    </el-row>
  </div>
</template>
<script lang="ts">
import { RENAME_FILE_NAME } from '#/events/constants'
import { Component, Vue } from 'vue-property-decorator'
import mixin from '@/utils/mixin'
import {
  ipcRenderer,
  IpcRendererEvent
} from 'electron'
@Component({
  name: 'rename-page',
  mixins: [mixin]
})
export default class extends Vue {
  fileName: string = ''
  originName: string = ''
  id: string | null = null
  created () {
    ipcRenderer.on(RENAME_FILE_NAME, (event: IpcRendererEvent, newName: string, originName: string, id: string) => {
      this.fileName = newName
      this.originName = originName
      this.id = id
    })
  }

  confirmName () {
    ipcRenderer.send(`${RENAME_FILE_NAME}${this.id}`, this.fileName)
  }

  cancel () {
    // if cancel, use origin file name
    ipcRenderer.send(`${RENAME_FILE_NAME}${this.id}`, this.originName)
  }

  beforeDestroy () {
    ipcRenderer.removeAllListeners('rename')
  }
}
</script>
<style lang='stylus'>
  #rename-page
    padding 0 20px
    .pull-right
      float right
    .el-form-item__label
      color #ddd
</style>
