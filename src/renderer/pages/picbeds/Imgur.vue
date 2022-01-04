<template>
  <div id="imgur-view">
    <el-row :gutter="16">
      <el-col :span="16" :offset="4">
        <div class="view-title">
          Imgur图床设置
        </div>
        <el-form
          ref="imgur"
          label-position="right"
          label-width="120px"
          :model="form"
          size="mini">
          <el-form-item
            label="设定ClientId"
            prop="clientId"
            :rules="{
              required: true, message: 'ClientId不能为空', trigger: 'blur'
            }">
            <el-input v-model="form.clientId" placeholder="ClientId" @keyup.native.enter="confirm"></el-input>
          </el-form-item>
          <el-form-item
            label="设定代理"
            prop="proxy"
            >
            <el-input v-model="form.proxy" placeholder="例如：http://127.0.0.1:1080" @keyup.native.enter="confirm"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button-group>
              <el-button type="primary" @click="confirm" round>确定</el-button>
              <el-button type="success" @click="setDefaultPicBed('imgur')" round :disabled="defaultPicBed === 'imgur'">设为默认图床</el-button>
            </el-button-group>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import mixin from '@/utils/ConfirmButtonMixin'
@Component({
  name: 'imgur',
  mixins: [mixin]
})
export default class extends Vue {
  form: IImgurConfig = {
    clientId: '',
    proxy: ''
  }

  async created () {
    const config = await this.getConfig<IImgurConfig>('picBed.imgur')
    if (config) {
      this.form = Object.assign({}, config)
    }
  }

  confirm () {
    // @ts-ignore
    this.$refs.imgur.validate((valid) => {
      if (valid) {
        this.saveConfig({
          'picBed.imgur': this.form
        })
        const successNotification = new Notification('设置结果', {
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
</script>
<style lang='stylus'>
#imgur-view
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
