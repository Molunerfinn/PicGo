<template>
  <div id="tray-page">
    <!-- <div class="header-arrow"></div> -->
    <div class="content">
      <div class="wait-upload-img" v-if="clipboardFiles.length > 0">
        <div class="list-title">等待上传</div>
        <div v-for="(item, index) in clipboardFiles" :key="index" class="img-list">
          <div
            class="upload-img__container"
            :class="{ upload: uploadFlag }"
            @click="uploadClipboardFiles">
            <img :src="item.imgUrl" class="upload-img">
          </div>
        </div>
      </div>
      <div class="uploaded-img">
        <div class="list-title">已上传</div>
        <div v-for="item in files" :key="item.imgUrl" class="img-list">
          <div class="upload-img__container" @click="copyTheLink(item)">
            <img :src="item.imgUrl" class="upload-img">
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import mixin from '@/utils/mixin'
import pasteTemplate from '#/utils/pasteTemplate'
import { ipcRenderer, clipboard } from 'electron'
@Component({
  name: 'tray-page',
  mixins: [mixin]
})
export default class extends Vue {
  files = []
  notification = {
    title: '复制链接成功',
    body: '',
    icon: ''
  }
  clipboardFiles: ImgInfo[] = []
  uploadFlag = false
  get reverseList () {
    return this.files.slice().reverse()
  }
  getData () {
    // @ts-ignore
    this.files = this.$db.read().get('uploaded').slice().reverse().slice(0, 5).value()
  }
  copyTheLink (item: ImgInfo) {
    this.notification.body = item.imgUrl!
    this.notification.icon = item.imgUrl!
    const myNotification = new Notification(this.notification.title, this.notification)
    const pasteStyle = this.$db.get('settings.pasteStyle') || 'markdown'
    clipboard.writeText(pasteTemplate(pasteStyle, item))
    myNotification.onclick = () => {
      return true
    }
  }
  calcHeight (width: number, height: number): number {
    return height * 160 / width
  }
  disableDragFile () {
    window.addEventListener('dragover', (e) => {
      e = e || event
      e.preventDefault()
    }, false)
    window.addEventListener('drop', (e) => {
      e = e || event
      e.preventDefault()
    }, false)
  }
  uploadClipboardFiles () {
    if (this.uploadFlag) {
      return
    }
    this.uploadFlag = true
    ipcRenderer.send('uploadClipboardFiles')
  }
  mounted () {
    this.disableDragFile()
    this.getData()
    ipcRenderer.on('dragFiles', (event: Event, files: string[]) => {
      files.forEach(item => {
        this.$db.insert('uploaded', item)
      })
      // @ts-ignore
      this.files = this.$db.read().get('uploaded').slice().reverse().slice(0, 5).value()
    })
    ipcRenderer.on('clipboardFiles', (event: Event, files: ImgInfo[]) => {
      this.clipboardFiles = files
    })
    ipcRenderer.on('uploadFiles', (event: Event) => {
      // @ts-ignore
      this.files = this.$db.read().get('uploaded').slice().reverse().slice(0, 5).value()
      console.log(this.files)
      this.uploadFlag = false
    })
    ipcRenderer.on('updateFiles', (event: Event) => {
      this.getData()
    })
  }
  beforeDestroy () {
    ipcRenderer.removeAllListeners('dragFiles')
    ipcRenderer.removeAllListeners('clipboardFiles')
    ipcRenderer.removeAllListeners('uploadClipboardFiles')
    ipcRenderer.removeAllListeners('updateFiles')
  }
}
</script>

<style lang="stylus">
body::-webkit-scrollbar
  width 0px
#tray-page
  background-color transparent
  .list-title
    text-align center
    color #858585
    font-size 12px
    padding 6px 0
    position relative
    &:before
      content ''
      position absolute
      height 1px
      width calc(100% - 36px)
      bottom 0
      left 18px
      background #858585
  .header-arrow
    position absolute
    top 12px
    left 50%
    margin-left -10px
    width: 0;
    height: 0;
    border-left: 10px solid transparent
    border-right: 10px solid transparent
    border-bottom: 10px solid rgba(255,255,255, 1)
  .content
    position absolute
    top 0px
    width 100%
  .img-list
    padding 8px 8px
    display flex
    justify-content space-between
    align-items center
    // height 45px
    cursor pointer
    transition all .2s ease-in-out
    &:hover
      background #49B1F5
      .upload-img__index
        color #fff
  .upload-img
    width 100%
    object-fit scale-down
    margin 0 auto
    &__container
      width 100%
      padding 8px 10px
      height 100%
      &.upload
        cursor not-allowed
</style>
