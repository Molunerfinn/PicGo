import {
  OPEN_WINDOW,
  OPEN_DEVTOOLS,
  SHOW_MAIN_PAGE_DONATION,
  SHOW_MAIN_PAGE_QRCODE,
  SHOW_PRIVACY_MESSAGE
} from '#/events/constants'
import { IWindowList } from '~/universal/types/enum'
import { sendToMain } from '@/utils/dataSender'

export const mainMoreAdapter = {
  openDonationDialog () {
    sendToMain(SHOW_MAIN_PAGE_DONATION)
  },
  openPicBedQrcodeDialog () {
    sendToMain(SHOW_MAIN_PAGE_QRCODE)
  },
  openDevtools () {
    sendToMain(OPEN_DEVTOOLS)
  },
  openToolboxWindow () {
    sendToMain(OPEN_WINDOW, IWindowList.TOOLBOX_WINDOW)
  },
  openPrivacyTerms () {
    sendToMain(SHOW_PRIVACY_MESSAGE)
  }
}
