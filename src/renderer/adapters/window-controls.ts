import { CLOSE_WINDOW, MAXIMIZE_WINDOW, MINIMIZE_WINDOW } from '#/events/constants'
import { sendToMain } from '@/utils/dataSender'

export const windowControlsAdapter = {
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
