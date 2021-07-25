import { Component, Vue } from 'vue-property-decorator'
import { ipcRenderer } from 'electron'
import { IConfig } from 'picgo/dist/src/types'
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
    const successNotification = new Notification('设置默认图床', {
      body: '设置成功'
    })
    successNotification.onclick = () => {
      return true
    }
  }
}
