import {
  app,
  ipcMain,
  shell,
  Notification,
  IpcMainEvent,
  BrowserWindow
} from 'electron'
import windowManager from 'apis/app/window/windowManager'
import { IRPCActionType, IWindowList } from '#/types/enum'
import uploader from 'apis/app/uploader'
import pasteTemplate from '~/main/utils/pasteTemplate'
import db, { GalleryDB } from '~/main/apis/core/datastore'
import server from '~/main/server'
import getPicBeds from '~/main/utils/getPicBeds'
import shortKeyHandler from 'apis/app/shortKey/shortKeyHandler'
import bus from '@core/bus'
import {
  TOGGLE_SHORTKEY_MODIFIED_MODE,
  OPEN_DEVTOOLS,
  SHOW_MINI_PAGE_MENU,
  MINIMIZE_WINDOW,
  CLOSE_WINDOW,
  SHOW_MAIN_PAGE_MENU,
  SHOW_UPLOAD_PAGE_MENU,
  OPEN_USER_STORE_FILE,
  OPEN_URL,
  SHOW_PLUGIN_PAGE_MENU,
  SET_MINI_WINDOW_POS,
  GET_PICBEDS
} from '#/events/constants'
import {
  uploadClipboardFiles,
  uploadChoosedFiles
} from '~/main/apis/app/uploader/apis'
import picgoCoreIPC from './picgoCoreIPC'
import { handleCopyUrl } from '~/main/utils/common'
import { buildMainPageMenu, buildMiniPageMenu, buildPluginPageMenu, buildPicBedListMenu } from './remotes/menu'
import path from 'path'
import { T } from '~/main/i18n'

const STORE_PATH = app.getPath('userData')

export default {
  listen () {
    picgoCoreIPC.listen()
    // from macOS tray
    ipcMain.on('uploadClipboardFiles', async () => {
      const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW)!
      // macOS use builtin clipboard is OK
      const img = await uploader.setWebContents(trayWindow.webContents).uploadWithBuildInClipboard()
      if (img !== false) {
        const pasteStyle = db.get('settings.pasteStyle') || 'markdown'
        handleCopyUrl(pasteTemplate(pasteStyle, img[0], db.get('settings.customLink')))
        const notification = new Notification({
          title: T('UPLOAD_SUCCEED'),
          body: img[0].imgUrl!
          // icon: file[0]
          // icon: img[0].imgUrl
        })
        notification.show()
        await GalleryDB.getInstance().insert(img[0])
        trayWindow.webContents.send('clipboardFiles', [])
        if (windowManager.has(IWindowList.SETTING_WINDOW)) {
          windowManager.get(IWindowList.SETTING_WINDOW)!.webContents.send(IRPCActionType.UPDATE_GALLERY)
        }
      }
      trayWindow.webContents.send('uploadFiles')
    })

    ipcMain.on('uploadClipboardFilesFromUploadPage', () => {
      console.log('handle')
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
          title: T('OPERATION_SUCCEED'),
          body: T('TIPS_SHORTCUT_MODIFIED_SUCCEED')
        })
        notification.show()
      } else {
        const notification = new Notification({
          title: T('OPERATION_FAILED'),
          body: T('TIPS_SHORTCUT_MODIFIED_CONFLICT')
        })
        notification.show()
      }
    })

    ipcMain.on('bindOrUnbindShortKey', (evt: IpcMainEvent, item: IShortKeyConfig, from: string) => {
      const result = shortKeyHandler.bindOrUnbindShortKey(item, from)
      if (result) {
        const notification = new Notification({
          title: T('OPERATION_SUCCEED'),
          body: T('TIPS_SHORTCUT_MODIFIED_SUCCEED')
        })
        notification.show()
      } else {
        const notification = new Notification({
          title: T('OPERATION_FAILED'),
          body: T('TIPS_SHORTCUT_MODIFIED_CONFLICT')
        })
        notification.show()
      }
    })

    ipcMain.on('updateCustomLink', () => {
      const notification = new Notification({
        title: T('OPERATION_SUCCEED'),
        body: T('TIPS_CUSTOM_LINK_STYLE_MODIFIED_SUCCEED')
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

      if (db.get('settings.miniWindowOnTop')) {
        miniWindow.setAlwaysOnTop(true)
      }

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

    ipcMain.on(GET_PICBEDS, (evt: IpcMainEvent) => {
      const picBeds = getPicBeds()
      evt.sender.send(GET_PICBEDS, picBeds)
      evt.returnValue = picBeds
    })

    ipcMain.on(TOGGLE_SHORTKEY_MODIFIED_MODE, (evt: IpcMainEvent, val: boolean) => {
      bus.emit(TOGGLE_SHORTKEY_MODIFIED_MODE, val)
    })

    ipcMain.on('updateServer', () => {
      server.restart()
    })
    ipcMain.on(OPEN_DEVTOOLS, (event: IpcMainEvent) => {
      event.sender.openDevTools()
    })
    // menu & window methods
    ipcMain.on(SHOW_MINI_PAGE_MENU, () => {
      const window = windowManager.get(IWindowList.MINI_WINDOW)!
      const menu = buildMiniPageMenu()
      menu.popup({
        window
      })
    })
    ipcMain.on(SHOW_MAIN_PAGE_MENU, () => {
      const window = windowManager.get(IWindowList.SETTING_WINDOW)!
      const menu = buildMainPageMenu(window)
      menu.popup({
        window
      })
    })
    ipcMain.on(SHOW_UPLOAD_PAGE_MENU, () => {
      const window = windowManager.get(IWindowList.SETTING_WINDOW)!
      const menu = buildPicBedListMenu()
      menu.popup({
        window
      })
    })
    ipcMain.on(SHOW_PLUGIN_PAGE_MENU, (evt: IpcMainEvent, plugin: IPicGoPlugin) => {
      const window = windowManager.get(IWindowList.SETTING_WINDOW)!
      const menu = buildPluginPageMenu(plugin)
      menu.popup({
        window
      })
    })
    ipcMain.on(MINIMIZE_WINDOW, () => {
      const window = BrowserWindow.getFocusedWindow()
      window?.minimize()
    })
    ipcMain.on(CLOSE_WINDOW, () => {
      const window = BrowserWindow.getFocusedWindow()
      if (process.platform === 'linux') {
        window?.hide()
      } else {
        window?.close()
      }
    })
    ipcMain.on(OPEN_USER_STORE_FILE, (evt: IpcMainEvent, filePath: string) => {
      const abFilePath = path.join(STORE_PATH, filePath)
      shell.openPath(abFilePath)
    })
    ipcMain.on(OPEN_URL, (evt: IpcMainEvent, url: string) => {
      shell.openExternal(url)
    })
    ipcMain.on(SET_MINI_WINDOW_POS, (evt: IpcMainEvent, pos: IMiniWindowPos) => {
      const window = BrowserWindow.getFocusedWindow()
      window?.setBounds(pos)
    })
  },
  dispose () {}
}
