<template>
  <div id="shortcut-page">
    <div class="view-title">
      {{ $T('SETTINGS_SET_SHORTCUT') }}
    </div>
    <el-row>
      <el-col :span="20" :offset="2">
        <el-table
          class="shortcut-page-table-border"
          :data="list"
          size="mini"
          header-cell-class-name="shortcut-page-table-border"
          cell-class-name="shortcut-page-table-border"
        >
          <el-table-column
            :label="$T('SHORTCUT_NAME')"
          >
            <template slot-scope="scope">
              {{ scope.row.label ? scope.row.label : scope.row.name }}
            </template>
          </el-table-column>
          <el-table-column
            width="160px"
            :label="$T('SHORTCUT_BIND')"
            prop="key"
          >
          </el-table-column>
          <el-table-column
            :label="$T('SHORTCUT_STATUS')"
          >
            <template slot-scope="scope">
              <el-tag
                size="mini"
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
            <template slot-scope="scope">
              {{ calcOriginShowName(scope.row.from) }}
            </template>
          </el-table-column>
          <el-table-column
            :label="$T('SHORTCUT_HANDLE')"
          >
            <template slot-scope="scope">
              <el-button
                @click="toggleEnable(scope.row)"
                size="mini"
                :class="{
                  disabled: scope.row.enable
                }"
                type="text">
                {{ scope.row.enable ? $T('SHORTCUT_DISABLE') : $T('SHORTCUT_ENABLE') }}
              </el-button>
              <el-button
                class="edit"
                size="mini"
                @click="openKeyBindingDialog(scope.row, scope.$index)"
                type="text">
                {{ $T('SHORTCUT_EDIT') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-col>
    </el-row>
    <el-dialog
      :title="$T('SHORTCUT_CHANGE_UPLOAD')"
      :visible.sync="keyBindingVisible"
      :modal-append-to-body="false"
    >
      <el-form
        label-position="top"
        label-width="80px"
      >
        <el-form-item>
          <el-input
            class="align-center"
            @keydown.native.prevent="keyDetect($event)"
            v-model="shortKey"
            :autofocus="true"
          ></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="cancelKeyBinding" round>
          {{ $T('CANCEL') }}
        </el-button>
        <el-button type="primary" @click="confirmKeyBinding" round>
          {{ $T('CONFIRM') }}
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>
<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import keyDetect from '@/utils/key-binding'
import { ipcRenderer, IpcRendererEvent } from 'electron'
import { TOGGLE_SHORTKEY_MODIFIED_MODE } from '#/events/constants'

@Component({
  name: 'shortkey-page'
})
export default class extends Vue {
  list: IShortKeyConfig[] = []
  keyBindingVisible = false
  command = ''
  shortKey = ''
  currentIndex = 0
  async created () {
    const shortKeyConfig = (await this.getConfig<IShortKeyConfigs>('settings.shortKey'))!
    this.list = Object.keys(shortKeyConfig).map(item => {
      return {
        ...shortKeyConfig[item],
        from: this.calcOrigin(item)
      }
    })
  }

  @Watch('keyBindingVisible')
  onKeyBindingVisibleChange (val: boolean) {
    ipcRenderer.send(TOGGLE_SHORTKEY_MODIFIED_MODE, val)
  }

  calcOrigin (item: string) {
    const [origin] = item.split(':')
    return origin
  }

  calcOriginShowName (item: string) {
    return item.replace('picgo-plugin-', '')
  }

  toggleEnable (item: IShortKeyConfig) {
    const status = !item.enable
    item.enable = status
    ipcRenderer.send('bindOrUnbindShortKey', item, item.from)
  }

  keyDetect (event: KeyboardEvent) {
    this.shortKey = keyDetect(event).join('+')
  }

  async openKeyBindingDialog (config: IShortKeyConfig, index: number) {
    this.command = `${config.from}:${config.name}`
    this.shortKey = await this.getConfig(`settings.shortKey.${this.command}.key`) || ''
    this.currentIndex = index
    this.keyBindingVisible = true
  }

  async cancelKeyBinding () {
    this.keyBindingVisible = false
    this.shortKey = await this.getConfig<string>(`settings.shortKey.${this.command}.key`) || ''
  }

  async confirmKeyBinding () {
    const oldKey = await this.getConfig<string>(`settings.shortKey.${this.command}.key`)
    const config = Object.assign({}, this.list[this.currentIndex])
    config.key = this.shortKey
    ipcRenderer.send('updateShortKey', config, oldKey, config.from)
    ipcRenderer.once('updateShortKeyResponse', (evt: IpcRendererEvent, result) => {
      if (result) {
        this.keyBindingVisible = false
        this.list[this.currentIndex].key = this.shortKey
      }
    })
  }

  beforeDestroy () {
    ipcRenderer.send(TOGGLE_SHORTKEY_MODIFIED_MODE, false)
  }
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
</style>
