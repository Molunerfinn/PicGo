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
          @click="() => selectItem(item._id)"
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
              @click="openEditPage(item._id)"
            >
              <Edit />
            </el-icon>
            <el-icon
              class="el-icon-delete"
              :class="curConfigList.length <= 1 ? 'disabled' : ''"
              @click.stop="() => deleteConfig(item._id)"
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
import { Edit, Delete, Plus } from '@element-plus/icons-vue'
import { saveConfig, triggerRPC } from '@/utils/dataSender'
import dayjs from 'dayjs'
import { IRPCActionType } from '~/universal/types/enum'
import { T as $T } from '@/i18n/index'
import { useRouter, useRoute, onBeforeRouteUpdate } from 'vue-router'
import { onBeforeMount, ref } from 'vue'
import { PICBEDS_PAGE, UPLOADER_CONFIG_PAGE } from '@/router/config'
import { useStore } from '@/hooks/useStore'
const $router = useRouter()
const $route = useRoute()

const type = ref('')
const curConfigList = ref<IStringKeyMap[]>([])
const defaultConfigId = ref('')
const store = useStore()

async function selectItem (id: string) {
  await triggerRPC<void>(IRPCActionType.SELECT_UPLOADER, type.value, id)
  defaultConfigId.value = id
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
})

async function getCurrentConfigList () {
  const configList = await triggerRPC<IUploaderConfigItem>(IRPCActionType.GET_PICBED_CONFIG_LIST, type.value)
  curConfigList.value = configList?.configList ?? []
  defaultConfigId.value = configList?.defaultId ?? ''
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

async function deleteConfig (id: string) {
  const res = await triggerRPC<IUploaderConfigItem | undefined>(IRPCActionType.DELETE_PICBED_CONFIG, type.value, id)
  if (!res) return
  curConfigList.value = res.configList
  defaultConfigId.value = res.defaultId
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
  const successNotification = new Notification($T('SETTINGS_DEFAULT_PICBED'), {
    body: $T('TIPS_SET_SUCCEED')
  })
  successNotification.onclick = () => {
    return true
  }
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
        .el-icon-delete
          cursor pointer
        .el-icon-edit
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
