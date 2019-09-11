<template>
  <div id="aliyun-view">
    <el-row :gutter="16">
      <el-col :span="16" :offset="4">
        <div class="view-title">
          阿里云OSS设置
        </div>
        <el-form 
          ref="aliyun"
          label-position="right"
          label-width="120px"
          :model="form"
          size="mini">
          <el-form-item
            label="设定KeyId"
            prop="accessKeyId"
            :rules="{
              required: true, message: 'AccessKeyId不能为空', trigger: 'blur'
            }">
            <el-input v-model="form.accessKeyId" placeholder="AccessKeyId" @keyup.native.enter="confirm"></el-input>
          </el-form-item>
          <el-form-item
            label="设定KeySecret"
            prop="accessKeySecret"
            :rules="{
              required: true, message: 'AccessKeySecret不能为空', trigger: 'blur'
            }">
            <el-input v-model="form.accessKeySecret" type="password" @keyup.native.enter="confirm" placeholder="AccessKeySecret"></el-input>
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
            <el-input v-model="form.area" @keyup.native.enter="confirm" placeholder="例如oss-cn-beijing"></el-input>
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
              <el-button type="success" @click="setDefaultPicBed('aliyun')" round :disabled="defaultPicBed === 'aliyun'">设为默认图床</el-button>
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
  mixins: [mixin],
  name: 'aliyun',
  data () {
    return {
      form: {
        accessKeyId: '',
        accessKeySecret: '',
        bucket: '',
        area: '',
        path: '',
        customUrl: ''
      }
    }
  },
  created () {
    const config = this.$db.get('picBed.aliyun')
    if (config) {
      for (let i in config) {
        this.form[i] = config[i]
      }
    }
  },
  methods: {
    confirm () {
      this.$refs.aliyun.validate((valid) => {
        if (valid) {
          this.$db.set('picBed.aliyun', this.form).write()
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
#aliyun-view
  .el-form
    label  
      line-height 22px
      padding-bottom 0
      color #eee
    .el-input__inner
      border-radius 19px
    &-item
      margin-bottom 10.5px
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