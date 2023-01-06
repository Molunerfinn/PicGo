<template>
  <div id="rename-page">
    <el-form
      @submit.prevent
    >
      <el-form-item
        :label="$T('FILE_RENAME')"
      >
        <el-input
          v-model="fileName"
          size="small"
          @keyup.enter="confirmName"
        />
      </el-form-item>
    </el-form>
    <el-row>
      <div class="pull-right">
        <el-button
          round
          size="small"
          @click="cancel"
        >
          {{ $T('CANCEL') }}
        </el-button>
        <el-button
          type="primary"
          round
          size="small"
          @click="confirmName"
        >
          {{ $T('CONFIRM') }}
        </el-button>
      </div>
    </el-row>
  </div>
</template>
<script lang="ts" setup>
import { RENAME_FILE_NAME } from '#/events/constants'
import { sendToMain } from '@/utils/dataSender'
import {
  ipcRenderer,
  IpcRendererEvent
} from 'electron'
import { onBeforeUnmount, onBeforeMount, ref } from 'vue'
const fileName = ref('')
const originName = ref('')
const id = ref<string | null>(null)
onBeforeMount(() => {
  ipcRenderer.on(RENAME_FILE_NAME, (event: IpcRendererEvent, newName: string, _originName: string, _id: string) => {
    fileName.value = newName
    originName.value = _originName
    id.value = _id
  })
})

function confirmName () {
  sendToMain(`${RENAME_FILE_NAME}${id.value}`, fileName.value)
}

function cancel () {
  // if cancel, use origin file name
  sendToMain(`${RENAME_FILE_NAME}${id.value}`, originName.value)
}

onBeforeUnmount(() => {
  ipcRenderer.removeAllListeners('rename')
})

</script>
<script lang="ts">
export default {
  name: 'RenamePage'
}
</script>
<style lang='stylus'>
  #rename-page
    padding 0 20px
    .pull-right
      float right
    .el-form-item__label
      color #ddd
</style>
