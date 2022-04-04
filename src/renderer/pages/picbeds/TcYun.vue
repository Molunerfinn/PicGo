<template>
  <div id="tcyun-view">
    <el-row :gutter="16" class="setting-list-scroll">
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
            label="COS版本"
          >
            <el-switch
              v-model="form.version"
              active-text="v4"
              inactive-text="v5"
              active-value="v4"
              inactive-value="v5"
              inactive-color="#67C23A"
            ></el-switch>
            <i class="el-icon-question" @click="openWiki"></i>
          </el-form-item>
          <el-form-item
            label="设定SecretId"
            prop="secretId"
            :rules="{
              required: true, message: 'SecretId不能为空', trigger: 'blur'
            }">
            <el-input v-model="form.secretId" placeholder="SecretId" @keyup.native.enter="confirm"></el-input>
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
          <el-form-item
            label="设定自定义域名"
            >
            <el-input v-model="form.customUrl" @keyup.native.enter="confirm" placeholder="例如https://xxxx.com"></el-input>
          </el-form-item>
          <el-form-item
            label="设定网址后缀"
            >
            <el-input v-model="form.options" @keyup.native.enter="confirm" placeholder="例如?imageMogr2"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button-group>
              <el-button type="primary" @click="confirm" round>确定</el-button>
              <el-button type="success" @click="setDefaultPicBed('tcyun')" round :disabled="defaultPicBed === 'tcyun'">设为默认图床</el-button>
            </el-button-group>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>
  </div>
</template>
<script lang="ts">
import { ipcRenderer } from 'electron'
import { Component, Vue } from 'vue-property-decorator'
import mixin from '@/utils/ConfirmButtonMixin'
import { OPEN_URL } from '#/events/constants'
import { ITcyunConfig } from 'picgo/dist/types'
@Component({
  name: 'tcyun',
  mixins: [mixin]
})
export default class extends Vue {
  form: ITcyunConfig = {
    secretId: '',
    secretKey: '',
    bucket: '',
    appId: '',
    area: '',
    path: '',
    customUrl: '',
    version: 'v5',
    options: ''
  }

  async created () {
    const config = await this.getConfig<ITcyunConfig>('picBed.tcyun')
    if (config) {
      this.form = Object.assign({}, config)
    }
  }

  confirm () {
    // @ts-ignore
    this.$refs.tcyun.validate((valid) => {
      if (valid) {
        this.saveConfig({
          'picBed.tcyun': this.form
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
  }

  openWiki () {
    ipcRenderer.send(OPEN_URL, 'https://picgo.github.io/PicGo-Doc/zh/guide/config.html#%E8%85%BE%E8%AE%AF%E4%BA%91cos')
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
