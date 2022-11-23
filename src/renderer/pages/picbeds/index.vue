<template>
  <div id="others-view">
    <el-row :gutter="20" class="setting-list">
      <el-col :span="20" :offset="2">
        <div class="view-title">
          {{ picBedName }} {{ $T('SETTINGS') }}
        </div>
        <config-form
          v-if="config.length > 0"
          :config="config"
          type="uploader"
          ref="configForm"
          :id="type"
        >
          <el-form-item>
            <el-button class="confirm-btn" type="primary" @click="handleConfirm" round>{{ $T('CONFIRM') }}</el-button>
          </el-form-item>
        </config-form>
        <div v-else class="single">
          <div class="notice">{{ $T('SETTINGS_NOT_CONFIG_OPTIONS') }}</div>
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
import { completeUploaderMetaConfig } from '@/utils/uploader'
import { trimValues } from '@/utils/common'

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
      const configListConfigPath = `uploader.${this.type}.configList`
      const configList = await this.getConfig<IStringKeyMap[]>(configListConfigPath)
      // Finds the specified item from the config array and modifies it
      const existItem = configList?.find(item => item._id === result._id)
      // edit
      if (existItem) {
        Object.assign(existItem, trimValues(result), {
          _updatedAt: Date.now()
        })
      } else { // add new
        configList?.push(trimValues(completeUploaderMetaConfig(result)))
      }

      await this.saveConfig(configListConfigPath, configList)
      existItem && await this.shouldUpdateDefaultConfig(existItem)

      const successNotification = new Notification(this.$T('SETTINGS_RESULT'), {
        body: this.$T('TIPS_SET_SUCCEED')
      })
      successNotification.onclick = () => {
        return true
      }
      this.$router.back()
    }
  }

  shouldUpdateDefaultConfig (item: IStringKeyMap) {
    const curDefaultConfigId = this.$route.query.defaultConfigId
    if (item._id === curDefaultConfigId) {
      this.saveConfig(`picBed.${this.type}`, item)
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
  .confirm-btn
    width: 250px
  .el-form
    label
      line-height 22px
      padding-bottom 0
      color #eee
    &-item
      margin-bottom 11px
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
