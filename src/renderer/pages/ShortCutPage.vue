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
                type="text">
                {{ scope.row.enable ? '禁用' : '启用' }}
              </el-button>
              <el-button
                size="mini"
                type="text">
                编辑
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-col>
    </el-row>
  </div>
</template>
<script>
export default {
  name: 'shortcut-page',
  data () {
    return {
      list: []
    }
  },
  created () {
    const shortKeyConfig = this.$db.read().get('settings.shortKey').value()
    this.list = Object.keys(shortKeyConfig).map(item => shortKeyConfig[item])
  },
  methods: {
    calcOrigin (item) {
      const [origin] = item.split(':')
      return origin
    },
    toggleEnable (item) {
      const status = !item.enable
      item.enable = status
      this.$db.set(`settings.shortKey.${item.name}.enable`, status).write()
      this.$electron.ipcRenderer.send('updateShortKeyConfig', item)
    }
  }
}
</script>
<style lang='stylus'>
#shortcut-page
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
