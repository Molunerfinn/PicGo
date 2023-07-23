<template>
  <div id="upload-view">
    <el-row :gutter="16">
      <el-col
        :span="20"
        :offset="2"
      >
        <div class="view-title text-[22px]">
          {{ $T('PICTURE_UPLOAD') }} - {{ picBedName }} - {{ configName }}
          <el-icon
            style="cursor: pointer; margin-left: 4px;"
            @click="handleChangePicBed"
          >
            <CaretBottom />
          </el-icon>
        </div>
        <div
          id="upload-area"
          :class="{ 'is-dragover': dragover }"
          @drop.prevent="onDrop"
          @dragover.prevent="dragover = true"
          @dragleave.prevent="dragover = false"
        >
          <div
            id="upload-dragger"
            @click="openUploadWindow"
          >
            <el-icon>
              <UploadFilled />
            </el-icon>
            <div class="upload-dragger__text">
              {{ $T('DRAG_FILE_TO_HERE') }} <span>{{ $T('CLICK_TO_UPLOAD') }}</span>
            </div>
            <input
              id="file-uploader"
              type="file"
              multiple
              @change="onChange"
            >
          </div>
        </div>
        <el-progress
          :percentage="progress"
          :show-text="false"
          class="upload-progress"
          :class="{ 'show': showProgress }"
          :status="showError ? 'exception' : undefined"
        />
        <div class="paste-style">
          <div class="el-col-16">
            <div class="paste-style__text">
              {{ $T('LINK_FORMAT') }}
            </div>
            <el-radio-group
              v-model="pasteStyle"
              size="small"
              @change="handlePasteStyleChange"
            >
              <el-radio-button label="markdown">
                Markdown
              </el-radio-button>
              <el-radio-button label="HTML" />
              <el-radio-button label="URL" />
              <el-radio-button label="UBB" />
              <el-radio-button
                label="Custom"
                :title="$T('CUSTOM')"
              />
            </el-radio-group>
          </div>
          <div class="el-col-8">
            <div class="paste-style__text">
              {{ $T('QUICK_UPLOAD') }}
            </div>
            <el-button
              type="primary"
              round
              size="small"
              class="quick-upload"
              style="width: 50%"
              @click="uploadClipboardFiles"
            >
              {{ $T('CLIPBOARD_PICTURE') }}
            </el-button>
            <el-button
              type="primary"
              round
              size="small"
              class="quick-upload"
              style="width: 46%; margin-left: 6px"
              @click="uploadURLFiles"
            >
              URL
            </el-button>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>
<script lang="ts" setup>
// import { Component, Vue, Watch } from 'vue-property-decorator'
import { T as $T } from '@/i18n'
import $bus from '@/utils/bus'
import { getConfig, saveConfig, sendToMain } from '@/utils/dataSender'
import { CaretBottom, UploadFilled } from '@element-plus/icons-vue'
import {
  IpcRendererEvent,
  ipcRenderer
} from 'electron'
import { ElMessage as $message } from 'element-plus'
import { onBeforeMount, onBeforeUnmount, ref, watch } from 'vue'
import {
  GET_PICBEDS,
  SHOW_INPUT_BOX,
  SHOW_INPUT_BOX_RESPONSE,
  SHOW_UPLOAD_PAGE_MENU
} from '~/universal/events/constants'
import {
  isUrl
} from '~/universal/utils/common'
const dragover = ref(false)
const progress = ref(0)
const showProgress = ref(false)
const showError = ref(false)
const pasteStyle = ref('')
const picBed = ref<IPicBedType[]>([])
const picBedName = ref('')
const configName = ref('')
onBeforeMount(() => {
  ipcRenderer.on('uploadProgress', (event: IpcRendererEvent, _progress: number) => {
    if (_progress !== -1) {
      showProgress.value = true
      progress.value = _progress
    } else {
      progress.value = 100
      showError.value = true
    }
  })
  getPasteStyle()
  getDefaultPicBed()
  ipcRenderer.on('syncPicBed', () => {
    getDefaultPicBed()
  })
  sendToMain(GET_PICBEDS)
  ipcRenderer.on(GET_PICBEDS, getPicBeds)
  $bus.on(SHOW_INPUT_BOX_RESPONSE, handleInputBoxValue)
})

watch(progress, onProgressChange)

function onProgressChange (val: number) {
  if (val === 100) {
    setTimeout(() => {
      showProgress.value = false
      showError.value = false
    }, 1000)
    setTimeout(() => {
      progress.value = 0
    }, 1200)
  }
}

onBeforeUnmount(() => {
  $bus.off(SHOW_INPUT_BOX_RESPONSE)
  ipcRenderer.removeAllListeners('uploadProgress')
  ipcRenderer.removeAllListeners('syncPicBed')
  ipcRenderer.removeListener(GET_PICBEDS, getPicBeds)
})

function onDrop (e: DragEvent) {
  dragover.value = false
  const items = e.dataTransfer?.items!
  const files = e.dataTransfer?.files!

  // send files first
  if (files?.length) {
    ipcSendFiles(e.dataTransfer?.files!)
  } else {
    if (items.length === 2 && items[0].type === 'text/uri-list') {
      handleURLDrag(items, e.dataTransfer!)
    } else if (items[0].type === 'text/plain') {
      const str = e.dataTransfer!.getData(items[0].type)
      if (isUrl(str)) {
        sendToMain('uploadChoosedFiles', [{ path: str }])
      } else {
        $message.error($T('TIPS_DRAG_VALID_PICTURE_OR_URL'))
      }
    }
  }
}

function handleURLDrag (items: DataTransferItemList, dataTransfer: DataTransfer) {
  // text/html
  // Use this data to get a more precise URL
  const urlString = dataTransfer.getData(items[1].type)
  const urlMatch = urlString.match(/<img.*src="(.*?)"/)
  if (urlMatch) {
    sendToMain('uploadChoosedFiles', [
      {
        path: urlMatch[1]
      }
    ])
  } else {
    $message.error($T('TIPS_DRAG_VALID_PICTURE_OR_URL'))
  }
}

function openUploadWindow () {
  document.getElementById('file-uploader')!.click()
}

function onChange (e: any) {
  ipcSendFiles(e.target.files);
  (document.getElementById('file-uploader') as HTMLInputElement).value = ''
}

function ipcSendFiles (files: FileList) {
  const sendFiles: IFileWithPath[] = []
  Array.from(files).forEach((item) => {
    const obj = {
      name: item.name,
      path: item.path
    }
    sendFiles.push(obj)
  })
  sendToMain('uploadChoosedFiles', sendFiles)
}

async function getPasteStyle () {
  pasteStyle.value = await getConfig('settings.pasteStyle') || 'markdown'
}

function handlePasteStyleChange (val: string | number | boolean) {
  saveConfig({
    'settings.pasteStyle': val
  })
}

function uploadClipboardFiles () {
  sendToMain('uploadClipboardFilesFromUploadPage')
}

async function uploadURLFiles () {
  const str = await navigator.clipboard.readText()
  $bus.emit(SHOW_INPUT_BOX, {
    value: isUrl(str) ? str : '',
    title: $T('TIPS_INPUT_URL'),
    placeholder: $T('TIPS_HTTP_PREFIX')
  })
}

function handleInputBoxValue (val: string) {
  if (val === '') return
  if (isUrl(val)) {
    sendToMain('uploadChoosedFiles', [{
      path: val
    }])
  } else {
    $message.error($T('TIPS_INPUT_VALID_URL'))
  }
}

async function getDefaultPicBed () {
  const currentPicBed = await getConfig<string>('picBed.current')
  const currentConfigName = await getConfig<string>(`picBed.${currentPicBed}._configName`) || 'Default'
  picBed.value.forEach(item => {
    if (item.type === currentPicBed) {
      picBedName.value = item.name
    }
  })
  configName.value = currentConfigName
}

function getPicBeds (event: Event, picBeds: IPicBedType[]) {
  picBed.value = picBeds
  getDefaultPicBed()
}

async function handleChangePicBed () {
  sendToMain(SHOW_UPLOAD_PAGE_MENU)
}
</script>
<script lang="ts">
export default {
  name: 'UploadPage'
}
</script>
<style lang='stylus'>
.view-title
  display flex
  color #eee
  font-size 20px
  text-align center
  margin 10px auto
  align-items center
  justify-content center
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
    display flex
    align-items flex-end
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
  .el-icon-caret-bottom
    cursor pointer
</style>
