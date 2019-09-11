<template>
  <div id="tcyun-view">
    <el-row :gutter="16">
      <el-col :span="16" :offset="4">
        <div class="view-title">
          又拍云设置
        </div>
        <el-form 
          ref="tcyun"
          label-position="right"
          label-width="120px"
          :model="form"
          size="mini">
          <el-form-item
            label="设定存储空间名"
            prop="bucket"
            :rules="{
              required: true, message: 'Bucket不能为空', trigger: 'blur'
            }">
            <el-input v-model="form.bucket" @keyup.native.enter="confirm" placeholder="Bucket"></el-input>
          </el-form-item>
          <el-form-item
            label="设定操作员"
            prop="operator"
            :rules="{
              required: true, message: '操作员不能为空', trigger: 'blur'
            }">
            <el-input v-model="form.operator" @keyup.native.enter="confirm" placeholder="例如：me"></el-input>
          </el-form-item>
          <el-form-item
            label="设定操作员密码"
            prop="password"
            :rules="{
              required: true, message: '操作员密码不能为空', trigger: 'blur'
            }">
            <el-input v-model="form.password" @keyup.native.enter="confirm" placeholder="输入操作员密码" type="password"></el-input>
          </el-form-item>
          <el-form-item
            label="设定加速域名"
            prop="url"
            :rules="{
              required: true, message: '加速域名不能为空', trigger: 'blur'
            }">
            <el-input v-model="form.url" placeholder="例如http://xxx.test.upcdn.net" @keyup.native.enter="confirm()"></el-input>
          </el-form-item>
          <el-form-item
            label="设定网址后缀"
            >
            <el-input v-model="form.options" @keyup.native.enter="confirm" placeholder="例如!imgslim"></el-input>
          </el-form-item>
          <el-form-item
            label="指定存储路径"
            >
            <el-input v-model="form.path" @keyup.native.enter="confirm" placeholder="例如img/"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button-group>
              <el-button type="primary" @click="confirm" round>确定</el-button>
              <el-button type="success" @click="setDefaultPicBed('upyun')" round :disabled="defaultPicBed === 'upyun'">设为默认图床</el-button>
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
  name: 'upyun',
  mixins: [mixin],
  data () {
    return {
      form: {
        bucket: '',
        operator: '',
        password: '',
        options: '',
        path: ''
      }
    }
  },
  created () {
    const config = this.$db.get('picBed.upyun')
    if (config) {
      for (let i in config) {
        this.form[i] = config[i]
      }
    }
  },
  methods: {
    confirm () {
      this.$refs.tcyun.validate((valid) => {
        if (valid) {
          this.$db.set('picBed.upyun', this.form).write()
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
#tcyun-view
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