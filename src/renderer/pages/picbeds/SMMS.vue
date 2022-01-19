<template>
  <div id="smms-view">
    <el-row :gutter="16">
      <el-col :span="16" :offset="4">
        <div class="view-title">
          SM.MS设置
        </div>
        <el-form
          ref="smms"
          label-position="right"
          label-width="120px"
          :model="form"
          size="mini">
          <el-form-item
            label="设定Token"
            prop="token"
            :rules="{
              required: true, message: 'Token不能为空', trigger: 'blur'
            }">
            <el-input v-model="form.token" type="password" placeholder="token" @keyup.native.enter="confirm"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button-group>
              <el-button type="primary" @click="confirm" round>确定</el-button>
              <el-button type="success" @click="setDefaultPicBed('smms')" round :disabled="defaultPicBed === 'smms'">设为默认图床</el-button>
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
  name: 'smms',
  mixins: [mixin]
})
export default class extends Vue {
  form: ISMMSConfig = {
    token: ''
  }

  async created () {
    const config = await this.getConfig<string | boolean>('picBed.smms.token')
    if (typeof config !== 'boolean') {
      this.form.token = config || ''
    }
  }

  confirm () {
    // @ts-ignore
    this.$refs.smms.validate((valid) => {
      if (valid) {
        this.saveConfig({
          'picBed.smms': this.form
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
}
</script>
<style lang='stylus'>
#smms-view
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
