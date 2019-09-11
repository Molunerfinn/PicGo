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
          size="mini">
          <el-form-item
            label="设定仓库名"
            prop="repo"
            :rules="{
              required: true, message: '仓库名不能为空', trigger: 'blur'
            }">
            <el-input v-model="form.repo" @keyup.native.enter="confirm" placeholder="格式：username/repo"></el-input>
          </el-form-item>
          <el-form-item
            label="设定分支名"
            prop="branch"
            :rules="{
              required: true, message: '分支名不能为空', trigger: 'blur'
            }">
            <el-input v-model="form.branch" @keyup.native.enter="confirm" placeholder="例如：master"></el-input>
          </el-form-item>
          <el-form-item
            label="设定Token"
            prop="token"
            :rules="{
              required: true, message: 'Token不能为空', trigger: 'blur'
            }">
            <el-input v-model="form.token" @keyup.native.enter="confirm" placeholder="token" type="password"></el-input>
          </el-form-item>
          <el-form-item
            label="指定存储路径"
            >
            <el-input v-model="form.path" @keyup.native.enter="confirm" placeholder="例如img/"></el-input>
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
  </div>
</template>
<script>
import mixin from '@/utils/ConfirmButtonMixin'
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
      }
    }
  },
  created () {
    const config = this.$db.get('picBed.github')
    if (config) {
      for (let i in config) {
        this.form[i] = config[i]
      }
    }
  },
  methods: {
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
    }
  }
}
</script>
<style lang='stylus'>
#github-view
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
