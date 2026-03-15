import { ipcRenderer } from 'electron'
import { GET_RENAME_FILE_NAME, RENAME_FILE_NAME } from '#/events/constants'
import { sendToMain } from '@/utils/dataSender'

export const renamePageAdapter = {
  requestRenameDraft () {
    ipcRenderer.send(GET_RENAME_FILE_NAME)
  },
  submitRename (id: string, fileName: string) {
    sendToMain(`${RENAME_FILE_NAME}${id}`, fileName)
  }
}
