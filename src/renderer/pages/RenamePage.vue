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
<script>
import mixin from '@/utils/mixin'
export default {
  name: 'rename-page',
  mixins: [mixin],
  data () {
    return {
      fileName: '',
      id: null
    }
  },
  created () {
    this.$electron.ipcRenderer.on('rename', (event, name, id) => {
      this.fileName = name
      this.id = id
    })
  },
  methods: {
    confirmName () {
      this.$electron.ipcRenderer.send(`rename${this.id}`, this.fileName)
    },
    cancel () {
      this.$electron.ipcRenderer.send(`rename${this.id}`, null)
    }
  },
  beforeDestroy () {
    this.$electron.ipcRenderer.removeAllListeners('rename')
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