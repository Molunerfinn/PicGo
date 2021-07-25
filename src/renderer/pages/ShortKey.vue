<template>
  <div id="shortcut-page">
    <div class="view-title">
      快捷键设置
    </div>
    <el-row>
      <el-col :span="20" :offset="2">
        <el-table
          :data="list"
          size="mini"
        >
          <el-table-column
            label="快捷键名称"
          >
            <template slot-scope="scope">
              {{ scope.row.label ? scope.row.label : scope.row.name }}
            </template>
          </el-table-column>
          <el-table-column
            width="160px"
            label="快捷键绑定"
            prop="key"
          >
          </el-table-column>
          <el-table-column
            label="状态"
          >
            <template slot-scope="scope">
              <el-tag
                size="mini"
                :type="scope.row.enable ? 'success' : 'danger'"
              >
                {{ scope.row.enable ? '已启用' : '已禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            label="来源"
            width="100px"
          >
            <template slot-scope="scope">
              {{ calcOriginShowName(scope.row.from) }}
            </template>
          </el-table-column>
          <el-table-column
            label="操作"
          >
            <template slot-scope="scope">
              <el-button
                @click="toggleEnable(scope.row)"
                size="mini"
                :class="{
                  disabled: scope.row.enable
                }"
                type="text">
                {{ scope.row.enable ? '禁用' : '启用' }}
              </el-button>
              <el-button
                class="edit"
                size="mini"
                @click="openKeyBindingDialog(scope.row, scope.$index)"
                type="text">
                编辑
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-col>
    </el-row>
    <el-dialog
      title="修改上传快捷键"
      :visible.sync="keyBindingVisible"
      :modal-append-to-body="false"
    >
      <el-form
        label-position="top"
        label-width="80px"
      >
        <el-form-item
          label="快捷上传"
        >
          <el-input
            class="align-center"
            @keydown.native.prevent="keyDetect($event)"
            v-model="shortKey"
            :autofocus="true"
          ></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="cancelKeyBinding" round>取消</el-button>
        <el-button type="primary" @click="confirmKeyBinding" round>确定</el-button>
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
