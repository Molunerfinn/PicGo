<template>
  <div id="tcyun-view">
    <el-row :gutter="16">
      <el-col :span="16" :offset="4">
        <div class="view-title">
          腾讯云COS设置
        </div>
        <el-form 
          ref="tcyun"
          label-position="right"
          label-width="120px"
          :model="form"
          size="mini">
          <el-form-item
            label="设定SecretId"
            prop="secretId"
            :rules="{
              required: true, message: 'SecretId不能为空', trigger: 'blur'
            }">
            <el-input v-model="form.secretId" placeholder="SecretId" @keyup.native.enter="confirm('weiboForm')"></el-input>
          </el-form-item>
          <el-form-item
            label="设定SecretKey"
            prop="secretKey"
            :rules="{
              required: true, message: 'SecretKey不能为空', trigger: 'blur'
            }">
            <el-input v-model="form.secretKey" type="password" @keyup.native.enter="confirm" placeholder="SecretKey"></el-input>
          </el-form-item>
          <el-form-item
            label="设定APPID"
            prop="appId"
            :rules="{
              required: true, message: 'APPID不能为空', trigger: 'blur'
            }">
            <el-input v-model="form.appId" @keyup.native.enter="confirm" placeholder="例如1234567890"></el-input>
          </el-form-item>
          <el-form-item
            label="设定存储空间名"
            prop="bucket"
            :rules="{
              required: true, message: 'Bucket不能为空', trigger: 'blur'
            }">
            <el-input v-model="form.bucket" @keyup.native.enter="confirm" placeholder="Bucket"></el-input>
          </el-form-item>
          <el-form-item
            label="确认存储区域"
            prop="area"
            :rules="{
              required: true, message: '区域代码不能为空', trigger: 'blur'
            }">
            <el-input v-model="form.area" @keyup.native.enter="confirm" placeholder="例如tj"></el-input>
          </el-form-item>
          <el-form-item
            label="指定存储路径"
            >
            <el-input v-model="form.path" @keyup.native.enter="confirm" placeholder="例如img/"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="confirm">确定</el-button>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>
  </div>
</template>
<script>
import mixin from '../mixin'
export default {
  name: 'tcyun',
  mixins: [mixin],
  data () {
    return {
      form: {
        secretId: '',
        secretKey: '',
        bucket: '',
        appId: '',
        area: '',
        path: ''
      }
    }
  },
  created () {
    const config = this.$db.get('picBed.tcyun').value()
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
          this.$db.set('picBed.tcyun', this.form).write()
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
.view-title
  color #eee
  font-size 20px
  text-align center
  margin 20px auto
#tcyun-view
  .el-form
    label  
      line-height 22px
      padding-bottom 0
      color #eee
    .el-button
      width 100%
      border-radius 19px
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