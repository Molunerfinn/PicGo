<template>
  <div id="others-view">
    <el-row :gutter="16">
      <el-col :span="16" :offset="4">
        <div class="view-title">
          {{ picBedName }}设置
        </div>
        <config-form
          v-if="config.length > 0"
          :config="config"
          type="uploader"
          ref="configForm"
          :id="type"
        >
          <el-form-item>
            <el-button-group>
              <el-button type="primary" @click="handleConfirm" round>确定</el-button>
              <el-button type="success" @click="setDefaultPicBed(type)" round :disabled="defaultPicBed === type">设为默认图床</el-button>
            </el-button-group>
          </el-form-item>
        </config-form>
        <div v-else class="single">
          <div class="notice">暂无配置项</div>
          <el-button type="success" @click="setDefaultPicBed(type)" round :disabled="defaultPicBed === type" size="mini">设为默认图床</el-button>
        </div>
      </el-col>
    </el-row>
  </div>
</template>
<script>
import ConfigForm from '@/components/ConfigForm'
import mixin from '@/utils/ConfirmButtonMixin'
export default {
  name: 'OtherPicBed',
  mixins: [mixin],
  components: {
    ConfigForm
  },
  data () {
    return {
      type: '',
      config: [],
      picBedName: ''
    }
  },
  created () {
    this.type = this.$route.params.type
    this.$electron.ipcRenderer.send('getPicBedConfig', this.$route.params.type)
    this.$electron.ipcRenderer.on('getPicBedConfig', this.getPicBeds)
  },
  methods: {
    async handleConfirm () {
      const result = await this.$refs.configForm.validate()
      if (result !== false) {
        this.$db.set(`picBed.${this.type}`, result)
        const successNotification = new window.Notification('设置结果', {
          body: '设置成功'
        })
        successNotification.onclick = () => {
          return true
        }
      }
    },
    setDefaultPicBed (type) {
      this.$db.set('picBed.current', type)
      this.defaultPicBed = type
      const successNotification = new window.Notification('设置默认图床', {
        body: '设置成功'
      })
      successNotification.onclick = () => {
        return true
      }
    },
    getPicBeds (event, config, name) {
      this.config = config
      this.picBedName = name
    }
  },
  beforeDestroy () {
    this.$electron.ipcRenderer.removeListener('getPicBedConfig', this.getPicBeds)
  }
}
</script>
<style lang='stylus'>
#others-view
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
  .notice
    color #eee
    text-align center
    margin-bottom 10px
  .single
    text-align center
</style>