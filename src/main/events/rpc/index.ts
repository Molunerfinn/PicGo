import { ipcMain, IpcMainEvent } from 'electron'
import { IRPCActionType } from '~/universal/types/enum'
import { RPC_ACTIONS } from '#/events/constants'
import {
  deleteUploaderConfig,
  getUploaderConfigList,
  selectUploaderConfig,
  updateUploaderConfig
} from '~/universal/utils/handleUploaderConfig'

class RPCServer {
  start () {
    ipcMain.on(RPC_ACTIONS, (event: IpcMainEvent, action: IRPCActionType, args: any[], callbackId: string) => {
      try {
        switch (action) {
          case IRPCActionType.GET_PICBED_CONFIG_LIST: {
            const configList = this.getPicBedConfigList(args as IGetUploaderConfigListArgs)
            this.sendBack(event, action, configList, callbackId)
            break
          }
          case IRPCActionType.DELETE_PICBED_CONFIG: {
            const res = this.deleteUploaderConfig(args as IDeleteUploaderConfigArgs)
            this.sendBack(event, action, res, callbackId)
            break
          }
          case IRPCActionType.SELECT_UPLOADER: {
            this.selectUploaderConfig(args as ISelectUploaderConfigArgs)
            this.sendBack(event, action, true, callbackId)
            break
          }
          case IRPCActionType.UPDATE_UPLOADER_CONFIG: {
            this.updateUploaderConfig(args as IUpdateUploaderConfigArgs)
            this.sendBack(event, action, true, callbackId)
            break
          }
          default: {
            this.sendBack(event, action, null, callbackId)
            break
          }
        }
      } catch (e) {
        this.sendBack(event, action, null, callbackId)
      }
    })
  }

  /**
   * if sendback data is null, then it means that the action is not supported or error occurs
   */
  private sendBack (event: IpcMainEvent, action: IRPCActionType, data: any, callbackId: string) {
    event.sender.send(RPC_ACTIONS, data, action, callbackId)
  }

  private getPicBedConfigList (args: IGetUploaderConfigListArgs) {
    const [type] = args
    const config = getUploaderConfigList(type)
    return config
  }

  private deleteUploaderConfig (args: IDeleteUploaderConfigArgs) {
    const [type, id] = args
    const config = deleteUploaderConfig(type, id)
    return config
  }

  private selectUploaderConfig (args: ISelectUploaderConfigArgs) {
    const [type, id] = args
    const config = selectUploaderConfig(type, id)
    return config
  }

  private updateUploaderConfig (args: IUpdateUploaderConfigArgs) {
    const [type, id, config] = args
    const res = updateUploaderConfig(type, id, config)
    return res
  }
}

const rpcServer = new RPCServer()

export {
  rpcServer
}
