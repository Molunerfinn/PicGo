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
  IpcRendererEvent
} from 'electron'
import { SHOW_MINI_PAGE_MENU, SET_MINI_WINDOW_POS } from '~/universal/events/constants'
import {
  isUrl
} from '~/universal/utils/common'
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
  }

  onDrop (e: DragEvent) {
    this.dragover = false
    const items = e.dataTransfer!.items
    if (items.length === 2 && items[0].type === 'text/uri-list') {
      this.handleURLDrag(items, e.dataTransfer!)
    } else if (items[0].type === 'text/plain') {
      const str = e.dataTransfer!.getData(items[0].type)
      if (isUrl(str)) {
        ipcRenderer.send('uploadChoosedFiles', [{ path: str }])
      } else {
        this.$message.error(this.$T('TIPS_DRAG_VALID_PICTURE_OR_URL'))
      }
    } else {
      this.ipcSendFiles(e.dataTransfer!.files)
    }
  }

  handleURLDrag (items: DataTransferItemList, dataTransfer: DataTransfer) {
    // text/html
    // Use this data to get a more precise URL
    const urlString = dataTransfer.getData(items[1].type)
    const urlMatch = urlString.match(/<img.*src="(.*?)"/)
    if (urlMatch) {
      ipcRenderer.send('uploadChoosedFiles', [
        {
          path: urlMatch[1]
        }
      ])
    } else {
      this.$message.error(this.$T('TIPS_DRAG_VALID_PICTURE_OR_URL'))
    }
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
    const sendFiles: IFileWithPath[] = []
    Array.from(files).forEach((item) => {
      const obj = {
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
      ipcRenderer.send(SET_MINI_WINDOW_POS, {
        x: xLoc,
        y: yLoc,
        width: 64,
        height: 64
      })
      // remote.BrowserWindow.getFocusedWindow()!.setBounds({
      //   x: xLoc,
      //   y: yLoc,
      //   width: 64,
      //   height: 64
      // })
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
    ipcRenderer.send(SHOW_MINI_PAGE_MENU)
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
