<template>
  <div id="mini-page"
    :style="{ backgroundImage: 'url(' + logo + ')' }"
    :class="{ linux: os === 'linux' }"
  >
    <!-- <i class="el-icon-upload2"></i> -->
  <div
    id="upload-area"
    :class="{ 'is-dragover': dragover, uploading: showProgress, linux: os === 'linux' }" @drop.prevent="onDrop" @dragover.prevent="dragover = true" @dragleave.prevent="dragover = false"
    :style="{ backgroundPosition: '0 ' + progress + '%'}"
  >
    <div id="upload-dragger" @dblclick="openUploadWindow">
      <input type="file" id="file-uploader" @change="onChange" multiple>
    </div>
  </div>
  </div>
</template>
<script>
import mixin from '@/utils/mixin'
export default {
  name: 'mini-page',
  mixins: [mixin],
  data () {
    return {
      logo: 'static/squareLogo.png',
      dragover: false,
      progress: 0,
      showProgress: false,
      showError: false,
      dragging: false,
      wX: '',
      wY: '',
      screenX: '',
      screenY: '',
      menu: null,
      os: '',
      picBed: []
    }
  },
  created () {
    this.os = process.platform
    this.$electron.ipcRenderer.on('uploadProgress', (event, progress) => {
      if (progress !== -1) {
        this.showProgress = true
        this.progress = progress
      } else {
        this.progress = 100
        this.showError = true
      }
    })
    this.getPicBeds()
  },
  mounted () {
    window.addEventListener('mousedown', this.handleMouseDown, false)
    window.addEventListener('mousemove', this.handleMouseMove, false)
    window.addEventListener('mouseup', this.handleMouseUp, false)
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
    getPicBeds () {
      this.picBed = this.$electron.ipcRenderer.sendSync('getPicBeds')
      this.buildMenu()
    },
    onDrop (e) {
      this.dragover = false
      this.ipcSendFiles(e.dataTransfer.files)
    },
    openUploadWindow () {
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
    handleMouseDown (e) {
      this.dragging = true
      this.wX = e.pageX
      this.wY = e.pageY
      this.screenX = e.screenX
      this.screenY = e.screenY
    },
    handleMouseMove (e) {
      e.preventDefault()
      e.stopPropagation()
      if (this.dragging) {
        const xLoc = e.screenX - this.wX
        const yLoc = e.screenY - this.wY
        this.$electron.remote.BrowserWindow.getFocusedWindow().setBounds({
          x: xLoc,
          y: yLoc,
          width: 64,
          height: 64
        })
      }
    },
    handleMouseUp (e) {
      this.dragging = false
      if (this.screenX === e.screenX && this.screenY === e.screenY) {
        if (e.button === 0) { // left mouse
          this.openUploadWindow()
        } else {
          this.getPicBeds()
          this.openContextMenu()
        }
      }
    },
    openContextMenu () {
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
      const template = [
        {
          label: '打开详细窗口',
          click () {
            _this.$electron.ipcRenderer.send('openSettingWindow')
          }
        },
        {
          label: '选择默认图床',
          type: 'submenu',
          submenu
        },
        {
          label: '剪贴板图片上传',
          click () {
            _this.$electron.ipcRenderer.send('uploadClipboardFilesFromUploadPage')
          }
        },
        {
          label: '最小化窗口',
          role: 'minimize'
        },
        {
          label: '重启应用',
          click () {
            _this.$electron.remote.app.relaunch()
            _this.$electron.remote.app.exit(0)
          }
        },
        {
          role: 'quit',
          label: '退出'
        }
      ]
      this.menu = this.$electron.remote.Menu.buildFromTemplate(template)
    }
  },
  beforeDestroy () {
    this.$electron.ipcRenderer.removeAllListeners('uploadProgress')
    this.$electron.ipcRenderer.removeListener('getPicBeds', this.getPicBeds)
    window.removeEventListener('mousedown', this.handleMouseDown, false)
    window.removeEventListener('mousemove', this.handleMouseMove, false)
    window.removeEventListener('mouseup', this.handleMouseUp, false)
  }
}
</script>
<style lang='stylus'>
  #mini-page
    background #409EFF
    color #FFF
    height 100vh
    width 100vw
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
    cursor pointer
    &.linux
      border-radius 0
      background-size 100vh 100vw
    #upload-area
      height 100%
      width 100%
      border-radius 50%
      transition all .2s ease-in-out
      &.linux
        border-radius 0
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