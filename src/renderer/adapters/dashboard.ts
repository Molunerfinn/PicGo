import { ipcRenderer } from 'electron'
import { LOG_INVALID_URL_LINES, SHOW_UPLOAD_PAGE_MENU } from '#/events/constants'
import { saveConfig, sendToMain } from '@/utils/dataSender'

type ProgressListener = (_event: Electron.IpcRendererEvent, progress: number) => void
type SyncPicBedListener = () => void

export const dashboardAdapter = {
  subscribeToUploadProgress (listener: ProgressListener) {
    ipcRenderer.on('uploadProgress', listener)
    return () => {
      ipcRenderer.removeListener('uploadProgress', listener)
    }
  },
  subscribeToSyncPicBed (listener: SyncPicBedListener) {
    ipcRenderer.on('syncPicBed', listener)
    return () => {
      ipcRenderer.removeListener('syncPicBed', listener)
    }
  },
  uploadSelectedFiles (files: IFileWithPath[]) {
    sendToMain('uploadChoosedFiles', files)
  },
  uploadClipboardFiles () {
    sendToMain('uploadClipboardFilesFromUploadPage')
  },
  openUploaderMenu () {
    sendToMain(SHOW_UPLOAD_PAGE_MENU)
  },
  logInvalidUrlLines (lines: string[]) {
    sendToMain(LOG_INVALID_URL_LINES, lines)
  },
  savePasteStyle (pasteStyle: string) {
    return saveConfig({
      'settings.pasteStyle': pasteStyle
    })
  }
}
