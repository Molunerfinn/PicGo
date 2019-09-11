<template>
  <div id="qiniu-view">
    <el-row :gutter="16">
      <el-col :span="16" :offset="4">
        <div class="view-title">
          七牛图床设置
        </div>
        <el-form 
          ref="qiniu"
          label-position="right"
          label-width="120px"
          :model="form"
          size="mini">
          <el-form-item
            label="设定AccessKey"
            prop="accessKey"
            :rules="{
              required: true, message: 'AccessKey不能为空', trigger: 'blur'
            }">
            <el-input v-model="form.accessKey" placeholder="AccessKey" @keyup.native.enter="confirm('weiboForm')"></el-input>
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
            label="设定存储空间名"
            prop="bucket"
            :rules="{
              required: true, message: 'Bucket不能为空', trigger: 'blur'
            }">
            <el-input v-model="form.bucket" @keyup.native.enter="confirm" placeholder="Bucket"></el-input>
          </el-form-item>
          <el-form-item
            label="设定访问网址"
            prop="url"
            :rules="{
              required: true, message: '网址不能为空', trigger: 'blur'
            }">
            <el-input v-model="form.url" @keyup.native.enter="confirm" placeholder="例如：http://xxx.yyy.glb.clouddn.com"></el-input>
          </el-form-item>
          <el-form-item
            label="确认存储区域"
            :rules="{
              required: true, message: '区域代码不能为空', trigger: 'blur'
            }">
            <el-input v-model="form.area" placeholder="例如z0"></el-input>
          </el-form-item>
          <el-form-item
            label="设定网址后缀"
            >
            <el-input v-model="form.options" @keyup.native.enter="confirm" placeholder="例如?imageslim"></el-input>
          </el-form-item>
          <el-form-item
            label="指定存储路径"
            >
            <el-input v-model="form.path" @keyup.native.enter="confirm" placeholder="例如img/"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button-group>
              <el-button type="primary" @click="confirm" round>确定</el-button>
              <el-button type="success" @click="setDefaultPicBed('qiniu')" round :disabled="defaultPicBed === 'qiniu'">设为默认图床</el-button>
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
  name: 'qiniu',
  data () {
    return {
      form: {
        accessKey: '',
        secretKey: '',
        bucket: '',
        url: '',
        area: '',
        options: '',
        path: ''
      }
    }
  },
  created () {
    const config = this.$db.get('picBed.qiniu')
    if (config) {
      for (let i in config) {
        this.form[i] = config[i]
      }
    }
  },
  methods: {
    confirm () {
      this.$refs.qiniu.validate((valid) => {
        if (valid) {
          this.$db.set('picBed.qiniu', this.form).write()
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
#qiniu-view
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
</style>