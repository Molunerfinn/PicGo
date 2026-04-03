import { onUnmounted } from 'vue'
import { IRPCActionType } from '~/universal/types/enum'
import { ipc } from '@/utils/bridge'

export const useIPCOn = (channel: string, listener: BridgeIpcListener) => {
  const cleanup = ipc.on(channel, listener)

  onUnmounted(() => {
    cleanup()
  })
}

export const useIPCOnce = (channel: string, listener: BridgeIpcListener) => {
  const cleanup = ipc.once(channel, listener)

  onUnmounted(() => {
    cleanup()
  })
}

/**
 * will auto removeListener when component unmounted
 */
export const useIPC = () => {
  return {
    on: (channel: IRPCActionType, listener: BridgeIpcListener) => useIPCOn(channel, listener),
    once: (channel: IRPCActionType, listener: BridgeIpcListener) => useIPCOnce(channel, listener)
  }
}
