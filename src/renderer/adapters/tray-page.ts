import type { IResult } from '@picgo/store/dist/types'
import { OPEN_WINDOW, PASTE_TEXT } from '#/events/constants'
import { IWindowList } from '~/universal/types/enum'
import i18n from '@/i18n'
import db from '@/utils/db'
import { showNotification } from '@/utils/notification'
import { sendToMain } from '@/utils/dataSender'
import { ipc } from '@/utils/bridge'

type TrayPageGalleryItem = IResult<ImgInfo>

export const trayPageAdapter = {
  openMainWindow () {
    sendToMain(OPEN_WINDOW, IWindowList.SETTING_WINDOW)
  },
  async getRecentUploadedItems (limit = 5) {
    return (await db.get<ImgInfo>({ orderBy: 'desc', limit })).data
  },
  async copyUploadedLink (item: ImgInfo) {
    await ipc.invoke(PASTE_TEXT, item)
    showNotification({
      title: i18n.t('COPY_LINK_SUCCEED'),
      body: item.imgUrl || ''
    })
  },
  uploadClipboardFiles () {
    sendToMain('uploadClipboardFiles')
  },
  disableDragFile () {
    const preventDefault = (event: Event) => {
      event.preventDefault()
    }

    window.addEventListener('dragover', preventDefault, false)
    window.addEventListener('drop', preventDefault, false)

    return () => {
      window.removeEventListener('dragover', preventDefault, false)
      window.removeEventListener('drop', preventDefault, false)
    }
  }
}

export type { TrayPageGalleryItem }
