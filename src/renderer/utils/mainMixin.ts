import { Component, Vue } from 'vue-property-decorator'
import { ipcRenderer } from 'electron'
@Component
export default class extends Vue {
  letPicGoSaveData (data: IObj) {
    ipcRenderer.send('picgoSaveData', data)
  }
}
