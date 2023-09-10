import {
  Notification,
  WebContents
} from 'electron'
import windowManager from 'apis/app/window/windowManager'
import { IRPCActionType, IWindowList } from '#/types/enum'
import uploader from '.'
import pasteTemplate from '~/main/utils/pasteTemplate'
import db, { GalleryDB } from '~/main/apis/core/datastore'
import { handleCopyUrl, handleUrlEncodeWithSetting } from '~/main/utils/common'
import { T } from '~/main/i18n/index'
import logger from '@core/picgo/logger'
// import dayjs from 'dayjs'

const handleClipboardUploading = async (): Promise<false | ImgInfo[]> => {
  const useBuiltinClipboard = !!db.get('settings.useBuiltinClipboard')
  const win = windowManager.getAvailableWindow()
  if (useBuiltinClipboard) {
    return await uploader.setWebContents(win!.webContents).uploadWithBuildInClipboard()
  }
  return await uploader.setWebContents(win!.webContents).upload()
}

export const uploadClipboardFiles = async (): Promise<string> => {
  logger.info('upload clipboard file')
  const img = await handleClipboardUploading()
  if (img !== false) {
    if (img.length > 0) {
      const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW)
      const pasteStyle = db.get('settings.pasteStyle') || 'markdown'
      handleCopyUrl(pasteTemplate(pasteStyle, img[0], db.get('settings.customLink')))
      const notification = new Notification({
        title: T('UPLOAD_SUCCEED'),
        body: img[0].imgUrl!
        // icon: img[0].imgUrl
      })
      setTimeout(() => {
        notification.show()
      }, 100)
      await GalleryDB.getInstance().insert(img[0])
      // trayWindow just be created in mac/windows, not in linux
      trayWindow?.webContents?.send('clipboardFiles', [])
      trayWindow?.webContents?.send('uploadFiles', img)
      if (windowManager.has(IWindowList.SETTING_WINDOW)) {
        windowManager.get(IWindowList.SETTING_WINDOW)!.webContents?.send(IRPCActionType.UPDATE_GALLERY)
      }
      return handleUrlEncodeWithSetting(img[0].imgUrl as string)
    } else {
      const notification = new Notification({
        title: T('UPLOAD_FAILED'),
        body: T('TIPS_UPLOAD_NOT_PICTURES')
      })
      notification.show()
      return ''
    }
  } else {
    return ''
  }
}

export const uploadChoosedFiles = async (webContents: WebContents, files: IFileWithPath[]): Promise<string[]> => {
  const input = files.map(item => item.path)
  const imgs = await uploader.setWebContents(webContents).upload(input)
  const result = []
  if (imgs !== false) {
    const pasteStyle = db.get('settings.pasteStyle') || 'markdown'
    const pasteText: string[] = []
    for (let i = 0; i < imgs.length; i++) {
      pasteText.push(pasteTemplate(pasteStyle, imgs[i], db.get('settings.customLink')))
      const notification = new Notification({
        title: T('UPLOAD_SUCCEED'),
        body: imgs[i].imgUrl!
        // icon: files[i].path
      })
      setTimeout(() => {
        notification.show()
      }, i * 100)
      await GalleryDB.getInstance().insert(imgs[i])
      result.push(handleUrlEncodeWithSetting(imgs[i].imgUrl!))
    }
    handleCopyUrl(pasteText.join('\n'))
    // trayWindow just be created in mac/windows, not in linux
    windowManager.get(IWindowList.TRAY_WINDOW)?.webContents?.send('uploadFiles', imgs)
    if (windowManager.has(IWindowList.SETTING_WINDOW)) {
      windowManager.get(IWindowList.SETTING_WINDOW)!.webContents?.send(IRPCActionType.UPDATE_GALLERY)
    }
    return result
  } else {
    return []
  }
}
