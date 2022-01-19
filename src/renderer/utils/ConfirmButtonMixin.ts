import { Component, Vue } from 'vue-property-decorator'
import { IConfig } from 'picgo'
@Component
export default class extends Vue {
  defaultPicBed = 'smms'
  async created () {
    const config = await this.getConfig<IConfig>()
    if (config) {
      this.defaultPicBed = config?.picBed?.uploader || config?.picBed?.current || 'smms'
    }
  }

  setDefaultPicBed (type: string) {
    this.saveConfig({
      'picBed.current': type,
      'picBed.uploader': type
    })
    this.defaultPicBed = type
    const successNotification = new Notification(this.$T('SETTINGS_DEFAULT_PICBED'), {
      body: this.$T('TIPS_SET_SUCCEED')
    })
    successNotification.onclick = () => {
      return true
    }
  }
}
