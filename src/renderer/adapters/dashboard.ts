import { LOG_INVALID_URL_LINES, SHOW_UPLOAD_PAGE_MENU } from '#/events/constants'
import { saveConfig, sendToMain } from '@/utils/dataSender'

export const dashboardAdapter = {
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
