<template>
  <div id="tray-page">
    <div
      class="open-main-window"
      @click="openSettingWindow"
    >
      {{ $T('OPEN_MAIN_WINDOW') }}
    </div>
    <div class="content">
      <div
        v-if="clipboardFiles.length > 0"
        class="wait-upload-img"
      >
        <div class="list-title">
          {{ $T('WAIT_TO_UPLOAD') }}
        </div>
        <div
          v-for="(item, index) in clipboardFiles"
          :key="index"
          class="img-list"
        >
          <div
            class="upload-img__container"
            :class="{ upload: uploadFlag }"
            @click="uploadClipboardFiles"
          >
            <img
              :src="item.imgUrl"
              class="upload-img"
            >
          </div>
        </div>
      </div>
      <div class="uploaded-img">
        <div class="list-title">
          {{ $T('ALREADY_UPLOAD') }}
        </div>
        <div
          v-for="item in files"
          :key="item.imgUrl"
          class="img-list"
        >
          <div
            class="upload-img__container"
            @click="copyTheLink(item)"
          >
            <img
              v-lazy="item.imgUrl"
              class="upload-img"
            >
            <div
              class="upload-img__title"
              :title="item.fileName"
            >
              {{ item.fileName }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, onBeforeUnmount, onBeforeMount } from 'vue'
import { ipcRenderer } from 'electron'
import $$db from '@/utils/db'
import { T as $T } from '@/i18n/index'
import { IResult } from '@picgo/store/dist/types'
import { PASTE_TEXT, OPEN_WINDOW } from '#/events/constants'
import { IWindowList } from '#/types/enum'
import { sendToMain } from '@/utils/dataSender'
import { getRawData } from '@/utils/common'

const files = ref<IResult<ImgInfo>[]>([])
const notification = reactive({
  title: $T('COPY_LINK_SUCCEED'),
  body: ''
})

const clipboardFiles = ref<ImgInfo[]>([])
const uploadFlag = ref(false)

// const reverseList = computed(() => files.value.slice().reverse())

function openSettingWindow () {
  sendToMain(OPEN_WINDOW, IWindowList.SETTING_WINDOW)
}

async function getData () {
  files.value = (await $$db.get<ImgInfo>({ orderBy: 'desc', limit: 5 })).data
}

async function copyTheLink (item: ImgInfo) {
  notification.body = item.imgUrl!
  await ipcRenderer.invoke(PASTE_TEXT, getRawData(item))
  const myNotification = new Notification(notification.title, notification)
  myNotification.onclick = () => {
    return true
  }
}

// function calcHeight (width: number, height: number): number {
//   return height * 160 / width
// }

function disableDragFile () {
  window.addEventListener('dragover', (e) => {
    e = e || event
    e.preventDefault()
  }, false)
  window.addEventListener('drop', (e) => {
    e = e || event
    e.preventDefault()
  }, false)
}

function uploadClipboardFiles () {
  if (uploadFlag.value) {
    return
  }
  uploadFlag.value = true
  sendToMain('uploadClipboardFiles')
}

onBeforeMount(() => {
  disableDragFile()
  getData()
  ipcRenderer.on('dragFiles', async (event: Event, _files: string[]) => {
    for (let i = 0; i < _files.length; i++) {
      const item = _files[i]
      await $$db.insert(item)
    }
    files.value = (await $$db.get<ImgInfo>({ orderBy: 'desc', limit: 5 })).data
  })
  ipcRenderer.on('clipboardFiles', (event: Event, files: ImgInfo[]) => {
    clipboardFiles.value = files
  })
  ipcRenderer.on('uploadFiles', async () => {
    files.value = (await $$db.get<ImgInfo>({ orderBy: 'desc', limit: 5 })).data
    uploadFlag.value = false
  })
  ipcRenderer.on('updateFiles', () => {
    getData()
  })
})

onBeforeUnmount(() => {
  ipcRenderer.removeAllListeners('dragFiles')
  ipcRenderer.removeAllListeners('clipboardFiles')
  ipcRenderer.removeAllListeners('uploadClipboardFiles')
  ipcRenderer.removeAllListeners('updateFiles')
})
</script>

<script lang="ts">
export default {
  name: 'TrayPage'
}
</script>

<style lang="stylus">
body::-webkit-scrollbar
  width 0px
#tray-page
  background-color transparent
  .open-main-window
    background #000
    height 20px
    line-height 20px
    text-align center
    color #858585
    font-size 12px
    cursor pointer
    transition all .2s ease-in-out
    &:hover
      color: #fff;
      background #49B1F5
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
  // .header-arrow
  //   position absolute
  //   top 12px
  //   left 50%
  //   margin-left -10px
  //   width: 0;
  //   height: 0;
  //   border-left: 10px solid transparent
  //   border-right: 10px solid transparent
  //   border-bottom: 10px solid rgba(255,255,255, 1)
  .content
    position absolute
    top 20px
    width 100%
  .img-list
    padding 4px 8px
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
    .upload-img__container
      display flex
      flex-direction column
      justify-content center
      align-items center
  .upload-img
    max-width 100%
    object-fit scale-down
    margin 0 auto
    &__container
      display flex
      flex-direction column
      justify-content center
      align-items center
      width 100%
      padding 8px 8px 4px
      height 100%
      &.upload
        cursor not-allowed
    &__title
      text-align center
      overflow hidden
      text-overflow ellipsis
      white-space nowrap
      color #ddd
      font-size 14px
      margin-top 4px
</style>
