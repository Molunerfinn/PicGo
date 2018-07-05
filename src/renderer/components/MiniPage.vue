<template>
  <div id="mini-page"
    :style="{ 'backgroundImage': 'url(' + logo + ')' }"
  >
    <!-- <i class="el-icon-upload2"></i> -->
  <div
    id="upload-area"
    :class="{ 'is-dragover': dragover, 'uploading': showProgress }" @drop.prevent="onDrop" @dragover.prevent="dragover = true" @dragleave.prevent="dragover = false"
    :style="{ backgroundPosition: '0 ' + progress + '%'}"
  >
    <div id="upload-dragger" @dblclick="openUplodWindow">
      <input type="file" id="file-uploader" @change="onChange" multiple>
    </div>
  </div>
  </div>
</template>
<script>
import mixin from './mixin'
export default {
  name: 'mini-page',
  mixins: [mixin],
  data () {
    return {
      logo: 'static/logo.png',
      dragover: false,
      progress: 0,
      showProgress: false,
      showError: false
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
    }
  },
  beforeDestroy () {
    this.$electron.ipcRenderer.removeAllListeners('uploadProgress')
  }
}
</script>
<style lang='stylus'>
  #mini-page
    background #409EFF
    color #FFF
    height 100vh
    width 100vw
    -webkit-app-region: drag
    border-radius 50%
    text-align center
    line-height 100vh
    font-size 40px
    background-size 90vh 90vw
    background-position center center
    background-repeat no-repeat
    position relative
    border 4px solid #fff
    box-sizing border-box
    #upload-area
      height 100%
      width 100%
      border-radius 50%
      transition all .2s ease-in-out
      &.uploading
        background: linear-gradient(to top, #409EFF 50%, #fff 51%)
        background-size 200%
      #upload-dragger
        height 100%
      &.is-dragover
        background rgba(0,0,0,0.3)
    #file-uploader
      display none
</style>