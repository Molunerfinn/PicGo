<template>
  <div id="smms-view">
    <el-row :gutter="16">
      <el-col :span="16" :offset="4">
        <div class="view-title">
          SM.MS设置
        </div>
        <div style="text-align: center; margin-top: 20px;">
          <el-button type="success" @click="confirm" round :disabled="defaultPicBed === 'smms'" size="mini">设为默认图床</el-button>
        </div>
      </el-col>
    </el-row>
  </div>
</template>
<script>
import mixin from '../mixin'
export default {
  name: 'upyun',
  mixins: [mixin],
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
.view-title
  color #eee
  font-size 20px
  text-align center
  margin 20px auto
</style>
