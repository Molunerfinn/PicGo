<template>
  <div id="tray-page">
    <div class="content">
      <div class="wait-upload-img" v-if="clipboardFiles.length > 0">
        <div class="list-title">等待上传</div>
        <div v-for="(item, index) in clipboardFiles" :key="index" class="img-list" :style="{height: calcHeight(item.width, item.height) + 'px'}">
          <div class="upload-img__container" @click="uploadClipboardFiles">
            <img :src="item.imgUrl" class="upload-img">
          </div>
        </div>
      </div>
      <div class="uploaded-img">
        <div class="list-title">已上传</div>
        <div v-for="(item, index) in files" :key="index" class="img-list" :style="{height: calcHeight(item.width, item.height) + 'px'}">
          <div class="upload-img__container" @click="copyTheLink(item)">
            <img :src="item.imgUrl" class="upload-img">
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'tray-page',
    data () {
      return {
        files: [],
        notification: {
          title: '复制链接成功',
          body: '',
          icon: ''
        },
        clipboardFiles: []
      }
    },
    computed: {
      reverseList () {
        return this.files.slice().reverse()
      }
    },
    mounted () {
      this.disableDragFile()
      this.getData()
      this.$electron.ipcRenderer.on('dragFiles', (event, files) => {
        this.$db.get('uploaded').push(...files).write()
        this.files = this.$db.get('uploaded').slice().reverse().slice(0, 5).value()
      })
      this.$electron.ipcRenderer.on('clipboardFiles', (event, files) => {
        this.clipboardFiles = files
      })
      this.$electron.ipcRenderer.on('uploadClipboardFiles', (event, files) => {
        this.$db.get('uploaded').push(...files).write()
        this.files = this.$db.get('uploaded').slice().reverse().slice(0, 5).value()
      })
    },
    methods: {
      getData () {
        this.files = this.$db.get('uploaded').slice().reverse().slice(0, 5).value()
      },
      copyTheLink (item) {
        this.notification.body = item.imgUrl
        this.notification.icon = item.imgUrl
        const myNotification = new window.Notification(this.notification.title, this.notification)
        myNotification.onclick = () => {
          this.$electron.clipboard.writeText(item.imgUrl)
        }
      },
      calcHeight (width, height) {
        return height * 160 / width
      },
      disableDragFile () {
        window.addEventListener('dragover', (e) => {
          e = e || event
          e.preventDefault()
        }, false)
        window.addEventListener('drop', (e) => {
          e = e || event
          e.preventDefault()
        }, false)
      },
      uploadClipboardFiles () {
        this.$electron.ipcRenderer.send('uploadClipboardFiles', this.clipboardFiles[0])
      }
    }
  }
</script>

<style lang="stylus">
#tray-page
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
    // padding-top 10px
    // background-color rgba(255,255,255, 1)
  .img-list
    padding 16px 8px
    display flex
    justify-content space-between
    align-items center
    height 45px
    cursor pointer
    transition all .2s ease-in-out
    &:hover
      background #49B1F5
      .upload-img__index
        color #fff
  .upload-img
    height 100%
    width 100%
    margin 0 auto
    &__container
      width 100%
      padding 8px 10px
      height 100%
</style>
