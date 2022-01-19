<template>
  <div id="others-view">
    <el-row :gutter="16" class="setting-list">
      <el-col :span="16" :offset="4">
        <div class="view-title">
          {{ picBedName }}{{ $T('SETTINGS') }}
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
              <el-button type="primary" @click="handleConfirm" round>{{ $T('CONFIRM') }}</el-button>
              <el-button type="success" @click="setDefaultPicBed(type)" round :disabled="defaultPicBed === type">{{ $T('SETTINGS_SET_DEFAULT_PICBED') }}</el-button>
            </el-button-group>
          </el-form-item>
        </config-form>
        <div v-else class="single">
          <div class="notice">{{ $T('SETTINGS_NOT_CONFIG_OPTIONS') }}</div>
          <el-button type="success" @click="setDefaultPicBed(type)" round :disabled="defaultPicBed === type" size="mini">{{ $T('SETTINGS_SET_DEFAULT_PICBED') }}</el-button>
        </div>
      </el-col>
    </el-row>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ConfigForm from '@/components/ConfigForm.vue'
import mixin from '@/utils/ConfirmButtonMixin'
import {
  ipcRenderer,
  IpcRendererEvent
} from 'electron'

@Component({
  name: 'OtherPicBed',
  mixins: [mixin],
  components: {
    ConfigForm
  }
})
export default class extends Vue {
  type: string = ''
  config: any[] = []
  picBedName: string = ''
  created () {
    this.type = this.$route.params.type
    ipcRenderer.send('getPicBedConfig', this.$route.params.type)
    ipcRenderer.on('getPicBedConfig', this.getPicBeds)
  }

  async handleConfirm () {
    // @ts-ignore
    const result = await this.$refs.configForm.validate()
    if (result !== false) {
      this.saveConfig({
        [`picBed.${this.type}`]: result
      })
      const successNotification = new Notification(this.$T('SETTINGS_RESULT'), {
        body: this.$T('TIPS_SET_SUCCEED')
      })
      successNotification.onclick = () => {
        return true
      }
    }
  }

  setDefaultPicBed (type: string) {
    this.saveConfig({
      'picBed.current': type,
      'picBed.uploader': type
    })
    // @ts-ignore 来自mixin的数据
    this.defaultPicBed = type
    const successNotification = new Notification(this.$T('SETTINGS_DEFAULT_PICBED'), {
      body: this.$T('TIPS_SET_SUCCEED')
    })
    successNotification.onclick = () => {
      return true
    }
  }

  getPicBeds (event: IpcRendererEvent, config: any[], name: string) {
    this.config = config
    this.picBedName = name
  }

  beforeDestroy () {
    ipcRenderer.removeListener('getPicBedConfig', this.getPicBeds)
  }
}
</script>
<style lang='stylus'>
#others-view
  .setting-list
    height 425px
    overflow-y auto
    overflow-x hidden
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
