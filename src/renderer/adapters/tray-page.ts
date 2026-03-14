import { ipcRenderer } from 'electron'
import type { IResult } from '@picgo/store/dist/types'
import { OPEN_WINDOW, PASTE_TEXT } from '#/events/constants'
import { IWindowList } from '~/universal/types/enum'
import i18n from '@/i18n'
import db from '@/utils/db'
import { showNotification } from '@/utils/notification'
import { getRawData } from '@/utils/common'
import { sendToMain } from '@/utils/dataSender'

type TrayPageGalleryItem = IResult<ImgInfo>

type TrayFilesListeners = {
  onClipboardFiles?: (files: ImgInfo[]) => Promise<void> | void
  onDragFiles?: (items: ImgInfo[]) => Promise<void> | void
  onUploadFiles?: () => Promise<void> | void
  onUpdateFiles?: () => Promise<void> | void
}

export const trayPageAdapter = {
  openMainWindow () {
    sendToMain(OPEN_WINDOW, IWindowList.SETTING_WINDOW)
  },
  async getRecentUploadedItems (limit = 5) {
    return (await db.get<ImgInfo>({ orderBy: 'desc', limit })).data
  },
  async copyUploadedLink (item: ImgInfo) {
    await ipcRenderer.invoke(PASTE_TEXT, getRawData(item))
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
  },
  subscribeFiles (listeners: TrayFilesListeners) {
    const clipboardHandler = async (
      _event: Electron.IpcRendererEvent,
      files: ImgInfo[]
    ) => {
      await listeners.onClipboardFiles?.(files)
    }

    const dragHandler = async (
      _event: Electron.IpcRendererEvent,
      files: ImgInfo[]
    ) => {
      await listeners.onDragFiles?.(files)
    }

    const uploadHandler = async () => {
      await listeners.onUploadFiles?.()
    }

    const updateHandler = async () => {
      await listeners.onUpdateFiles?.()
    }

    ipcRenderer.on('clipboardFiles', clipboardHandler)
    ipcRenderer.on('dragFiles', dragHandler)
    ipcRenderer.on('uploadFiles', uploadHandler)
    ipcRenderer.on('updateFiles', updateHandler)

    return () => {
      ipcRenderer.removeListener('clipboardFiles', clipboardHandler)
      ipcRenderer.removeListener('dragFiles', dragHandler)
      ipcRenderer.removeListener('uploadFiles', uploadHandler)
      ipcRenderer.removeListener('updateFiles', updateHandler)
    }
  }
}

export type { TrayPageGalleryItem }
