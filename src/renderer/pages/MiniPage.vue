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
<script lang="ts">
import mixin from '@/utils/mixin'
import { Component, Vue, Watch } from 'vue-property-decorator'
import {
  ipcRenderer,
  IpcRendererEvent,
  remote
} from 'electron'
import { SHOW_PRIVACY_MESSAGE, OPEN_DEVTOOLS } from '~/universal/events/constants'
@Component({
  name: 'mini-page',
  mixins: [mixin]
})
export default class extends Vue {
  logo = require('../assets/squareLogo.png')
  dragover = false
  progress = 0
  showProgress = false
  showError = false
  dragging = false
  wX: number = -1
  wY: number = -1
  screenX: number = -1
  screenY: number = -1
  menu: Electron.Menu | null = null
  os = ''
  picBed: IPicBedType[] = []
  created () {
    this.os = process.platform
    ipcRenderer.on('uploadProgress', (event: IpcRendererEvent, progress: number) => {
      if (progress !== -1) {
        this.showProgress = true
        this.progress = progress
      } else {
        this.progress = 100
        this.showError = true
      }
    })
    this.getPicBeds()
  }
  mounted () {
    window.addEventListener('mousedown', this.handleMouseDown, false)
    window.addEventListener('mousemove', this.handleMouseMove, false)
    window.addEventListener('mouseup', this.handleMouseUp, false)
  }

  @Watch('progress')
  onProgressChange (val: number) {
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
  getPicBeds () {
    this.picBed = ipcRenderer.sendSync('getPicBeds')
    this.buildMenu()
  }
  onDrop (e: DragEvent) {
    this.dragover = false
    this.ipcSendFiles(e.dataTransfer!.files)
  }
  openUploadWindow () {
    // @ts-ignore
    document.getElementById('file-uploader').click()
  }
  onChange (e: any) {
    this.ipcSendFiles(e.target.files)
    // @ts-ignore
    document.getElementById('file-uploader').value = ''
  }
  ipcSendFiles (files: FileList) {
    let sendFiles: IFileWithPath[] = []
    Array.from(files).forEach((item, index) => {
      let obj = {
        name: item.name,
        path: item.path
      }
      sendFiles.push(obj)
    })
    ipcRenderer.send('uploadChoosedFiles', sendFiles)
  }
  handleMouseDown (e: MouseEvent) {
    this.dragging = true
    this.wX = e.pageX
    this.wY = e.pageY
    this.screenX = e.screenX
    this.screenY = e.screenY
  }
  handleMouseMove (e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (this.dragging) {
      const xLoc = e.screenX - this.wX
      const yLoc = e.screenY - this.wY
      remote.BrowserWindow.getFocusedWindow()!.setBounds({
        x: xLoc,
        y: yLoc,
        width: 64,
        height: 64
      })
    }
  }
  handleMouseUp (e: MouseEvent) {
    this.dragging = false
    if (this.screenX === e.screenX && this.screenY === e.screenY) {
      if (e.button === 0) { // left mouse
        this.openUploadWindow()
      } else {
        this.getPicBeds()
        this.openContextMenu()
      }
    }
  }
  openContextMenu () {
    this.menu!.popup()
  }
  async buildMenu () {
    const _this = this
    const current = await this.getConfig('picBed.current')
    const submenu = this.picBed.filter(item => item.visible).map(item => {
      return {
        label: item.name,
        type: 'radio',
        checked: current === item.type,
        click () {
          _this.saveConfig({
            'picBed.current': item.type,
            'picBed.uploader': item.type
          })
          ipcRenderer.send('syncPicBed')
        }
      }
    })
    const template = [
      {
        label: '打开详细窗口',
        click () {
          ipcRenderer.send('openSettingWindow')
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
          ipcRenderer.send('uploadClipboardFilesFromUploadPage')
        }
      },
      {
        label: '隐藏窗口',
        click () {
          remote.BrowserWindow.getFocusedWindow()!.hide()
        }
      },
      {
        label: '隐私协议',
        click () {
          ipcRenderer.send(SHOW_PRIVACY_MESSAGE)
        }
      },
      {
        label: '重启应用',
        click () {
          remote.app.relaunch()
          remote.app.exit(0)
        }
      },
      {
        label: '打开调试器',
        click () {
          ipcRenderer.send(OPEN_DEVTOOLS)
        }
      },
      {
        role: 'quit',
        label: '退出'
      }
    ]
    // @ts-ignore
    this.menu = remote.Menu.buildFromTemplate(template)
  }
  beforeDestroy () {
    ipcRenderer.removeAllListeners('uploadProgress')
    ipcRenderer.removeListener('getPicBeds', this.getPicBeds)
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
