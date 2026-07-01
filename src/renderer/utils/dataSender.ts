import { GET_PICBEDS, OPEN_URL, PICGO_GET_CONFIG, PICGO_OPEN_FILE, PICGO_SAVE_CONFIG, RPC_ACTIONS } from '#/events/constants'
import { v4 as uuid } from 'uuid'
import { IRPCActionType } from '~/universal/types/enum'
import { ipc } from './bridge'

export async function saveConfig (_config: IObj | string, value?: any) {
  let config
  if (typeof _config === 'string') {
    config = {
      [_config]: value
    }
  } else {
    config = _config
  }
  await ipc.invoke(PICGO_SAVE_CONFIG, config)
}

export function getConfig<T> (key?: string): Promise<T | undefined> {
  return new Promise((resolve) => {
    const callbackId = uuid()
    let cleanup = () => {}
    const callback = (config: T | undefined, returnCallbackId: string) => {
      if (returnCallbackId === callbackId) {
        resolve(config)
        cleanup()
      }
    }
    cleanup = ipc.on(PICGO_GET_CONFIG, callback)
    ipc.send(PICGO_GET_CONFIG, key, callbackId)
  })
}

export function getPicBeds (): Promise<IPicBedType[]> {
  return new Promise((resolve) => {
    ipc.once(GET_PICBEDS, (picBeds: IPicBedType[]) => {
      resolve(picBeds)
    })
    ipc.send(GET_PICBEDS)
  })
}

/**
 * Invoke an RPC action and await its return value.
 *
 * This uses `bridgeApi.ipc.invoke(RPC_ACTIONS, action, args)` which is backed by
 * `ipcMain.handle(RPC_ACTIONS, ...)` in the main process RPC server.
 */
export function invokeRPC<T> (action: IRPCActionType, ...args: any[]): Promise<IRPCResult<T>> {
  return ipc.invoke<IRPCResult<T>>(RPC_ACTIONS, action, args)
}

/**
 * send a rpc request & do not need to wait for the response
 *
 * or the response will be handled by other listener
 */
export function sendRPC (action: IRPCActionType, ...args: any[]): void {
  ipc.send(RPC_ACTIONS, action, args)
}

/**
 * @deprecated will be replaced by sendRPC in the future
 */
export function sendToMain (channel: string, ...args: any[]) {
  ipc.send(channel, ...args)
}

export function openFile (fileName: string) {
  sendToMain(PICGO_OPEN_FILE, fileName)
}

export function openURL (url: string) {
  sendToMain(OPEN_URL, url)
}
