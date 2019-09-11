<template>
  <div id="upload-view">
    <el-row :gutter="16">
      <el-col :span="20" :offset="2">
        <div class="view-title">
          图片上传 - {{ picBedName }} <i class="el-icon-caret-bottom" @click="handleChangePicBed"></i>
        </div>
        <div
          id="upload-area"
          :class="{ 'is-dragover': dragover }"
          @drop.prevent="onDrop"
          @dragover.prevent="dragover = true"
          @dragleave.prevent="dragover = false"
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
          :status="showError ? 'exception' : 'text'" 
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
            <el-button type="primary" round size="mini" @click="uploadClipboardFiles" class="paste-upload">剪贴板图片上传</el-button>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>
<script>
export default {
  name: 'upload',
  data () {
    return {
      dragover: false,
      progress: 0,
      showProgress: false,
      showError: false,
      pasteStyle: '',
      picBed: [],
      picBedName: '',
      menu: null
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
    this.$electron.ipcRenderer.on('syncPicBed', () => {
      this.getDefaultPicBed()
    })
    this.$electron.ipcRenderer.send('getPicBeds')
    this.$electron.ipcRenderer.on('getPicBeds', this.getPicBeds)
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
    this.$electron.ipcRenderer.removeAllListeners('syncPicBed')
    this.$electron.ipcRenderer.removeListener('getPicBeds', this.getPicBeds)
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
      this.pasteStyle = this.$db.get('settings.pasteStyle') || 'markdown'
    },
    handlePasteStyleChange (val) {
      this.$db.set('settings.pasteStyle', val)
    },
    uploadClipboardFiles () {
      this.$electron.ipcRenderer.send('uploadClipboardFilesFromUploadPage')
    },
    getDefaultPicBed () {
      const current = this.$db.get('picBed.current')
      this.picBed.forEach(item => {
        if (item.type === current) {
          this.picBedName = item.name
        }
      })
    },
    getPicBeds (event, picBeds) {
      this.picBed = picBeds
      this.getDefaultPicBed()
    },
    handleChangePicBed () {
      this.buildMenu()
      this.menu.popup(this.$electron.remote.getCurrentWindow())
    },
    buildMenu () {
      const _this = this
      const submenu = this.picBed.map(item => {
        return {
          label: item.name,
          type: 'radio',
          checked: this.$db.get('picBed.current') === item.type,
          click () {
            _this.$db.set('picBed.current', item.type)
            _this.$electron.ipcRenderer.send('syncPicBed')
          }
        }
      })
      this.menu = this.$electron.remote.Menu.buildFromTemplate(submenu)
    }
  }
}
</script>
<style lang='stylus'>
.view-title
  color #eee
  font-size 20px
  text-align center
  margin 10px auto
#upload-view
  .view-title
    margin 20px auto
  #upload-area
    height 220px
    border 2px dashed #dddddd
    border-radius 8px
    text-align center
    width 450px
    margin 0 auto
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
    opacity 0
    transition all .2s ease-in-out
    width 450px
    margin 20px auto 0
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
  .paste-upload
    width 100%
</style>