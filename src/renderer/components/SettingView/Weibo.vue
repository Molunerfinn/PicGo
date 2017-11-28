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
            <el-input v-model="form.username" placeholder="用户名"></el-input>
          </el-form-item>
          <el-form-item
            label="设定密码"
            prop="password"
            :rules="{
              required: true, message: '密码不能为空', trigger: 'blur'
            }">
            <el-input v-model="form.password" type="password" placeholder="密码"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="confirm('weiboForm')">确定</el-button>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>
  </div>
</template>
<script>
export default {
  name: 'weibo',
  data () {
    return {
      form: {
        username: '',
        password: ''
      }
    }
  },
  created () {
    const account = this.$db.get('picBed.weibo').value()
    console.log(account)
    if (account) {
      this.form.username = account.username
      this.form.password = account.password
    }
  },
  methods: {
    confirm (formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          this.$db.set('picBed.weibo', {
            username: this.form.username,
            password: this.form.password
          }).write()
          console.log(this.$db.get('picBed.weibo').value())
          this.$message({
            type: 'success',
            message: '设置成功'
          })
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
#weibo-view
  .view-title
    color #eee
    font-size 20px
    text-align center
    margin 20px auto
  .el-form
    label  
      line-height 22px
      padding-bottom 0
      color #eee
    .el-button
      width 100%
      margin-top 10px  
</style>