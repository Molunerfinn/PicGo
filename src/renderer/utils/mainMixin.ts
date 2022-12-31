import { Component, Vue } from 'vue-property-decorator'
import { ipcRenderer, IpcRendererEvent } from 'electron'
import { PICGO_SAVE_CONFIG, PICGO_GET_CONFIG, FORCE_UPDATE, RPC_ACTIONS } from '#/events/constants'
import { uuid } from 'uuidv4'
import { IRPCActionType } from '~/universal/types/enum'
@Component
export default class extends Vue {
  created () {
    this.$bus.$on(FORCE_UPDATE, () => {
      this.$forceUpdate()
    })
  }

  // support string key + value or object config
  saveConfig (config: IObj | string, value?: any) {
    if (typeof config === 'string') {
      config = {
        [config]: value
      }
    }
    ipcRenderer.send(PICGO_SAVE_CONFIG, config)
  }

  getConfig<T> (key?: string): Promise<T | undefined> {
    return new Promise((resolve) => {
      const callbackId = uuid()
      const callback = (event: IpcRendererEvent, config: T | undefined, returnCallbackId: string) => {
        if (returnCallbackId === callbackId) {
          resolve(config)
          ipcRenderer.removeListener(PICGO_GET_CONFIG, callback)
        }
      }
      ipcRenderer.on(PICGO_GET_CONFIG, callback)
      ipcRenderer.send(PICGO_GET_CONFIG, key, callbackId)
    })
  }

  /**
   * trigger RPC action
   */
  triggerRPC<T> (action: IRPCActionType, ...args: any[]): Promise<T | undefined> {
    return new Promise((resolve) => {
      const callbackId = uuid()
      const callback = (event: IpcRendererEvent, data: T | undefined, returnActionType: IRPCActionType, returnCallbackId: string) => {
        if (returnCallbackId === callbackId && returnActionType === action) {
          resolve(data)
          ipcRenderer.removeListener(RPC_ACTIONS, callback)
        }
      }
      ipcRenderer.on(RPC_ACTIONS, callback)
      ipcRenderer.send(RPC_ACTIONS, action, args, callbackId)
    })
  }

  forceUpdate () {
    this.$bus.$emit(FORCE_UPDATE)
  }

  sendToMain (channel: string, ...args: any[]) {
    ipcRenderer.send(channel, ...args)
  }
}
