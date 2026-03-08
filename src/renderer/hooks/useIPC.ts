import { useEffect, useRef } from 'react'
import { ipcRenderer } from 'electron'
import { IRPCActionType } from '~/universal/types/enum'

type IPCListener = Parameters<typeof ipcRenderer.on>[1]
type IPCCleanup = () => void

export function useIPCOn (channel: string, listener: IPCListener) {
  // Subscribe to an IPC channel for the lifetime of the current component.
  useEffect(() => {
    ipcRenderer.on(channel, listener)

    return () => {
      ipcRenderer.removeListener(channel, listener)
    }
  }, [channel, listener])
}

export function useIPCOnce (channel: string, listener: IPCListener) {
  // Subscribe once to an IPC channel and always clean up the listener on unmount.
  useEffect(() => {
    ipcRenderer.once(channel, listener)

    return () => {
      ipcRenderer.removeListener(channel, listener)
    }
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
      ipcRenderer.on(channel, listener)
      cleanupRef.current.push(() => {
        ipcRenderer.removeListener(channel, listener)
      })
    },
    once: (channel: IRPCActionType, listener: IPCListener) => {
      ipcRenderer.once(channel, listener)
      cleanupRef.current.push(() => {
        ipcRenderer.removeListener(channel, listener)
      })
    }
  }
}
