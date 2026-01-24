<template>
  <div
    id="config-list-view"
    class="h-[425px]"
  >
    <div class="view-title">
      {{ $T('SETTINGS') }}
    </div>
    <el-row
      :gutter="15"
      justify="space-between"
      align="middle"
      type="flex"
      class="config-list"
    >
      <el-col
        v-for="item in curConfigList"
        :key="item._id"
        class="config-item-col"
        :span="11"
        :offset="1"
      >
        <div
          :class="`config-item ${defaultConfigId === item._id ? 'selected' : ''}`"
          @click="() => selectItem(item._configName)"
        >
          <div class="config-name">
            {{ item._configName }}
          </div>
          <div class="config-update-time">
            {{ formatTime(item._updatedAt) }}
          </div>
          <div
            v-if="defaultConfigId === item._id"
            class="default-text"
          >
            {{ $T('SELECTED_SETTING_HINT') }}
          </div>
          <div class="operation-container">
            <el-icon
              class="el-icon-edit"
              @click.stop="openEditPage(item._id)"
            >
              <Edit />
            </el-icon>
            <el-icon
              class="el-icon-copy"
              @click.stop="() => copyConfig(item._configName)"
            >
              <DocumentCopy />
            </el-icon>
            <el-icon
              class="el-icon-delete"
              :class="curConfigList.length <= 1 ? 'disabled' : ''"
              @click.stop="() => deleteConfig(item._configName)"
            >
              <Delete />
            </el-icon>
          </div>
        </div>
      </el-col>
      <el-col
        class="config-item-col"
        :span="11"
        :offset="1"
      >
        <div
          class="config-item config-item-add"
          @click="addNewConfig"
        >
          <el-icon
            class="el-icon-plus"
          >
            <Plus />
          </el-icon>
        </div>
      </el-col>
    </el-row>
    <el-row
      type="flex"
      justify="center"
      :span="24"
      class="set-default-container"
    >
      <el-button
        class="set-default-btn"
        type="success"
        round
        :disabled="store?.state.defaultPicBed === type"
        @click="setDefaultPicBed(type)"
      >
        {{ $T('SETTINGS_SET_DEFAULT_PICBED') }}
      </el-button>
    </el-row>
  </div>
</template>
<script lang="ts" setup>
import { Delete, DocumentCopy, Edit, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { saveConfig, invokeRPC } from '@/utils/dataSender'
import { showNotification } from '@/utils/notification'
import dayjs from 'dayjs'
import { IRPCActionType } from '~/universal/types/enum'
import { T as $T } from '@/i18n/index'
import { useRouter, useRoute, onBeforeRouteUpdate } from 'vue-router'
import { computed, onBeforeMount, ref, watch } from 'vue'
import { PICBEDS_PAGE, UPLOADER_CONFIG_PAGE } from '@/router/config'
import { useStore } from '@/hooks/useStore'
const $router = useRouter()
const $route = useRoute()

const type = ref('')
const curConfigList = ref<IUploaderConfigListItem[]>([])
const defaultConfigId = ref('')
const store = useStore()
const appConfig = computed(() => store?.state.appConfig ?? null)
const $confirm = ElMessageBox.confirm
const $prompt = ElMessageBox.prompt

type MessageBoxAction = 'confirm' | 'cancel' | 'close'

interface PromptBoxState {
  inputValue?: string
  confirmButtonLoading?: boolean
}

async function selectItem (configName: string) {
  const res = await invokeRPC<string>(IRPCActionType.SELECT_UPLOADER, type.value, configName)
  if (!res.success) {
    ElMessage.warning(res.error)
    return
  }
  defaultConfigId.value = res.data
}

onBeforeRouteUpdate((to, from, next) => {
  if (to.params.type && (to.name === UPLOADER_CONFIG_PAGE)) {
    type.value = to.params.type as string
    getCurrentConfigList()
  }
  next()
})

onBeforeMount(() => {
  type.value = $route.params.type as string
  getCurrentConfigList()
  store?.refreshAppConfig()
})

watch(appConfig, () => {
  if (!type.value) return
  getCurrentConfigList()
})

async function getCurrentConfigList () {
  const configList = await invokeRPC<IUploaderConfigItem>(IRPCActionType.GET_PICBED_CONFIG_LIST, type.value)
  if (!configList.success) {
    ElMessage.warning(configList.error)
    return
  }
  curConfigList.value = configList.data?.configList ?? []
  defaultConfigId.value = configList.data?.defaultId ?? ''
}

function openEditPage (configId: string) {
  $router.push({
    name: PICBEDS_PAGE,
    params: {
      type: type.value,
      configId
    },
    query: {
      defaultConfigId: defaultConfigId.value
    }
  })
}

function formatTime (time: number): string {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

function deleteConfig (configName: string) {
  if (curConfigList.value.length <= 1) {
    return
  }
  $confirm($T('TIPS_DELETE_UPLOADER_CONFIG'), $T('TIPS_NOTICE'), {
    confirmButtonText: $T('CONFIRM'),
    cancelButtonText: $T('CANCEL'),
    type: 'warning'
  }).then(async () => {
    const res = await invokeRPC<IUploaderConfigItem>(IRPCActionType.DELETE_PICBED_CONFIG, type.value, configName)
    if (!res.success) {
      ElMessage.warning(res.error)
      return
    }
    curConfigList.value = res.data.configList
    defaultConfigId.value = res.data.defaultId
  }).catch((e) => {
    console.log(e)
    return true
  })
}

function copyConfig (configName: string) {
  $prompt($T('TIPS_COPY_UPLOADER_CONFIG'), $T('TIPS_NOTICE'), {
    confirmButtonText: $T('CONFIRM'),
    cancelButtonText: $T('CANCEL'),
    inputValue: `${configName} - Copy`,
    inputPlaceholder: $T('UPLOADER_CONFIG_PLACEHOLDER'),
    beforeClose: async (action: MessageBoxAction, instance: PromptBoxState, done: () => void) => {
      if (action !== 'confirm') {
        done()
        return
      }

      const newConfigName = String(instance.inputValue ?? '').trim()
      if (!newConfigName) {
        ElMessage.warning($T('TIPS_UPLOADER_CONFIG_NAME_EMPTY'))
        return
      }

      instance.confirmButtonLoading = true
      const res = await invokeRPC<IUploaderConfigItem>(IRPCActionType.COPY_UPLOADER_CONFIG, type.value, configName, newConfigName)
      instance.confirmButtonLoading = false

      if (!res.success) {
        ElMessage.warning(res.error)
        return
      }
      curConfigList.value = res.data.configList
      defaultConfigId.value = res.data.defaultId
      done()
    }
  }).catch((e) => {
    console.log(e)
    return true
  })
}

function addNewConfig () {
  $router.push({
    name: PICBEDS_PAGE,
    params: {
      type: type.value,
      configId: ''
    }
  })
}

function setDefaultPicBed (type: string) {
  saveConfig({
    'picBed.current': type,
    'picBed.uploader': type
  })

  store?.setDefaultPicBed(type)
  showNotification({
    title: $T('SETTINGS_DEFAULT_PICBED'),
    body: $T('TIPS_SET_SUCCEED')
  })
}
</script>
<script lang="ts">
export default {
  name: 'UploaderConfigPage'
}
</script>
<style lang='stylus'>
#config-list-view
  position relative
  min-height 100%
  overflow-x hidden
  overflow-y auto
  padding-bottom 50px
  box-sizing border-box
  .config-list
    flex-wrap wrap
    width: 98%
    .config-item
      height 100px
      margin-bottom 20px
      border-radius 4px
      cursor pointer
      box-sizing border-box
      padding 8px
      background rgba(130, 130, 130, .2)
      border 1px solid transparent
      box-shadow 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04)
      position relative
      .config-name
        color #eee
        font-size 16px
      .config-update-time
        color #aaa
        font-size 14px
        margin-top 10px
      .default-text
        color #67C23A
        font-size 12px
        margin-top 5px
      .operation-container
        position absolute
        right 5px
        top 8px
        font-size 18pxc
        display flex
        align-items center
        color #eee
        .el-icon-edit
        .el-icon-copy
        .el-icon-delete
          cursor pointer
        .el-icon-edit
        .el-icon-copy
          margin-right 10px
        .disabled
          cursor not-allowed
          color #aaa
    .config-item-add
      display: flex
      justify-content: center
      align-items: center
      color: #eee
      font-size: 28px
    .selected
      border 1px solid #409EFF
  .set-default-container
    position fixed
    bottom 20px
    width 100%
    .set-default-btn
      width 250px
      transform translateX(-50%)
</style>
