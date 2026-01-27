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
import { getFilePath } from '@/utils/common'
import { saveConfig, sendToMain } from '@/utils/dataSender'
import { CaretBottom, UploadFilled } from '@element-plus/icons-vue'
import {
  IpcRendererEvent,
  ipcRenderer
} from 'electron'
import { ElMessage as $message, ElMessageBox } from 'element-plus'
import { computed, onBeforeMount, onBeforeUnmount, ref, watch } from 'vue'
import {
  LOG_INVALID_URL_LINES,
  SHOW_INPUT_BOX,
  SHOW_INPUT_BOX_RESPONSE,
  SHOW_UPLOAD_PAGE_MENU
} from '~/universal/events/constants'
import {
  extractHttpUrlsFromText,
  isUrl,
  parseNewlineSeparatedUrls
} from '~/universal/utils/common'
import { useStore } from '@/hooks/useStore'
const dragover = ref(false)
const progress = ref(0)
const showProgress = ref(false)
const showError = ref(false)
const pasteStyle = ref('')
const store = useStore()
const currentPicBedType = computed(() => {
  const config = store?.state.appConfig
  return config?.picBed?.uploader || config?.picBed?.current || store?.state.defaultPicBed || 'smms'
})
const picBedName = computed(() => {
  const currentType = currentPicBedType.value
  const list = store?.state.picBeds ?? []
  const match = list.find(item => item.type === currentType)
  return match?.name || currentType
})
const configName = computed(() => {
  const configEntry = store?.state.appConfig?.picBed?.[currentPicBedType.value] as IStringKeyMap | undefined
  if (configEntry && typeof configEntry._configName === 'string') {
    return configEntry._configName
  }
  return 'Default'
})
const $confirm = ElMessageBox.confirm
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
  store?.refreshAppConfig()
  store?.refreshPicBeds()
  ipcRenderer.on('syncPicBed', () => {
    store?.refreshAppConfig()
  })
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
})

async function onDrop (e: DragEvent) {
  dragover.value = false
  const files = e.dataTransfer?.files!

  // send files first
  if (files?.length) {
    ipcSendFiles(e.dataTransfer?.files!)
    return
  }

  const dataTransfer = e.dataTransfer
  if (!dataTransfer) return

  const uriList = dataTransfer.getData('text/uri-list')
  if (uriList) {
    await handleUriListDrop(uriList, dataTransfer.getData('text/html'))
    return
  }

  const plainText = dataTransfer.getData('text/plain')
  if (plainText) {
    await handlePlainTextDrop(plainText)
    return
  }

  $message.error($T('TIPS_DRAG_VALID_PICTURE_OR_URL'))
}

async function confirmLargeUrlBatch (count: number, onCancel?: () => void): Promise<boolean> {
  if (count <= 10) return true
  try {
    await $confirm(
      $T('TIPS_TOO_MANY_URLS_CONFIRM', { n: count }),
      $T('TIPS_WARNING'),
      {
        type: 'warning',
        confirmButtonText: $T('CONFIRM'),
        cancelButtonText: $T('CANCEL')
      }
    )
    return true
  } catch (e) {
    onCancel?.()
    return false
  }
}

async function uploadUrls (urls: string[], invalidLines: string[], onCancel?: () => void) {
  if (invalidLines.length) {
    sendToMain(LOG_INVALID_URL_LINES, invalidLines)
    $message.warning($T('TIPS_SKIPPED_INVALID_URLS', { n: invalidLines.length }))
  }

  const canUpload = await confirmLargeUrlBatch(urls.length, onCancel)
  if (!canUpload) return

  sendToMain('uploadChoosedFiles', urls.map((url) => ({ path: url })))
}

async function handlePlainTextDrop (plainText: string) {
  const { urls, invalidLines } = parseNewlineSeparatedUrls(plainText, { source: 'plain' })
  if (!urls.length) {
    $message.error($T('TIPS_DRAG_VALID_PICTURE_OR_URL'))
    return
  }
  await uploadUrls(urls, invalidLines)
}

async function handleUriListDrop (uriListText: string, urlString: string) {
  const { urls, invalidLines } = parseNewlineSeparatedUrls(uriListText, { source: 'uri-list' })
  if (urls.length) {
    await uploadUrls(urls, invalidLines)
    return
  }

  const urlMatch = urlString.match(/<img.*src="(.*?)"/)
  if (urlMatch && isUrl(urlMatch[1])) {
    await uploadUrls([urlMatch[1]], invalidLines)
    return
  }

  $message.error($T('TIPS_DRAG_VALID_PICTURE_OR_URL'))
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
    const filePath = getFilePath(item)
    if (!filePath) return
    sendFiles.push({
      name: item.name,
      path: filePath
    })
  })
  if (!sendFiles.length) return
  sendToMain('uploadChoosedFiles', sendFiles)
}

const applyAppConfig = () => {
  const settings = store?.state.appConfig?.settings ?? {}
  pasteStyle.value = settings.pasteStyle || 'markdown'
}

watch(() => store?.state.appConfig, () => {
  applyAppConfig()
}, { immediate: true })

function handlePasteStyleChange (val: string | number | boolean | undefined) {
  saveConfig({
    'settings.pasteStyle': val
  })
}

function uploadClipboardFiles () {
  sendToMain('uploadClipboardFilesFromUploadPage')
}

function openUrlInputBox (value: string) {
  $bus.emit(SHOW_INPUT_BOX, {
    value,
    title: $T('TIPS_INPUT_URL'),
    placeholder: $T('TIPS_HTTP_PREFIX'),
    inputType: 'textarea'
  })
}

async function uploadURLFiles () {
  let str = ''
  try {
    str = await navigator.clipboard.readText()
  } catch (e) {}
  const urls = extractHttpUrlsFromText(str)
  openUrlInputBox(urls.join('\n'))
}

async function handleInputBoxValue (val: string) {
  if (val === '') return

  const { urls, invalidLines } = parseNewlineSeparatedUrls(val, { source: 'plain' })
  if (!urls.length) {
    if (invalidLines.length) {
      sendToMain(LOG_INVALID_URL_LINES, invalidLines)
      $message.error($T('TIPS_SKIPPED_INVALID_URLS', { n: invalidLines.length }))
      return
    }
    $message.error($T('TIPS_NO_VALID_URLS'))
    return
  }

  await uploadUrls(urls, invalidLines, () => openUrlInputBox(val))
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
