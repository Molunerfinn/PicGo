import { GET_PICBEDS, OPEN_URL, PICGO_GET_CONFIG, PICGO_OPEN_FILE, PICGO_SAVE_CONFIG, RPC_ACTIONS } from '#/events/constants'
import { IpcRendererEvent, ipcRenderer } from 'electron'
import { v4 as uuid } from 'uuid'
import { IRPCActionType } from '~/universal/types/enum'

export async function saveConfig (_config: IObj | string, value?: any) {
  let config
  if (typeof _config === 'string') {
    config = {
      [_config]: value
    }
  } else {
    config = _config
  }
  await ipcRenderer.invoke(PICGO_SAVE_CONFIG, config)
}

export function getConfig<T> (key?: string): Promise<T | undefined> {
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

export function getPicBeds (): Promise<IPicBedType[]> {
  return new Promise((resolve) => {
    ipcRenderer.once(GET_PICBEDS, (_event: IpcRendererEvent, picBeds: IPicBedType[]) => {
      resolve(picBeds)
    })
    ipcRenderer.send(GET_PICBEDS)
  })
}

/**
 * Invoke an RPC action and await its return value.
 *
 * This uses `ipcRenderer.invoke(RPC_ACTIONS, action, args)` which is backed by
 * `ipcMain.handle(RPC_ACTIONS, ...)` in the main process RPC server.
 */
export function invokeRPC<T> (action: IRPCActionType, ...args: any[]): Promise<IRPCResult<T>> {
  return ipcRenderer.invoke(RPC_ACTIONS, action, args) as Promise<IRPCResult<T>>
}

/**
 * send a rpc request & do not need to wait for the response
 *
 * or the response will be handled by other listener
 */
export function sendRPC (action: IRPCActionType, ...args: any[]): void {
  ipcRenderer.send(RPC_ACTIONS, action, args)
}

/**
 * @deprecated will be replaced by sendRPC in the future
 */
export function sendToMain (channel: string, ...args: any[]) {
  ipcRenderer.send(channel, ...args)
}

export function openFile (fileName: string) {
  sendToMain(PICGO_OPEN_FILE, fileName)
}

export function openURL (url: string) {
  sendToMain(OPEN_URL, url)
}
