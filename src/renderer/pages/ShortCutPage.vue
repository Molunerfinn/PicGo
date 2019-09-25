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
            width="180px"
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
          >
            <template slot-scope="scope">
              {{ calcOrigin(scope.row.name) }}
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
                @click="openKeyBindingDialog(scope.row.name, scope.$index)"
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
<script>
import keyDetect from 'utils/key-binding'
export default {
  name: 'shortcut-page',
  data () {
    return {
      list: [],
      keyBindingVisible: false,
      shortKeyName: '',
      shortKey: '',
      currentIndex: 0
    }
  },
  created () {
    const shortKeyConfig = this.$db.get('settings.shortKey')
    this.list = Object.keys(shortKeyConfig).map(item => shortKeyConfig[item])
  },
  watch: {
    keyBindingVisible (val) {
      this.$electron.ipcRenderer.send('toggleShortKeyModifiedMode', val)
    }
  },
  methods: {
    calcOrigin (item) {
      const [origin] = item.split(':')
      return origin
    },
    toggleEnable (item) {
      const status = !item.enable
      item.enable = status
      this.$db.set(`settings.shortKey.${item.name}.enable`, status)
      this.$electron.ipcRenderer.send('updateShortKey', item)
    },
    keyDetect (event) {
      this.shortKey = keyDetect(event).join('+')
    },
    openKeyBindingDialog (name, index) {
      this.shortKeyName = name
      this.shortKey = this.$db.get(`settings.shortKey.${name}.key`)
      this.currentIndex = index
      this.keyBindingVisible = true
    },
    cancelKeyBinding () {
      this.keyBindingVisible = false
      this.shortKey = this.$db.get(`settings.shortKey.${this.shortKeyName}.key`)
    },
    confirmKeyBinding () {
      const oldKey = this.$db.get(`settings.shortKey.${this.shortKeyName}.key`)
      this.$db.set(`settings.shortKey.${this.shortKeyName}.key`, this.shortKey)
      const newKey = this.$db.get(`settings.shortKey.${this.shortKeyName}`)
      this.$electron.ipcRenderer.send('updateShortKey', newKey, oldKey)
      this.list[this.currentIndex].key = this.shortKey
      this.keyBindingVisible = false
    }
  },
  beforeDestroy () {
    this.$electron.ipcRenderer.send('toggleShortKeyModifiedMode', false)
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
