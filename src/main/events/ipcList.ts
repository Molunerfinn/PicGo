import {
  app,
  ipcMain,
  Notification,
  IpcMainEvent
} from 'electron'
import windowManager from 'apis/app/window/windowManager'
import { IWindowList } from 'apis/app/window/constants'
import uploader from 'apis/app/uploader'
import pasteTemplate from '#/utils/pasteTemplate'
import db from '#/datastore'
import server from '~/main/server'
import getPicBeds from '~/main/utils/getPicBeds'
import shortKeyHandler from 'apis/app/shortKey/shortKeyHandler'
import bus from '@core/bus'
import {
  TOGGLE_SHORTKEY_MODIFIED_MODE,
  BAIDU_TONGJI_INIT,
  BAIDU_TONGJI_CODE,
  BAIDU_TONGJI_INIT_RES
} from '#/events/constants'
import {
  uploadClipboardFiles,
  uploadChoosedFiles
} from '~/main/apis/app/uploader/apis'
import picgoCoreIPC from './picgoCoreIPC'
import { handleCopyUrl } from '~/main/utils/common'
import axios from 'axios'

export default {
  listen () {
    picgoCoreIPC.listen()
    // from macOS tray
    ipcMain.on('uploadClipboardFiles', async () => {
      const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW)!
      const img = await uploader.setWebContents(trayWindow.webContents).upload()
      if (img !== false) {
        const pasteStyle = db.get('settings.pasteStyle') || 'markdown'
        handleCopyUrl(pasteTemplate(pasteStyle, img[0]))
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

    ipcMain.on(TOGGLE_SHORTKEY_MODIFIED_MODE, (evt: IpcMainEvent, val: boolean) => {
      bus.emit(TOGGLE_SHORTKEY_MODIFIED_MODE, val)
    })

    ipcMain.on('updateServer', () => {
      server.restart()
    })

    ipcMain.on(BAIDU_TONGJI_INIT, (evt: IpcMainEvent) => {
      axios.get(`https://hm.baidu.com/hm.js?${BAIDU_TONGJI_CODE}`, {
        headers: {
          referer: 'https://molunerfinn.com/'
        }
      }).then(res => {
        if (res.status === 200) {
          let scriptContent: string = res.data
          // thanks to https://github.com/joehecn/electron-baidu-tongji/blob/master/index.js
          const source = '(h.c.b.su=h.c.b.u||document.location.href),h.c.b.u=f.protocol+"//"+document.location.host+'
          if (scriptContent.includes(source)) {
            const target = '(h.c.b.su=h.c.b.u||"https://"+c.dm[0]+a[1]),h.c.b.u="https://"+c.dm[0]+'
            const target2 = '"https://"+c.dm[0]+window.location.pathname+window.location.hash'
            scriptContent = scriptContent.replace(source, target).replace(/window.location.href/g, target2)
          }
          evt.sender.send(BAIDU_TONGJI_INIT_RES, scriptContent)
        }
      })
    })
  },
  dispose () {}
}
