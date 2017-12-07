<template>
  <div id="weibo-view">
    <el-row :gutter="16">
      <el-col :span="12" :offset="6">
        <div class="view-title">
          微博图床设置
        </div>
        <el-form 
          ref="weiboForm"
          label-position="top"
          label-width="80px"
          :model="form">
          <el-form-item
            label="设定用户名"
            prop="username"
            :rules="{
              required: true, message: '用户名不能为空', trigger: 'blur'
            }">
            <el-input v-model="form.username" placeholder="用户名" @keyup.native.enter="confirm('weiboForm')"></el-input>
          </el-form-item>
          <el-form-item
            label="设定密码"
            prop="password"
            :rules="{
              required: true, message: '密码不能为空', trigger: 'blur'
            }">
            <el-input v-model="form.password" type="password" @keyup.native.enter="confirm('weiboForm')" placeholder="密码"></el-input>
          </el-form-item>
          <el-form-item label="* 图片质量">
            <el-radio-group v-model="quality">
              <el-radio label="thumbnail">缩略图</el-radio>
              <el-radio label="mw690">中等尺寸</el-radio>
              <el-radio label="large">原图</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="confirm('weiboForm')" round>确定</el-button>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>
  </div>
</template>
<script>
import mixin from '../mixin'
export default {
  name: 'weibo',
  mixins: [mixin],
  data () {
    return {
      form: {
        username: '',
        password: ''
      },
      quality: 'large'
    }
  },
  created () {
    const config = this.$db.read().get('picBed.weibo').value()
    if (config) {
      this.form.username = config.username
      this.form.password = config.password
      this.quality = config.quality || 'large'
    }
  },
  methods: {
    confirm (formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          this.$db.read().set('picBed.weibo', {
            username: this.form.username,
            password: this.form.password,
            quality: this.quality
          }).write()
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
.el-message
  left 60%
.view-title
  color #eee
  font-size 20px
  text-align center
  margin 20px auto
#weibo-view
  .el-form
    label  
      line-height 22px
      padding-bottom 0
      color #eee
    .el-button
      width 100%
    .el-input__inner
      border-radius 19px
    .el-radio-group
      margin-left 25px
</style>