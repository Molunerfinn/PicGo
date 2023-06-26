<template>
  <div id="shortcut-page">
    <div class="view-title">
      {{ $T('SETTINGS_SET_SHORTCUT') }}
    </div>
    <el-row>
      <el-col
        :span="20"
        :offset="2"
      >
        <el-table
          class="shortcut-page-table-border"
          :data="list"
          size="small"
          header-cell-class-name="shortcut-page-table-border"
          cell-class-name="shortcut-page-table-border"
        >
          <el-table-column
            :label="$T('SHORTCUT_NAME')"
          >
            <template #default="scope">
              {{ scope.row.label ? scope.row.label : scope.row.name }}
            </template>
          </el-table-column>
          <el-table-column
            width="160px"
            :label="$T('SHORTCUT_BIND')"
            prop="key"
          />
          <el-table-column
            :label="$T('SHORTCUT_STATUS')"
          >
            <template #default="scope">
              <el-tag
                size="small"
                :type="scope.row.enable ? 'success' : 'danger'"
              >
                {{ scope.row.enable ? $T('SHORTCUT_ENABLED') : $T('SHORTCUT_DISABLED') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            :label="$T('SHORTCUT_SOURCE')"
            width="100px"
          >
            <template #default="scope">
              {{ calcOriginShowName(scope.row.from) }}
            </template>
          </el-table-column>
          <el-table-column
            :label="$T('SHORTCUT_HANDLE')"
            width="100px"
          >
            <template #default="scope">
              <el-row>
                <el-button
                  size="small"
                  :class="{
                    disabled: scope.row.enable
                  }"
                  type="text"
                  @click="toggleEnable(scope.row)"
                >
                  {{ scope.row.enable ? $T('SHORTCUT_DISABLE') : $T('SHORTCUT_ENABLE') }}
                </el-button>
                <el-button
                  class="edit"
                  size="small"
                  type="text"
                  @click="openKeyBindingDialog(scope.row, scope.$index)"
                >
                  {{ $T('SHORTCUT_EDIT') }}
                </el-button>
              </el-row>
            </template>
          </el-table-column>
        </el-table>
      </el-col>
    </el-row>
    <el-dialog
      v-model="keyBindingVisible"
      :title="$T('SHORTCUT_CHANGE_UPLOAD')"
      :modal-append-to-body="false"
    >
      <el-form
        label-position="top"
        label-width="80px"
      >
        <el-form-item>
          <el-input
            v-model="shortKey"
            class="align-center"
            :autofocus="true"
            @keydown.prevent="keyDetect($event as KeyboardEvent)"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button
          round
          @click="cancelKeyBinding"
        >
          {{ $T('CANCEL') }}
        </el-button>
        <el-button
          type="primary"
          round
          @click="confirmKeyBinding"
        >
          {{ $T('CONFIRM') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script lang="ts" setup>
import keyBinding from '@/utils/key-binding'
import { ipcRenderer, IpcRendererEvent } from 'electron'
import { TOGGLE_SHORTKEY_MODIFIED_MODE } from '#/events/constants'
import { onBeforeUnmount, onBeforeMount, ref, watch } from 'vue'
import { getConfig, sendToMain } from '@/utils/dataSender'
import { T as $T } from '@/i18n/index'

const list = ref<IShortKeyConfig[]>([])
const keyBindingVisible = ref(false)
const command = ref('')
const shortKey = ref('')
const currentIndex = ref(0)

onBeforeMount(async () => {
  const shortKeyConfig = (await getConfig<IShortKeyConfigs>('settings.shortKey'))!
  list.value = Object.keys(shortKeyConfig).map(item => {
    return {
      ...shortKeyConfig[item],
      from: calcOrigin(item)
    }
  })
})

watch(keyBindingVisible, (val: boolean) => {
  sendToMain(TOGGLE_SHORTKEY_MODIFIED_MODE, val)
})

function calcOrigin (item: string) {
  const [origin] = item.split(':')
  return origin
}

function calcOriginShowName (item: string) {
  return item.replace('picgo-plugin-', '')
}

function toggleEnable (item: IShortKeyConfig) {
  const status = !item.enable
  item.enable = status
  sendToMain('bindOrUnbindShortKey', item, item.from)
}

function keyDetect (event: KeyboardEvent) {
  shortKey.value = keyBinding(event).join('+')
}

async function openKeyBindingDialog (config: IShortKeyConfig, index: number) {
  command.value = `${config.from}:${config.name}`
  shortKey.value = await getConfig(`settings.shortKey.${command.value}.key`) || ''
  currentIndex.value = index
  keyBindingVisible.value = true
}

async function cancelKeyBinding () {
  keyBindingVisible.value = false
  shortKey.value = await getConfig<string>(`settings.shortKey.${command.value}.key`) || ''
}

async function confirmKeyBinding () {
  const oldKey = await getConfig<string>(`settings.shortKey.${command.value}.key`)
  const config = Object.assign({}, list.value[currentIndex.value])
  config.key = shortKey.value
  sendToMain('updateShortKey', config, oldKey, config.from)
  ipcRenderer.once('updateShortKeyResponse', (evt: IpcRendererEvent, result) => {
    if (result) {
      keyBindingVisible.value = false
      list.value[currentIndex.value].key = shortKey.value
    }
  })
}

onBeforeUnmount(() => {
  sendToMain(TOGGLE_SHORTKEY_MODIFIED_MODE, false)
})
</script>
<script lang="ts">
export default {
  name: 'ShortkeyPage'
}
</script>
<style lang='stylus'>
#shortcut-page
  .shortcut-page-table-border
    border-color darken(#eee, 50%)
  .el-dialog__body
    padding 10px 20px
    .el-form-item
      margin-bottom 0
  .el-button
    &.disabled
      color: #F56C6C
    &.edit
      color: #67C23A
    &--text
      padding-left 4px
      padding-right 4px
  .el-table
    background-color: transparent
    color #ddd
    &::before
      background-color darken(#eee, 50%)
    thead
      color #bbb
    th,tr
      background-color: transparent
    &__body
      tr.el-table__row--striped
        td
          background transparent
    &--enable-row-hover
      .el-table__body
        tr:hover
          &>td
            background #333
  .el-button+.el-button
    margin-left 4px
</style>
