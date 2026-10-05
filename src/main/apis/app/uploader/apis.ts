import type { WebContents } from 'electron'
import windowManager from 'apis/app/window/windowManager'
import { IPasteStyle, IRPCActionType, IWindowList } from '#/types/enum'
import uploader from '.'
import pasteTemplate from '~/main/utils/pasteTemplate'
import { AlbumDB } from '~/main/apis/core/datastore'
import { handleCopyUrl, handleUrlEncodeWithSetting, showNotification } from '~/main/utils/common'
import { T } from '~/main/i18n/index'
import logger from '@core/picgo/logger'
import picgo from '@core/picgo'
import type { UploadOptions } from 'picgo'
// import dayjs from 'dayjs'

const handleClipboardUploading = async (options?: UploadOptions, webContents?: WebContents): Promise<false | ImgInfo[]> => {
  const useBuiltinClipboard = !!picgo.getConfig<boolean>('settings.useBuiltinClipboard')
  const uploadWebContents = webContents ?? windowManager.getAvailableWindow().webContents
  if (useBuiltinClipboard) {
    return await uploader.uploadWithBuildInClipboard({ webContents: uploadWebContents, options })
  }
  return await uploader.upload({ webContents: uploadWebContents, options })
}

export const uploadClipboardFilesWithInfo = async (options?: UploadOptions, webContents?: WebContents): Promise<ImgInfo[]> => {
  logger.info('upload clipboard file')
  const img = await handleClipboardUploading(options, webContents)
  if (img !== false) {
    if (img.length > 0) {
      const pasteStyle = picgo.getConfig<IPasteStyle>('settings.pasteStyle') || 'markdown'
      handleCopyUrl(pasteTemplate(pasteStyle, img[0], picgo.getConfig<string>('settings.customLink')))
      setTimeout(() => {
        showNotification({
          title: T('UPLOAD_SUCCEED'),
          body: img[0].imgUrl!
          // icon: img[0].imgUrl
        })
      }, 100)
      await AlbumDB.getInstance().insert(img[0])
      // trayWindow just be created in mac/windows, not in linux
      const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW)
      if (trayWindow && !trayWindow.webContents.isDestroyed()) {
        trayWindow.webContents.send('clipboardFiles', [])
        trayWindow.webContents.send(IRPCActionType.UPLOAD_FILES, img)
      }
      if (windowManager.has(IWindowList.SETTING_WINDOW)) {
        const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)
        if (settingWindow && !settingWindow.webContents.isDestroyed()) {
          settingWindow.webContents.send(IRPCActionType.UPDATE_ALBUM)
        }
      }
      return img
    } else {
      showNotification({
        title: T('UPLOAD_FAILED'),
        body: T('TIPS_UPLOAD_NOT_PICTURES')
      })
      return []
    }
  } else {
    return []
  }
}

export const uploadClipboardFiles = async (options?: UploadOptions, webContents?: WebContents): Promise<string> => {
  const img = await uploadClipboardFilesWithInfo(options, webContents)
  return img[0]?.imgUrl ? handleUrlEncodeWithSetting(img[0].imgUrl) : ''
}

export const uploadSelectedFilesWithInfo = async (webContents: WebContents, files: IFileWithPath[], options?: UploadOptions): Promise<ImgInfo[]> => {
  const input = files.map(item => item.path)
  const imgs = await uploader.upload({ input, webContents, options })
  if (imgs !== false) {
    const pasteStyle = picgo.getConfig<IPasteStyle>('settings.pasteStyle') || 'markdown'
    const pasteText: string[] = []
    for (let i = 0; i < imgs.length; i++) {
      pasteText.push(pasteTemplate(pasteStyle, imgs[i], picgo.getConfig<string>('settings.customLink')))
      setTimeout(() => {
        showNotification({
          title: T('UPLOAD_SUCCEED'),
          body: imgs[i].imgUrl!
          // icon: files[i].path
        })
      }, i * 100)
      await AlbumDB.getInstance().insert(imgs[i])
    }
    handleCopyUrl(pasteText.join('\n'))
    // trayWindow just be created in mac/windows, not in linux
    const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW)
    if (trayWindow && !trayWindow.webContents.isDestroyed()) {
      trayWindow.webContents.send(IRPCActionType.UPLOAD_FILES, imgs)
    }
    if (windowManager.has(IWindowList.SETTING_WINDOW)) {
      const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)
      if (settingWindow && !settingWindow.webContents.isDestroyed()) {
        settingWindow.webContents.send(IRPCActionType.UPDATE_ALBUM)
      }
    }
    return imgs
  } else {
    return []
  }
}

export const uploadSelectedFiles = async (webContents: WebContents, files: IFileWithPath[], options?: UploadOptions): Promise<string[]> => {
  const imgs = await uploadSelectedFilesWithInfo(webContents, files, options)
  return imgs
    .map(item => item.imgUrl)
    .filter((url): url is string => typeof url === 'string' && url !== '')
    .map(url => handleUrlEncodeWithSetting(url))
}
