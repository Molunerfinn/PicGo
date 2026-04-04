import { useEffect, useRef } from 'react'
import { IRPCActionType } from '~/universal/types/enum'
import { ipc } from '@/utils/bridge'

type IPCListener = BridgeIpcListener
type IPCCleanup = BridgeIpcCleanup

export function useIPCOn (channel: string, listener: IPCListener) {
  // Subscribe to an IPC channel for the lifetime of the current component.
  useEffect(() => {
    const cleanup = ipc.on(channel, listener)

    return cleanup
  }, [channel, listener])
}

export function useIPCOnce (channel: string, listener: IPCListener) {
  // Subscribe once to an IPC channel and always clean up the listener on unmount.
  useEffect(() => {
    const cleanup = ipc.once(channel, listener)

    return cleanup
  }, [channel, listener])
}

export function useIPC () {
  const cleanupRef = useRef<IPCCleanup[]>([])

  // Remove any IPC listeners that were registered through this hook on unmount.
  useEffect(() => {
    return () => {
      cleanupRef.current.forEach((cleanup) => {
        cleanup()
      })
      cleanupRef.current = []
    }
  }, [])

  return {
    on: (channel: IRPCActionType, listener: IPCListener) => {
      cleanupRef.current.push(ipc.on(channel, listener))
    },
    once: (channel: IRPCActionType, listener: IPCListener) => {
      cleanupRef.current.push(ipc.once(channel, listener))
    }
  }
}
