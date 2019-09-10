<template>
  <div id="github-view">
    <el-row :gutter="16">
      <el-col :span="16" :offset="4">
        <div class="view-title">
          GitHub设置
        </div>
        <el-form
          ref="github"
          label-position="right"
          label-width="120px"
          :model="form"
          :rules="rule"
          size="mini">
          <el-form-item
            label="设定仓库名"
            prop="repo">
            <el-input v-model="form.repo" @keyup.native.enter="confirm" placeholder="格式：username/repo"></el-input>
          </el-form-item>
          <el-form-item
            label="设定分支名"
            prop="branch">
            <el-input v-model="form.branch" @keyup.native.enter="confirm" placeholder="例如：master"></el-input>
          </el-form-item>
          <el-form-item
            label="设定Token"
            prop="token">
            <el-input v-model="form.token" @keyup.native.enter="confirm" placeholder="token" type="password"></el-input>
          </el-form-item>
          <el-form-item
            label="指定存储路径"
            >
            <el-select v-model="form.path" @keyup.native.enter="confirm" placeholder="例如img/" filterable>
              <el-option v-for="pathOption in presetPathData"
                         :key="pathOption.path"
                         :label="pathOption.name+'————'+pathOption.path"
                         :value="pathOption.path"></el-option>
            </el-select>
            <el-button round type="primary" @click="setPresetPath">配置路径</el-button>
          </el-form-item>
          <el-form-item
            label="设定自定义域名"
            >
            <el-input v-model="form.customUrl" @keyup.native.enter="confirm" placeholder="例如https://xxxx.com"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button-group>
              <el-button type="primary" @click="confirm" round>确定</el-button>
              <el-button type="success" @click="setDefaultPicBed('github')" round :disabled="defaultPicBed === 'github'">设为默认图床</el-button>
            </el-button-group>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>
    <el-dialog title="配置预选存储路径" :visible.sync="presetPathVisible"
               :modal-append-to-body="false" width="60%" :close-on-click-modal="false">
      <el-table style="width: 100%" :data="presetPathData" height="220px">
        <el-table-column
            label="备注名"
            prop="name">
          <template slot-scope="{row}">
            <template v-if="row.edit">
              <el-input v-model="rowEditing.name" class="edit-input" size="small" />
            </template>
            <span v-else>{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column
            label="路径"
            show-overflow-tooltip
            prop="path">
          <template slot-scope="{row}">
            <template v-if="row.edit">
              <el-input v-model="rowEditing.path" class="edit-input" size="small" />
            </template>
            <span v-else>{{ row.path }}</span>
          </template>
        </el-table-column>
        <el-table-column
            label="操作"
            align="center">
          <template slot="header" slot-scope="scope">
            <el-button type="success" size="mini" @click="addPath">添加</el-button>
          </template>
          <template slot-scope="scope">
            <div class="action">
              <a @click="handleConfirm(scope)" v-if="scope.row.edit">确定</a>
              <span v-if="scope.row.edit" class="divider">|</span>
              <a @click="handleEdit(scope)" v-if="!scope.row.add">{{scope.row.edit? '取消': '编辑'}}</a>
              <span v-if="!isAdd" class="divider">|</span>
              <a @click="handleDelete(scope.row)">删除</a>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="close" size="mini">取消</el-button>
        <el-button type="primary" @click="confirmPresetPath" size="mini">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>
<script>
import mixin from '@/utils/ConfirmButtonMixin'
import formRules from '../../utils/formRules'
export default {
  name: 'github',
  mixins: [mixin],
  data () {
    return {
      form: {
        repo: '',
        token: '',
        path: '',
        customUrl: '',
        branch: ''
      },
      pathOptions: [],
      presetPathVisible: false,
      presetPathData: [],
      rule: {
        repo: [formRules.required('仓库名不能为空')],
        branch: [formRules.required('分支名不能为空')],
        token: [formRules.required('Token不能为空')]
      },
      rowEditing: {},
      isAdd: false
    }
  },
  created () {
    const config = this.$db.get('picBed.github').value()
    this.presetPathData = this.$db.get('picBed.github_presetPath').value() || []
    if (config) {
      for (let i in config) {
        this.form[i] = config[i]
      }
    }
  },
  methods: {
    addPath () {
      this.presetPathData.unshift({name: '', path: '/', edit: true, add: true})
    },
    setPresetPath () {
      this.presetPathVisible = true
    },
    confirm () {
      this.$refs.github.validate((valid) => {
        if (valid) {
          this.$db.set('picBed.github', this.form).write()
          const successNotification = new window.Notification('设置结果', {
            body: '设置成功'
          })
          successNotification.onclick = () => {
            return true
          }
        } else {
          return false
        }
      })
    },
    close () {
      this.presetPathVisible = false
    },
    handleEdit (scope) {
      this.presetPathData.map(v => {
        v.edit = false
      })
      scope.row.edit = !scope.row.edit
      this.rowEditing = JSON.parse(JSON.stringify(scope.row))
    },
    handleDelete (row) {
      this.presetPathData.splice(this.presetPathData.findIndex(v => v.path === row.path), 1)
    },
    handleConfirm (scope) {
      scope.row.edit = false
      if (scope.row.add) {
        delete scope.row.add
      }
      scope.row.name = this.rowEditing.name
      scope.row.path = this.rowEditing.path
      this.rowEditing = {}
    },
    confirmPresetPath () {
      this.$db.set('picBed.github_presetPath', this.presetPathData).write()
      const successNotification = new window.Notification('设置结果', {
        body: '设置成功'
      })
      successNotification.onclick = () => {
        return true
      }
      this.close()
    }
  }
}
</script>
<style lang='stylus'>
#github-view
  .el-dialog__body
    padding: 0 20px;
  .action
    display flex
    justify-content center
    a{
      color: #409EFF
      cursor pointer
    }
    .divider
      margin 0 2px
      color gray
      line-height 20px
  .el-form
    label
      line-height 22px
      padding-bottom 0
      color #eee
    .el-input__inner
      border-radius 19px
  .el-radio-group
    width 100%
    label
      width 25%
    .el-radio-button__inner
      width 100%
  .el-radio-button:first-child
    .el-radio-button__inner
      border-left none
      border-radius 14px 0 0 14px
  .el-radio-button:last-child
    .el-radio-button__inner
      border-left none
      border-radius 0 14px 14px 0

</style>
