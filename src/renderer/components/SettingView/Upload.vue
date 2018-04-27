<template>
  <div id="upload-view">
    <el-row :gutter="16">
      <el-col :span="20" :offset="2">
        <div class="view-title">
          图片上传 - {{ picBed }}
        </div>
        <div
          id="upload-area"
          :class="{ 'is-dragover': dragover }" @drop.prevent="onDrop" @dragover.prevent="dragover = true" @dragleave.prevent="dragover = false"
        >
          <div id="upload-dragger" @click="openUplodWindow">
            <i class="el-icon-upload"></i>
            <div class="upload-dragger__text">
              将文件拖到此处，或 <span>点击上传</span>
            </div>
            <input type="file" id="file-uploader" @change="onChange" multiple>
          </div>
        </div>
        <el-progress 
          :percentage="progress" 
          :show-text="false" 
          class="upload-progress"
          :class="{ 'show': showProgress }"
          :status="showError ? 'exception' : ''"
        ></el-progress>
        <div class="paste-style">
          <div class="el-col-16">
            <div class="paste-style__text">
              链接格式
            </div>
            <el-radio-group v-model="pasteStyle" size="mini"
              @change="handlePasteStyleChange"
            >
              <el-radio-button label="markdown">
                Markdown
              </el-radio-button>
              <el-radio-button label="HTML"></el-radio-button>
              <el-radio-button label="URL"></el-radio-button>
              <el-radio-button label="UBB"></el-radio-button>
              <el-radio-button label="Custom" title="自定义"></el-radio-button>
            </el-radio-group>
          </div>
          <div class="el-col-8">
            <div class="paste-style__text">
              快捷上传
            </div>
            <el-button type="primary" round size="mini" @click="uploadClipboardFiles">剪贴板图片上传</el-button>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>
<script>
import mixin from '../mixin'
import { picBed } from '../../../datastore/pic-bed'
export default {
  name: 'upload',
  mixins: [mixin],
  data () {
    return {
      dragover: false,
      progress: 0,
      showProgress: false,
      showError: false,
      pasteStyle: '',
      picBed: ''
    }
  },
  mounted () {
    this.$electron.ipcRenderer.on('uploadProgress', (event, progress) => {
      if (progress !== -1) {
        this.showProgress = true
        this.progress = progress
      } else {
        this.progress = 100
        this.showError = true
      }
    })
    this.getPasteStyle()
    this.getDefaultPicBed()
  },
  watch: {
    progress (val) {
      if (val === 100) {
        setTimeout(() => {
          this.showProgress = false
          this.showError = false
        }, 1000)
        setTimeout(() => {
          this.progress = 0
        }, 1200)
      }
    }
  },
  beforeDestroy () {
    this.$electron.ipcRenderer.removeAllListeners('uploadProgress')
  },
  methods: {
    onDrop (e) {
      this.dragover = false
      this.ipcSendFiles(e.dataTransfer.files)
    },
    openUplodWindow () {
      document.getElementById('file-uploader').click()
    },
    onChange (e) {
      this.ipcSendFiles(e.target.files)
      document.getElementById('file-uploader').value = ''
    },
    ipcSendFiles (files) {
      let sendFiles = []
      Array.from(files).forEach((item, index) => {
        let obj = {
          name: item.name,
          path: item.path
        }
        sendFiles.push(obj)
      })
      this.$electron.ipcRenderer.send('uploadChoosedFiles', sendFiles)
    },
    getPasteStyle () {
      this.pasteStyle = this.$db.read().get('picBed.pasteStyle').value() || 'markdown'
    },
    handlePasteStyleChange (val) {
      this.$db.read().set('picBed.pasteStyle', val)
        .write()
    },
    uploadClipboardFiles () {
      this.$electron.ipcRenderer.send('uploadClipboardFilesFromUploadPage')
    },
    getDefaultPicBed () {
      const current = this.$db.read().get('picBed.current').value()
      picBed.forEach(item => {
        if (item.type === current) {
          this.picBed = item.name
        }
      })
    }
  }
}
</script>
<style lang='stylus'>
.view-title
  color #eee
  font-size 20px
  text-align center
  margin 20px auto
#upload-view
  #upload-area
    height 220px
    border 2px dashed #dddddd
    border-radius 8px
    text-align center
    width 450px
    margin-left 25px
    color #dddddd
    cursor pointer
    transition all .2s ease-in-out
    #upload-dragger
      height 100%
    &.is-dragover,
    &:hover
      border 2px dashed #A4D8FA
      background-color rgba(164, 216, 250, 0.3)
      color #fff
    i
      font-size 66px
      margin 50px 0 16px
      line-height 66px
    span
      color #409EFF
  #file-uploader
    display none
  .upload-progress
    margin-top 20px
    opacity 0
    transition all .2s ease-in-out
    width 450px
    margin-left 25px
    &.show
      opacity 1
    .el-progress-bar__inner
      transition all .2s ease-in-out
  .paste-style
    text-align center
    margin-top 16px
    &__text
      font-size 12px
      color #eeeeee
      margin-bottom 4px
  .el-radio-button:first-child
    .el-radio-button__inner
      border-left none
  .el-radio-button:first-child
    .el-radio-button__inner
      border-left none
      border-radius 14px 0 0 14px
  .el-radio-button:last-child
    .el-radio-button__inner
      border-left none
      border-radius 0 14px 14px 0
</style>