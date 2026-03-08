import { ipcRenderer } from 'electron'
import { CLOSE_WINDOW, MAXIMIZE_WINDOW, MINIMIZE_WINDOW, WINDOW_STATE_CHANGED } from '#/events/constants'
import { IRPCActionType } from '~/universal/types/enum'
import { invokeRPC, sendToMain } from '@/utils/dataSender'

export const windowControlsAdapter = {
  async getWindowState () {
    const result = await invokeRPC<{ isMaximized: boolean }>(IRPCActionType.GET_WINDOW_STATE)
    if (!result.success) {
      throw new Error(result.error || 'Failed to get window state')
    }

    return result.data
  },
  subscribeToWindowState (listener: (state: { isMaximized: boolean }) => void) {
    const handler = (_event: Electron.IpcRendererEvent, state: { isMaximized: boolean }) => {
      listener(state)
    }

    ipcRenderer.on(WINDOW_STATE_CHANGED, handler)
    return () => {
      ipcRenderer.removeListener(WINDOW_STATE_CHANGED, handler)
    }
  },
  closeWindow () {
    sendToMain(CLOSE_WINDOW)
  },
  maximizeWindow () {
    sendToMain(MAXIMIZE_WINDOW)
  },
  minimizeWindow () {
    sendToMain(MINIMIZE_WINDOW)
  }
}
