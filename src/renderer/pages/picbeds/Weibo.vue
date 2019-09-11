<template>
  <div id="weibo-view">
    <el-row :gutter="16">
      <el-col :span="16" :offset="4">
        <div class="view-title">
          微博图床设置
        </div>
        <el-form 
          ref="weiboForm"
          label-position="right"
          label-width="120px"
          size="small"
          :model="form">
          <el-form-item
            label="设定用户名"
            prop="username"
            :rules="{
              required: !chooseCookie, message: '用户名不能为空', trigger: 'blur'
            }">
            <el-input v-model="form.username" placeholder="用户名" @keyup.native.enter="confirm('weiboForm')" :disabled="chooseCookie"></el-input>
          </el-form-item>
          <el-form-item
            label="设定密码"
            prop="password"
            :rules="{required: !chooseCookie,messsage: '密码不能为空',trigger: 'blur'}">
            <el-input v-model="form.password" type="password" @keyup.native.enter="confirm('weiboForm')" placeholder="密码" :disabled="chooseCookie"></el-input>
          </el-form-item>
          <el-form-item
            label="使用Cookie上传"
          >
            <el-switch
              v-model="chooseCookie"
              active-text="cookie模式"
              @change="handleSwitchChange"
            ></el-switch>
            <i class="el-icon-question" @click="openWiki"></i>
          </el-form-item>
          <el-form-item
            label="设定Cookie"
            prop="cookie"
            :rules="{
              required: chooseCookie, message: '密码不能为空', trigger: 'blur'
            }">
            <el-input v-model="form.cookie" @keyup.native.enter="confirm('weiboForm')" placeholder="Cookie" :disabled="!chooseCookie"></el-input>
          </el-form-item>
          <el-form-item label="* 图片质量">
            <el-radio-group v-model="quality">
              <el-radio label="thumbnail">缩略图</el-radio>
              <el-radio label="mw690">中等尺寸</el-radio>
              <el-radio label="large">原图</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item>
            <el-button-group>
              <el-button type="primary" @click="confirm('weiboForm')" round>确定</el-button>
              <el-button type="success" @click="setDefaultPicBed('weibo')" round :disabled="defaultPicBed === 'weibo'">设为默认图床</el-button>
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
  name: 'weibo',
  mixins: [mixin],
  data () {
    return {
      form: {
        username: '',
        password: '',
        cookie: ''
      },
      chooseCookie: false,
      quality: 'large'
    }
  },
  created () {
    const config = this.$db.get('picBed.weibo')
    if (config) {
      this.form.username = config.username
      this.form.password = config.password
      this.quality = config.quality || 'large'
      this.form.cookie = config.cookie
      this.chooseCookie = config.chooseCookie
    }
  },
  methods: {
    confirm (formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          this.$db.set('picBed.weibo', {
            username: this.form.username,
            password: this.form.password,
            quality: this.quality,
            cookie: this.form.cookie,
            chooseCookie: this.chooseCookie
          })
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
    handleSwitchChange () {
      this.$refs['weiboForm'].resetFields()
    },
    openWiki () {
      this.$electron.remote.shell.openExternal('https://picgo.github.io/PicGo-Doc/zh/guide/config.html#微博图床')
    }
  }
}
</script>
<style lang='stylus'>
.el-message
  left 60%
#weibo-view
  .el-form
    label  
      line-height 22px
      padding-bottom 0
      color #eee
    .el-button-group
      width 100%
      .el-button
        width 50%
    .el-input__inner
      border-radius 19px
    .el-radio-group
      margin-left 25px
    .el-switch__label
      color #eee
      &.is-active
        color #409EFF
    .el-icon-question
      font-size 20px
      float right
      margin-top 9px
      color #eee
      cursor pointer
      transition .2s color ease-in-out
      &:hover
        color #409EFF
</style>