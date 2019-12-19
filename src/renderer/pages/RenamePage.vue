<template>
  <div id="rename-page">
    <el-form
      @submit.native.prevent
    >
      <el-form-item
        label="文件改名"
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
        <el-button @click="cancel" round size="mini">取消</el-button>
        <el-button type="primary" @click="confirmName" round size="mini">确定</el-button>
      </div>
    </el-row>
  </div>
</template>
<script lang="ts">
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
  id: string | null = null
  created () {
    ipcRenderer.on('rename', (event: IpcRendererEvent, name: string, id: string) => {
      this.fileName = name
      this.id = id
    })
  }
  confirmName () {
    ipcRenderer.send(`rename${this.id}`, this.fileName)
  }
  cancel () {
    ipcRenderer.send(`rename${this.id}`, null)
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
