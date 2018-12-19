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
<script>
import mixin from '@/utils/ConfirmButtonMixin'
export default {
  mixins: [mixin],
  name: 'upyun',
  data () {
    return {}
  },
  methods: {
    confirm () {
      this.$db.set('picBed.smms', true).write()
      this.setDefaultPicBed('smms')
      const successNotification = new window.Notification('设置结果', {
        body: '设置成功'
      })
      successNotification.onclick = () => {
        return true
      }
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
