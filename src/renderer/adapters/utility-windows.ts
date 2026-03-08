import { ipcRenderer } from 'electron'
import { GET_RENAME_FILE_NAME, OPEN_WINDOW, PASTE_TEXT, RENAME_FILE_NAME, SET_MINI_WINDOW_POS, SHOW_MINI_PAGE_MENU } from '#/events/constants'
import { IRPCActionType, IToolboxItemType, IWindowList } from '~/universal/types/enum'
import { getRawData } from '@/utils/common'
import { invokeRPC, sendRPC, sendToMain } from '@/utils/dataSender'

export const utilityWindowsAdapter = {
  openMainWindow () {
    sendToMain(OPEN_WINDOW, IWindowList.SETTING_WINDOW)
  },
  uploadClipboardFiles () {
    sendToMain('uploadClipboardFiles')
  },
  subscribeTrayFiles (listeners: {
    onClipboardFiles?: (files: ImgInfo[]) => void
    onDragFiles?: () => Promise<void> | void
    onUploadFiles?: () => Promise<void> | void
    onUpdateFiles?: () => Promise<void> | void
  }) {
    const disposers: Array<() => void> = []

    const register = <T extends unknown[]>(channel: string, listener?: (...args: T) => Promise<void> | void) => {
      if (!listener) {
        return
      }

      const handler = (_event: Electron.IpcRendererEvent, ...args: T) => {
        void listener(...args)
      }

      ipcRenderer.on(channel, handler)
      disposers.push(() => {
        ipcRenderer.removeListener(channel, handler)
      })
    }

    register('clipboardFiles', listeners.onClipboardFiles)
    register('dragFiles', listeners.onDragFiles)
    register('uploadFiles', listeners.onUploadFiles)
    register('updateFiles', listeners.onUpdateFiles)

    return () => {
      disposers.forEach((dispose) => dispose())
    }
  },
  copyLink (item: ImgInfo) {
    return ipcRenderer.invoke(PASTE_TEXT, getRawData(item)) as Promise<string>
  },
  subscribeUploadProgress (listener: (_progress: number) => void) {
    const handler = (_event: Electron.IpcRendererEvent, progress: number) => {
      listener(progress)
    }

    ipcRenderer.on('uploadProgress', handler)
    return () => {
      ipcRenderer.removeListener('uploadProgress', handler)
    }
  },
  moveMiniWindow (pos: IMiniWindowPos) {
    sendToMain(SET_MINI_WINDOW_POS, pos)
  },
  openMiniMenu () {
    sendToMain(SHOW_MINI_PAGE_MENU)
  },
  requestRenameDraft () {
    ipcRenderer.send(GET_RENAME_FILE_NAME)
  },
  subscribeRenameDraft (listener: (fileName: string, originName: string, id: string) => void) {
    const handler = (_event: Electron.IpcRendererEvent, fileName: string, originName: string, id: string) => {
      listener(fileName, originName, id)
    }

    ipcRenderer.on(RENAME_FILE_NAME, handler)
    return () => {
      ipcRenderer.removeListener(RENAME_FILE_NAME, handler)
    }
  },
  submitRename (id: string, fileName: string) {
    sendToMain(`${RENAME_FILE_NAME}${id}`, fileName)
  },
  runToolboxCheck () {
    sendRPC(IRPCActionType.TOOLBOX_CHECK)
  },
  fixToolboxItem (type: IToolboxItemType) {
    return invokeRPC<IToolboxCheckRes>(IRPCActionType.TOOLBOX_CHECK_FIX, type)
  },
  subscribeToolboxResults (listener: (result: IToolboxCheckRes) => void) {
    const handler = (_event: Electron.IpcRendererEvent, result: IToolboxCheckRes) => {
      listener(result)
    }

    ipcRenderer.on(IRPCActionType.TOOLBOX_CHECK_RES, handler)
    return () => {
      ipcRenderer.removeListener(IRPCActionType.TOOLBOX_CHECK_RES, handler)
    }
  },
  openFile (filePath: string) {
    sendRPC(IRPCActionType.OPEN_FILE, filePath)
  },
  reloadApp () {
    sendRPC(IRPCActionType.RELOAD_APP)
  }
}
