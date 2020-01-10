import {
  app,
  ipcMain,
  clipboard,
  Notification,
  IpcMainEvent
} from 'electron'
import windowManager from '~/main/apis/window/windowManager'
import { IWindowList } from '~/main/apis/window/constants'
import uploader from '~/main/apis/uploader'
import pasteTemplate from '#/utils/pasteTemplate'
import db from '#/datastore'
import server from '~/main/server'
import getPicBeds from '~/main/utils/getPicBeds'
import shortKeyHandler from '~/main/apis/shortKey/shortKeyHandler'
import bus from '~/main/utils/eventBus'
import {
  uploadClipboardFiles,
  uploadChoosedFiles
} from '~/main/apis/uploader/api'
import picgoCoreIPC from './picgoCoreIPC'

export default {
  listen () {
    picgoCoreIPC.listen()
    // from macOS tray
    ipcMain.on('uploadClipboardFiles', async () => {
      const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW)!
      const img = await uploader.setWebContents(trayWindow.webContents).upload()
      if (img !== false) {
        const pasteStyle = db.get('settings.pasteStyle') || 'markdown'
        clipboard.writeText(pasteTemplate(pasteStyle, img[0]))
        const notification = new Notification({
          title: '上传成功',
          body: img[0].imgUrl!,
          // icon: file[0]
          icon: img[0].imgUrl
        })
        notification.show()
        db.insert('uploaded', img[0])
        trayWindow.webContents.send('clipboardFiles', [])
        if (windowManager.has(IWindowList.SETTING_WINDOW)) {
          windowManager.get(IWindowList.SETTING_WINDOW)!.webContents.send('updateGallery')
        }
      }
      trayWindow.webContents.send('uploadFiles')
    })

    ipcMain.on('uploadClipboardFilesFromUploadPage', () => {
      uploadClipboardFiles()
    })

    ipcMain.on('uploadChoosedFiles', async (evt: IpcMainEvent, files: IFileWithPath[]) => {
      return uploadChoosedFiles(evt.sender, files)
    })

    ipcMain.on('updateShortKey', (evt: IpcMainEvent, item: IShortKeyConfig, oldKey: string, from: string) => {
      const result = shortKeyHandler.updateShortKey(item, oldKey, from)
      evt.sender.send('updateShortKeyResponse', result)
      if (result) {
        const notification = new Notification({
          title: '操作成功',
          body: '你的快捷键已经修改成功'
        })
        notification.show()
      } else {
        const notification = new Notification({
          title: '操作失败',
          body: '快捷键冲突，请重新设置'
        })
        notification.show()
      }
    })

    ipcMain.on('bindOrUnbindShortKey', (evt: IpcMainEvent, item: IShortKeyConfig, from: string) => {
      const result = shortKeyHandler.bindOrUnbindShortKey(item, from)
      if (result) {
        const notification = new Notification({
          title: '操作成功',
          body: '你的快捷键已经修改成功'
        })
        notification.show()
      } else {
        const notification = new Notification({
          title: '操作失败',
          body: '快捷键冲突，请重新设置'
        })
        notification.show()
      }
    })

    ipcMain.on('updateCustomLink', () => {
      const notification = new Notification({
        title: '操作成功',
        body: '你的自定义链接格式已经修改成功'
      })
      notification.show()
    })

    ipcMain.on('autoStart', (evt: IpcMainEvent, val: boolean) => {
      app.setLoginItemSettings({
        openAtLogin: val
      })
    })

    ipcMain.on('openSettingWindow', () => {
      windowManager.get(IWindowList.SETTING_WINDOW)!.show()
      if (windowManager.has(IWindowList.MINI_WINDOW)) {
        windowManager.get(IWindowList.MINI_WINDOW)!.hide()
      }
    })

    ipcMain.on('openMiniWindow', () => {
      const miniWindow = windowManager.get(IWindowList.MINI_WINDOW)!
      const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)!
      miniWindow.show()
      miniWindow.focus()
      settingWindow.hide()
    })

    //  from mini window
    ipcMain.on('syncPicBed', () => {
      if (windowManager.has(IWindowList.SETTING_WINDOW)) {
        windowManager.get(IWindowList.SETTING_WINDOW)!.webContents.send('syncPicBed')
      }
    })

    ipcMain.on('getPicBeds', (evt: IpcMainEvent) => {
      const picBeds = getPicBeds()
      evt.sender.send('getPicBeds', picBeds)
      evt.returnValue = picBeds
    })

    ipcMain.on('toggleShortKeyModifiedMode', (evt: IpcMainEvent, val: boolean) => {
      bus.emit('toggleShortKeyModifiedMode', val)
    })

    ipcMain.on('updateServer', () => {
      server.restart()
    })
  },
  dispose () {}
}
