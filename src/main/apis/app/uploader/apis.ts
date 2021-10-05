import {
  Notification,
  WebContents
} from 'electron'
import windowManager from 'apis/app/window/windowManager'
import { IWindowList } from '#/types/enum'
import uploader from '.'
import pasteTemplate from '#/utils/pasteTemplate'
import db, { GalleryDB } from '~/main/apis/core/datastore'
import { handleCopyUrl } from '~/main/utils/common'
import { handleUrlEncode } from '#/utils/common'

export const uploadClipboardFiles = async (): Promise<string> => {
  const win = windowManager.getAvailableWindow()
  let img = await uploader.setWebContents(win!.webContents).upload()
  if (img !== false) {
    if (img.length > 0) {
      const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW)
      const pasteStyle = db.get('settings.pasteStyle') || 'markdown'
      handleCopyUrl(pasteTemplate(pasteStyle, img[0], db.get('settings.customLink')))
      const notification = new Notification({
        title: '上传成功',
        body: img[0].imgUrl!,
        icon: img[0].imgUrl
      })
      notification.show()
      await GalleryDB.getInstance().insert(img[0])
      // trayWindow just be created in mac/windows, not in linux
      trayWindow?.webContents?.send('clipboardFiles', [])
      trayWindow?.webContents?.send('uploadFiles', img)
      if (windowManager.has(IWindowList.SETTING_WINDOW)) {
        windowManager.get(IWindowList.SETTING_WINDOW)!.webContents.send('updateGallery')
      }
      return handleUrlEncode(img[0].imgUrl as string)
    } else {
      const notification = new Notification({
        title: '上传不成功',
        body: '你剪贴板最新的一条记录不是图片哦'
      })
      notification.show()
      return ''
    }
  } else {
    return ''
  }
}

export const uploadChosenFiles = async (webContents: WebContents, files: IFileWithPath[]): Promise<string[]> => {
  const input = files.map(item => item.path)
  const imgs = await uploader.setWebContents(webContents).upload(input)
  const result = []
  if (imgs !== false) {
    const pasteStyle = db.get('settings.pasteStyle') || 'markdown'
    const pasteText: string[] = []
    for (let i = 0; i < imgs.length; i++) {
      pasteText.push(pasteTemplate(pasteStyle, imgs[i], db.get('settings.customLink')))
      const notification = new Notification({
        title: '上传成功',
        body: imgs[i].imgUrl!,
        icon: files[i].path
      })
      setTimeout(() => {
        notification.show()
      }, i * 100)
      await GalleryDB.getInstance().insert(imgs[i])
      result.push(handleUrlEncode(imgs[i].imgUrl!))
    }
    handleCopyUrl(pasteText.join('\n'))
    // trayWindow just be created in mac/windows, not in linux
    windowManager.get(IWindowList.TRAY_WINDOW)?.webContents?.send('uploadFiles', imgs)
    if (windowManager.has(IWindowList.SETTING_WINDOW)) {
      windowManager.get(IWindowList.SETTING_WINDOW)!.webContents.send('updateGallery')
    }
    return result
  } else {
    return []
  }
}
