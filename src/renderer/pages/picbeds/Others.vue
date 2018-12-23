<template>
  <div id="others-view">
    <el-row :gutter="16">
      <el-col :span="16" :offset="4">
        <div class="view-title">
          {{ picBedName }}设置
        </div>
        <config-form
          :config="config"
          type="uploader"
          ref="configForm"
        >
          <el-form-item>
            <el-button-group>
              <el-button type="primary" @click="handleConfirm" round>确定</el-button>
              <el-button type="success" @click="setDefaultPicBed(type)" round :disabled="defaultPicBed === type">设为默认图床</el-button>
            </el-button-group>
          </el-form-item>
        </config-form>

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
  beforeRouteEnter (to, from, next) {
    next(vm => {
      vm.type = to.query.type
      vm.$electron.ipcRenderer.send('getPicBedConfig', to.query.type)
      vm.$electron.ipcRenderer.on('getPicBedConfig', (event, config, name) => {
        vm.config = config
        vm.picBedName = name
      })
    })
  },
  methods: {
    async handleConfirm () {
      const result = await this.$refs.configForm.validate()
      if (result !== false) {
        this.$db.read().set(`picBed.${this.type}`, result).write()
        const successNotification = new window.Notification('设置结果', {
          body: '设置成功'
        })
        successNotification.onclick = () => {
          return true
        }
      }
    },
    setDefaultPicBed (type) {
      this.$db.read().set('picBed.current', type).write()
      this.defaultPicBed = type
      this.$electron.ipcRenderer.send('updateDefaultPicBed', type)
      const successNotification = new window.Notification('设置默认图床', {
        body: '设置成功'
      })
      successNotification.onclick = () => {
        return true
      }
    }
  },
  beforeDestroy () {
    this.$electron.ipcRenderer.removeAllListeners('getPicBedConfig')
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
</style>