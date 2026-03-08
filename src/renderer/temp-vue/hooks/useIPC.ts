import { ipcRenderer } from 'electron'
import { onUnmounted } from 'vue'
import { IRPCActionType } from '~/universal/types/enum'

export const useIPCOn = (channel: string, listener: IpcRendererListener) => {
  ipcRenderer.on(channel, listener)

  onUnmounted(() => {
    ipcRenderer.removeListener(channel, listener)
  })
}

export const useIPCOnce = (channel: string, listener: IpcRendererListener) => {
  ipcRenderer.once(channel, listener)

  onUnmounted(() => {
    ipcRenderer.removeListener(channel, listener)
  })
}

/**
 * will auto removeListener when component unmounted
 */
export const useIPC = () => {
  return {
    on: (channel: IRPCActionType, listener: IpcRendererListener) => useIPCOn(channel, listener),
    once: (channel: IRPCActionType, listener: IpcRendererListener) => useIPCOnce(channel, listener)
  }
}
