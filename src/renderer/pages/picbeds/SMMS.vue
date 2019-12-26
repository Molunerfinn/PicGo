<template>
  <div id="smms-view">
    <el-row :gutter="16">
      <el-col :span="16" :offset="4">
        <div class="view-title">
          SM.MS设置
        </div>
        <div class="content">
          感谢SM.MS提供的优质服务
        </div>
        <div style="text-align: center; margin-top: 20px;">
          <el-button type="success" @click="confirm" round :disabled="defaultPicBed === 'smms'" size="mini">设为默认图床</el-button>
        </div>
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
  confirm () {
    this.letPicGoSaveData({
      'picBed.smms': true
    })
    // @ts-ignore 来自mixin
    this.setDefaultPicBed('smms')
    const successNotification = new window.Notification('设置结果', {
      body: '设置成功'
    })
    successNotification.onclick = () => {
      return true
    }
  }
}
</script>
<style lang='stylus'>
#smms-view
  .content
    text-align center
    font-size 14px
    color #eee
</style>
