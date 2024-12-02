<template>
  <div id="plugin-view">
    <div class="view-title">
      {{ $T('PLUGIN_SETTINGS') }} -
      <el-tooltip
        :content="pluginListToolTip"
        placement="right"
      >
        <el-icon
          class="el-icon-goods"
          @click="goAwesomeList"
        >
          <Goods />
        </el-icon>
      </el-tooltip>
      <el-tooltip
        :content="importLocalPluginToolTip"
        placement="left"
      >
        <el-icon
          class="el-icon-download"
          @click="handleImportLocalPlugin"
        >
          <Download />
        </el-icon>
      </el-tooltip>
    </div>
    <el-row
      class="handle-bar"
      :class="{ 'cut-width': pluginList.length > 6 }"
    >
      <el-input
        v-model="searchText"
        :placeholder="$T('PLUGIN_SEARCH_PLACEHOLDER')"
        size="small"
      >
        <template #suffix>
          <el-icon
            class="el-input__icon"
            style="cursor: pointer;"
            @click="cleanSearch"
          >
            <close />
          </el-icon>
        </template>
      </el-input>
    </el-row>
    <el-row
      v-loading="loading"
      :gutter="10"
      class="plugin-list"
    >
      <el-col
        v-for="item in pluginList"
        :key="item.fullName"
        class="plugin-item__container"
        :span="12"
      >
        <div
          class="plugin-item"
          :class="{ 'darwin': os === 'darwin' }"
        >
          <div
            v-if="!item.gui"
            class="cli-only-badge"
            title="CLI only"
          >
            CLI
          </div>
          <img
            class="plugin-item__logo"
            :src="item.logo"
            :onerror="defaultLogo"
          >
          <div
            class="plugin-item__content"
            :class="{ disabled: !item.enabled }"
          >
            <div
              class="plugin-item__name"
              @click="openHomepage(item.homepage)"
            >
              {{ item.name }} <small>{{ ' ' + item.version }}</small>
            </div>
            <div
              class="plugin-item__desc"
              :title="item.description"
            >
              {{ item.description }}
            </div>
            <div class="plugin-item__info-bar">
              <span class="plugin-item__author">
                {{ item.author }}
              </span>
              <span class="plugin-item__config">
                <template v-if="searchText">
                  <template v-if="!item.hasInstall">
                    <span
                      v-if="!item.ing"
                      class="config-button install"
                      @click="installPlugin(item)"
                    >
                      {{ $T('PLUGIN_INSTALL') }}
                    </span>
                    <span
                      v-else-if="item.ing"
                      class="config-button ing"
                    >
                      {{ $T('PLUGIN_INSTALLING') }}
                    </span>
                  </template>
                  <span
                    v-else
                    class="config-button ing"
                  >
                    {{ $T('PLUGIN_INSTALLED') }}
                  </span>
                </template>
                <template v-else>
                  <span
                    v-if="item.ing"
                    class="config-button ing"
                  >
                    {{ $T('PLUGIN_DOING_SOMETHING') }}
                  </span>
                  <template v-else>
                    <el-icon
                      v-if="item.enabled"
                      class="el-icon-setting"
                      @click="buildContextMenu(item)"
                    >
                      <Setting />
                    </el-icon>
                    <el-icon
                      v-else
                      class="el-icon-remove-outline"
                      @click="buildContextMenu(item)"
                    >
                      <Remove />
                    </el-icon>
                  </template>
                </template>
              </span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
    <el-row
      v-show="needReload"
      class="reload-mask"
      :class="{ 'cut-width': pluginList.length > 6 }"
      justify="center"
    >
      <el-button
        type="primary"
        size="small"
        round
        @click="reloadApp"
      >
        {{ $T('TIPS_NEED_RELOAD') }}
      </el-button>
    </el-row>
    <el-dialog
      v-model="dialogVisible"
      :modal-append-to-body="false"
      :title="$T('CONFIG_THING', {
        c: configName
      })"
      width="70%"
    >
      <config-form
        :id="configName"
        ref="$configForm"
        :config="config"
        :type="currentType"
        color-mode="white"
      />
      <template #footer>
        <el-button
          round
          @click="handleCancelConfig"
        >
          {{ $T('CANCEL') }}
        </el-button>
        <el-button
          type="primary"
          round
          @click="handleConfirmConfig"
        >
          {{ $T('CONFIRM') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script lang="ts" setup>
import { Close, Download, Goods, Remove, Setting } from '@element-plus/icons-vue'
import { T as $T } from '@/i18n/index'
import ConfigForm from '@/components/ConfigForm.vue'
import { debounce, DebouncedFunc } from 'lodash'
import {
  ipcRenderer,
  IpcRendererEvent
} from 'electron'
import { handleStreamlinePluginName } from '~/universal/utils/common'
import {
  OPEN_URL,
  PICGO_CONFIG_PLUGIN,
  PICGO_HANDLE_PLUGIN_ING,
  PICGO_TOGGLE_PLUGIN,
  SHOW_PLUGIN_PAGE_MENU,
  GET_PICBEDS,
  PICGO_HANDLE_PLUGIN_DONE
} from '#/events/constants'
import { computed, ref, onBeforeMount, onBeforeUnmount, watch } from 'vue'
import { getConfig, saveConfig, sendRPC, sendToMain } from '@/utils/dataSender'
import { ElMessageBox } from 'element-plus'
import axios from 'axios'
import { IRPCActionType } from '~/universal/types/enum'
const $confirm = ElMessageBox.confirm
const searchText = ref('')
const pluginList = ref<IPicGoPlugin[]>([])
const config = ref<any[]>([])
const currentType = ref<'plugin' | 'uploader' | 'transformer'>('plugin')
const configName = ref('')
const dialogVisible = ref(false)
const pluginNameList = ref<string[]>([])
const loading = ref(true)
const needReload = ref(false)
const pluginListToolTip = $T('PLUGIN_LIST')
const importLocalPluginToolTip = $T('PLUGIN_IMPORT_LOCAL')
// const id = ref('')
const os = ref('')
const defaultLogo = ref(`this.src="file://${__static.replace(/\\/g, '/')}/roundLogo.png"`)
const $configForm = ref<InstanceType<typeof ConfigForm> | null>(null)
const npmSearchText = computed(() => {
  return searchText.value.match('picgo-plugin-')
    ? searchText.value
    : searchText.value !== ''
      ? `picgo-plugin-${searchText.value}`
      : searchText.value
})
let getSearchResult: DebouncedFunc<(val: string) => void>

watch(npmSearchText, (val: string) => {
  if (val) {
    loading.value = true
    pluginList.value = []
    getSearchResult(val)
  } else {
    getPluginList()
  }
})

watch(dialogVisible, (val: boolean) => {
  if (val) {
    // @ts-ignore
    document.querySelector('.main-content.el-row').style.zIndex = 101
  } else {
    // @ts-ignore
    document.querySelector('.main-content.el-row').style.zIndex = 10
  }
})

onBeforeMount(async () => {
  os.value = process.platform
  ipcRenderer.on('hideLoading', () => {
    loading.value = false
  })
  ipcRenderer.on(PICGO_HANDLE_PLUGIN_DONE, (evt: IpcRendererEvent, fullName: string) => {
    pluginList.value.forEach(item => {
      if (item.fullName === fullName || (item.name === fullName)) {
        item.ing = false
      }
    })
    loading.value = false
  })
  ipcRenderer.on('pluginList', (evt: IpcRendererEvent, list: IPicGoPlugin[]) => {
    pluginList.value = list
    pluginNameList.value = list.map(item => item.fullName)
    loading.value = false
  })
  ipcRenderer.on('installPlugin', (evt: IpcRendererEvent, { success, body }: {
    success: boolean,
    body: string
  }) => {
    loading.value = false
    pluginList.value.forEach(item => {
      if (item.fullName === body) {
        item.ing = false
        item.hasInstall = success
      }
    })
  })
  ipcRenderer.on('updateSuccess', (evt: IpcRendererEvent, plugin: string) => {
    loading.value = false
    pluginList.value.forEach(item => {
      if (item.fullName === plugin) {
        item.ing = false
        item.hasInstall = true
      }
      getPicBeds()
    })
    handleReload()
    getPluginList()
  })
  ipcRenderer.on('uninstallSuccess', (evt: IpcRendererEvent, plugin: string) => {
    loading.value = false
    pluginList.value = pluginList.value.filter(item => {
      if (item.fullName === plugin) { // restore Uploader & Transformer after uninstalling
        if (item.config.transformer.name) {
          handleRestoreState('transformer', item.config.transformer.name)
        }
        if (item.config.uploader.name) {
          handleRestoreState('uploader', item.config.uploader.name)
        }
        getPicBeds()
      }
      return item.fullName !== plugin
    })
    pluginNameList.value = pluginNameList.value.filter(item => item !== plugin)
  })
  ipcRenderer.on(PICGO_CONFIG_PLUGIN, (evt: IpcRendererEvent, _currentType: 'plugin' | 'transformer' | 'uploader', _configName: string, _config: any) => {
    currentType.value = _currentType
    configName.value = _configName
    dialogVisible.value = true
    config.value = _config
  })
  ipcRenderer.on(PICGO_HANDLE_PLUGIN_ING, (evt: IpcRendererEvent, fullName: string) => {
    pluginList.value.forEach(item => {
      if (item.fullName === fullName || (item.name === fullName)) {
        item.ing = true
      }
    })
    loading.value = true
  })
  ipcRenderer.on(PICGO_TOGGLE_PLUGIN, (evt: IpcRendererEvent, fullName: string, enabled: boolean) => {
    const plugin = pluginList.value.find(item => item.fullName === fullName)
    if (plugin) {
      plugin.enabled = enabled
      getPicBeds()
      needReload.value = true
    }
  })
  getPluginList()
  getSearchResult = debounce(_getSearchResult, 50)
  needReload.value = await getConfig<boolean>('needReload') || false
})

async function buildContextMenu (plugin: IPicGoPlugin) {
  sendToMain(SHOW_PLUGIN_PAGE_MENU, plugin)
}

function getPluginList () {
  sendToMain('getPluginList')
}

function getPicBeds () {
  sendToMain(GET_PICBEDS)
}

function installPlugin (item: IPicGoPlugin) {
  if (!item.gui) {
    $confirm($T('TIPS_PLUGIN_NOT_GUI_IMPLEMENT'), $T('TIPS_NOTICE'), {
      confirmButtonText: $T('CONFIRM'),
      cancelButtonText: $T('CANCEL'),
      type: 'warning'
    }).then(() => {
      item.ing = true
      sendToMain('installPlugin', item.fullName)
    }).catch(() => {
      console.log('Install canceled')
    })
  } else {
    item.ing = true
    sendToMain('installPlugin', item.fullName)
  }
}

// function uninstallPlugin (val: string) {
//   pluginList.value.forEach(item => {
//     if (item.name === val) {
//       item.ing = true
//     }
//   })
//   loading.value = true
//   sendToMain('uninstallPlugin', val)
// }

// function updatePlugin (val: string) {
//   pluginList.value.forEach(item => {
//     if (item.fullName === val) {
//       item.ing = true
//     }
//   })
//   loading.value = true
//   sendToMain('updatePlugin', val)
// }

function reloadApp () {
  sendRPC(IRPCActionType.RELOAD_APP)
}

async function handleReload () {
  saveConfig({
    needReload: true
  })
  needReload.value = true
  const successNotification = new Notification($T('PLUGIN_UPDATE_SUCCEED'), {
    body: $T('TIPS_NEED_RELOAD')
  })
  successNotification.onclick = () => {
    reloadApp()
  }
}

function cleanSearch () {
  searchText.value = ''
}

async function handleConfirmConfig () {
  const result = (await $configForm.value?.validate() || false)
  if (result !== false) {
    switch (currentType.value) {
      case 'plugin':
        saveConfig({
          [`${configName.value}`]: result
        })
        break
      case 'uploader':
        saveConfig({
          [`picBed.${configName.value}`]: result
        })
        break
      case 'transformer':
        saveConfig({
          [`transformer.${configName.value}`]: result
        })
        break
    }
    const successNotification = new Notification($T('SETTINGS_RESULT'), {
      body: $T('TIPS_SET_SUCCEED')
    })
    successNotification.onclick = () => {
      return true
    }
    dialogVisible.value = false
    getPluginList()
  }
}

function handleCancelConfig () {
  dialogVisible.value = false
  $configForm.value?.resetConfig()
}

function _getSearchResult (val: string) {
  // this.$http.get(`https://api.npms.io/v2/search?q=${val}`)
  axios.get(`https://registry.npmjs.com/-/v1/search?text=${val}`)
    .then((res: INPMSearchResult) => {
      pluginList.value = res.data.objects
        .filter((item:INPMSearchResultObject) => {
          return item.package.name.includes('picgo-plugin-')
        })
        .map((item: INPMSearchResultObject) => {
          return handleSearchResult(item)
        })
      loading.value = false
    })
    .catch(err => {
      console.log(err)
      loading.value = false
    })
}

function handleSearchResult (item: INPMSearchResultObject) {
  const name = handleStreamlinePluginName(item.package.name)
  let gui = false
  if (item.package.keywords && item.package.keywords.length > 0) {
    if (item.package.keywords.includes('picgo-gui-plugin')) {
      gui = true
    }
  }
  return {
    name,
    fullName: item.package.name,
    author: item.package.maintainers[0]?.username || '',
    description: item.package.description,
    logo: `https://cdn.jsdelivr.net/npm/${item.package.name}/logo.png`,
    config: {},
    homepage: item.package.links ? item.package.links.homepage : '',
    hasInstall: pluginNameList.value.some(plugin => plugin === item.package.name),
    version: item.package.version,
    gui,
    ing: false // installing or uninstalling
  }
}

// restore Uploader & Transformer
async function handleRestoreState (item: string, name: string) {
  if (item === 'uploader') {
    const current = await getConfig('picBed.current')
    if (current === name) {
      saveConfig({
        'picBed.current': 'smms',
        'picBed.uploader': 'smms'
      })
    }
  }
  if (item === 'transformer') {
    const current = await getConfig('picBed.transformer')
    if (current === name) {
      saveConfig({
        'picBed.transformer': 'path'
      })
    }
  }
}

function openHomepage (url: string) {
  if (url) {
    sendToMain(OPEN_URL, url)
  }
}

function goAwesomeList () {
  sendToMain(OPEN_URL, 'https://github.com/PicGo/Awesome-PicGo')
}

function handleImportLocalPlugin () {
  sendToMain('importLocalPlugin')
  loading.value = true
}

onBeforeUnmount(() => {
  ipcRenderer.removeAllListeners('pluginList')
  ipcRenderer.removeAllListeners('installPlugin')
  ipcRenderer.removeAllListeners('uninstallSuccess')
  ipcRenderer.removeAllListeners('updateSuccess')
  ipcRenderer.removeAllListeners('hideLoading')
  ipcRenderer.removeAllListeners(PICGO_HANDLE_PLUGIN_DONE)
})

</script>
<script lang="ts">
export default {
  name: 'PluginPage'
}
</script>
<style lang='stylus'>
$darwinBg = #172426
#plugin-view
  position relative
  padding 0 20px 0
  .el-loading-mask
    background-color rgba(0, 0, 0, 0.8)
  .plugin-list
    align-content flex-start
    height: 339px;
    box-sizing: border-box;
    padding: 8px 15px;
    overflow-y: auto;
    overflow-x: hidden;
    position: absolute;
    top: 70px;
    left: 5px;
    transition: all 0.2s ease-in-out 0.1s;
    width: 100%
    .el-loading-mask
      left: 20px
      width: calc(100% - 40px)
  .view-title
    color #eee
    font-size 20px
    text-align center
    margin 10px auto
    position relative
    i.el-icon-goods
      margin-left 4px
      font-size 20px
      vertical-align middle
      cursor pointer
      transition color .2s ease-in-out
      &:hover
        color #49B1F5
    i.el-icon-download
      position absolute
      right 0
      top 8px
      font-size 20px
      vertical-align middle
      cursor pointer
      transition color .2s ease-in-out
      &:hover
        color #49B1F5
  .handle-bar
    margin-bottom 20px
    &.cut-width
      padding-right: 8px
  .el-input__inner
    border-radius 0
  .plugin-item
    box-sizing border-box
    height 80px
    background #444
    padding 8px
    user-select text
    transition all .2s ease-in-out
    position relative
    &__container
      height 80px
      margin-bottom 10px
    .cli-only-badge
      position absolute
      right 0px
      top 0
      font-size 12px
      padding 3px 8px
      background #49B1F5
      color #eee
    &.darwin
      background transparentify($darwinBg, #000, 0.75)
      &:hover
        background transparentify($darwinBg, #000, 0.85)
    &:hover
      background #333
    &__logo
      width 64px
      height 64px
      float left
    &__content
      float left
      width calc(100% - 72px)
      height 64px
      color #ddd
      margin-left 8px
      display flex
      flex-direction column
      justify-content space-between
      &.disabled
        color #aaa
    &__name
      font-size 16px
      height 22px
      line-height 22px
      // font-weight 600
      font-weight 600
      cursor pointer
      transition all .2s ease-in-out
      &:hover
        color: #1B9EF3
    &__desc
      font-size 14px
      height 21px
      line-height 21px
      overflow hidden
      text-overflow ellipsis
      white-space nowrap
    &__info-bar
      font-size 14px
      height 21px
      line-height 28px
      position relative
    &__author
      overflow hidden
      text-overflow ellipsis
      white-space nowrap
    &__config
      float right
      font-size 16px
      cursor pointer
      transition all .2s ease-in-out
      &:hover
        color: #1B9EF3
    .config-button
      font-size 12px
      color #ddd
      background #222
      padding 1px 8px
      height 18px
      line-height 18px
      text-align center
      position absolute
      top 4px
      right 20px
      transition all .2s ease-in-out
      &.reload
        right 0px
      &.ing
        right 0px
      &.install
        right 0px
        &:hover
          background: #1B9EF3
          color #fff
  .reload-mask
    position absolute
    width calc(100% - 40px)
    bottom -320px
    text-align center
    background rgba(0,0,0,0.4)
    padding 10px 0
    &.cut-width
      width calc(100% - 48px)
</style>
