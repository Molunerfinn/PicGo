'use strict'

import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  Notification,
  clipboard,
  ipcMain,
  globalShortcut,
  dialog,
  systemPreferences,
  WebContents,
  IpcMainEvent,
  protocol
} from 'electron'
import {
  createProtocol,
  installVueDevtools
} from 'vue-cli-plugin-electron-builder/lib'
import db from '#/datastore'
import picgo from '~/main/apis/picgo'
import uploader from '~/main/apis/uploader'
import beforeOpen from '~/main/utils/beforeOpen'
import pasteTemplate from '#/utils/pasteTemplate'
import updateChecker from '~/main/utils/updateChecker'
import getPicBeds from '~/main/utils/getPicBeds'
import pkg from 'root/package.json'
import picgoCoreIPC from '~/main/utils/picgoCoreIPC'
import fixPath from 'fix-path'
import { getUploadFiles } from '~/main/utils/handleArgv'
import bus from '~/main/utils/eventBus'
import {
  updateShortKeyFromVersion212
} from '~/main/migrate'
import shortKeyHandler from '~/main/apis/shortKey/shortKeyHandler'
import logger from '~/main/utils/logger'
import {
  UPLOAD_WITH_FILES,
  UPLOAD_WITH_FILES_RESPONSE,
  UPLOAD_WITH_CLIPBOARD_FILES,
  UPLOAD_WITH_CLIPBOARD_FILES_RESPONSE,
  GET_WINDOW_ID,
  GET_WINDOW_ID_REPONSE,
  GET_SETTING_WINDOW_ID,
  GET_SETTING_WINDOW_ID_RESPONSE,
  CREATE_APP_MENU
} from '~/main/apis/bus/constants'
import server from '~/main/server/index'
import { IWindowList } from '~/main/apis/window/constants'
import windowManager from '~/main/apis/window/windowManager'

const isDevelopment = process.env.NODE_ENV !== 'production'
protocol.registerSchemesAsPrivileged([{ scheme: 'picgo', privileges: { secure: true, standard: true } }])

beforeOpen()

let tray: Tray | null
let menu: Menu | null
let contextMenu: Menu | null
const winURL = isDevelopment
  ? (process.env.WEBPACK_DEV_SERVER_URL as string)
  : `picgo://./index.html`
const settingWinURL = isDevelopment
  ? `${(process.env.WEBPACK_DEV_SERVER_URL as string)}#setting/upload`
  : `picgo://./index.html#setting/upload`
const miniWinURL = isDevelopment
  ? `${(process.env.WEBPACK_DEV_SERVER_URL as string)}#mini-page`
  : `picgo://./index.html#mini-page`

// fix the $PATH in macOS
fixPath()

function createContextMenu () {
  const picBeds = getPicBeds()
  const submenu = picBeds.filter(item => item.visible).map(item => {
    return {
      label: item.name,
      type: 'radio',
      checked: db.get('picBed.current') === item.type,
      click () {
        picgo.saveConfig({
          'picBed.current': item.type
        })
        if (windowManager.has(IWindowList.SETTING_WINDOW)) {
          windowManager.get(IWindowList.SETTING_WINDOW)!.webContents.send('syncPicBed')
        }
      }
    }
  })
  contextMenu = Menu.buildFromTemplate([
    {
      label: '关于',
      click () {
        dialog.showMessageBox({
          title: 'PicGo',
          message: 'PicGo',
          detail: `Version: ${pkg.version}\nAuthor: Molunerfinn\nGithub: https://github.com/Molunerfinn/PicGo`
        })
      }
    },
    {
      label: '打开详细窗口',
      click () {
        const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)
        settingWindow!.show()
        settingWindow!.focus()
        if (windowManager.has(IWindowList.MINI_WINDOW)) {
          windowManager.get(IWindowList.MINI_WINDOW)!.hide()
        }
      }
    },
    {
      label: '选择默认图床',
      type: 'submenu',
      // @ts-ignore
      submenu
    },
    // @ts-ignore
    {
      label: '打开更新助手',
      type: 'checkbox',
      checked: db.get('settings.showUpdateTip'),
      click () {
        const value = db.get('settings.showUpdateTip')
        db.set('settings.showUpdateTip', !value)
      }
    },
    {
      label: '重启应用',
      click () {
        app.relaunch()
        app.exit(0)
      }
    },
    // @ts-ignore
    {
      role: 'quit',
      label: '退出'
    }
  ])
}

function createTray () {
  const menubarPic = process.platform === 'darwin' ? `${__static}/menubar.png` : `${__static}/menubar-nodarwin.png`
  tray = new Tray(menubarPic)
  tray.on('right-click', () => {
    if (windowManager.has(IWindowList.TRAY_WINDOW)) {
      windowManager.get(IWindowList.TRAY_WINDOW)!.hide()
    }
    createContextMenu()
    tray!.popUpContextMenu(contextMenu!)
  })
  tray.on('click', (event, bounds) => {
    if (process.platform === 'darwin') {
      toggleWindow(bounds)
      setTimeout(() => {
        let img = clipboard.readImage()
        let obj: ImgInfo[] = []
        if (!img.isEmpty()) {
          // 从剪贴板来的图片默认转为png
          // @ts-ignore
          const imgUrl = 'data:image/png;base64,' + Buffer.from(img.toPNG(), 'binary').toString('base64')
          obj.push({
            width: img.getSize().width,
            height: img.getSize().height,
            imgUrl
          })
        }
        windowManager.get(IWindowList.TRAY_WINDOW)!.webContents.send('clipboardFiles', obj)
      }, 0)
    } else {
      if (windowManager.has(IWindowList.TRAY_WINDOW)) {
        windowManager.get(IWindowList.TRAY_WINDOW)!.hide()
      }
      const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)
      settingWindow!.show()
      settingWindow!.focus()
      if (windowManager.has(IWindowList.MINI_WINDOW)) {
        windowManager.get(IWindowList.MINI_WINDOW)!.hide()
      }
    }
  })

  tray.on('drag-enter', () => {
    if (systemPreferences.isDarkMode()) {
      tray!.setImage(`${__static}/upload-dark.png`)
    } else {
      tray!.setImage(`${__static}/upload.png`)
    }
  })

  tray.on('drag-end', () => {
    tray!.setImage(`${__static}/menubar.png`)
  })

  tray.on('drop-files', async (event: Event, files: string[]) => {
    const pasteStyle = db.get('settings.pasteStyle') || 'markdown'
    const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW)!
    const imgs = await uploader
      .setWebContents(trayWindow.webContents)
      .upload(files)
    if (imgs !== false) {
      for (let i = 0; i < imgs.length; i++) {
        clipboard.writeText(pasteTemplate(pasteStyle, imgs[i]))
        const notification = new Notification({
          title: '上传成功',
          body: imgs[i].imgUrl!,
          icon: files[i]
        })
        setTimeout(() => {
          notification.show()
        }, i * 100)
        db.insert('uploaded', imgs[i])
      }
      trayWindow.webContents.send('dragFiles', imgs)
    }
  })
  // toggleWindow()
}

const createMenu = () => {
  if (process.env.NODE_ENV !== 'development') {
    const template = [{
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click () {
            app.quit()
          }
        }
      ]
    }]
    // @ts-ignore
    menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  }
}

const toggleWindow = (bounds: IBounds) => {
  const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW)!
  if (trayWindow.isVisible()) {
    trayWindow.hide()
  } else {
    trayWindow.setPosition(bounds.x - 98 + 11, bounds.y, false)
    trayWindow.webContents.send('updateFiles')
    trayWindow.show()
    trayWindow.focus()
  }
}

const uploadClipboardFiles = async (): Promise<string> => {
  const win = windowManager.getAvailableWindow()
  let img = await uploader.setWebContents(win!.webContents).upload()
  if (img !== false) {
    if (img.length > 0) {
      const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW)!
      const pasteStyle = db.get('settings.pasteStyle') || 'markdown'
      clipboard.writeText(pasteTemplate(pasteStyle, img[0]))
      const notification = new Notification({
        title: '上传成功',
        body: img[0].imgUrl!,
        icon: img[0].imgUrl
      })
      notification.show()
      db.insert('uploaded', img[0])
      trayWindow.webContents.send('clipboardFiles', [])
      trayWindow.webContents.send('uploadFiles', img)
      if (windowManager.has(IWindowList.SETTING_WINDOW)) {
        windowManager.get(IWindowList.SETTING_WINDOW)!.webContents.send('updateGallery')
      }
      return img[0].imgUrl as string
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

const uploadChoosedFiles = async (webContents: WebContents, files: IFileWithPath[]): Promise<string[]> => {
  const input = files.map(item => item.path)
  const imgs = await uploader.setWebContents(webContents).upload(input)
  const result = []
  if (imgs !== false) {
    const pasteStyle = db.get('settings.pasteStyle') || 'markdown'
    let pasteText = ''
    for (let i = 0; i < imgs.length; i++) {
      pasteText += pasteTemplate(pasteStyle, imgs[i]) + '\r\n'
      const notification = new Notification({
        title: '上传成功',
        body: imgs[i].imgUrl!,
        icon: files[i].path
      })
      setTimeout(() => {
        notification.show()
      }, i * 100)
      db.insert('uploaded', imgs[i])
      result.push(imgs[i].imgUrl!)
    }
    clipboard.writeText(pasteText)
    windowManager.get(IWindowList.TRAY_WINDOW)!.webContents.send('uploadFiles', imgs)
    if (windowManager.has(IWindowList.SETTING_WINDOW)) {
      windowManager.get(IWindowList.SETTING_WINDOW)!.webContents.send('updateGallery')
    }
    return result
  } else {
    return []
  }
}

picgoCoreIPC()

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

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    let files = getUploadFiles(commandLine, workingDirectory)
    if (files === null || files.length > 0) { // 如果有文件列表作为参数，说明是命令行启动
      if (files === null) {
        uploadClipboardFiles()
      } else {
        const win = windowManager.getAvailableWindow()
        uploadChoosedFiles(win.webContents, files)
      }
    } else {
      if (windowManager.has(IWindowList.SETTING_WINDOW)) {
        const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)!
        if (settingWindow.isMinimized()) {
          settingWindow.restore()
        }
        settingWindow.focus()
      }
    }
  })
}

if (process.platform === 'win32') {
  app.setAppUserModelId('com.molunerfinn.picgo')
}

if (process.env.XDG_CURRENT_DESKTOP && process.env.XDG_CURRENT_DESKTOP.includes('Unity')) {
  process.env.XDG_CURRENT_DESKTOP = 'Unity'
}

app.on('ready', async () => {
  createProtocol('picgo')
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installVueDevtools()
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  windowManager.create(IWindowList.TRAY_WINDOW)
  windowManager.create(IWindowList.SETTING_WINDOW)
  if (process.platform === 'darwin' || process.platform === 'win32') {
    createTray()
  }
  db.set('needReload', false)
  updateChecker()
  initEventCenter()
  // 不需要阻塞
  process.nextTick(() => {
    updateShortKeyFromVersion212(db, db.get('settings.shortKey'))
    shortKeyHandler.init()
  })
  server.startup()
  if (process.env.NODE_ENV !== 'development') {
    let files = getUploadFiles()
    if (files === null || files.length > 0) { // 如果有文件列表作为参数，说明是命令行启动
      if (files === null) {
        uploadClipboardFiles()
      } else {
        const win = windowManager.getAvailableWindow()
        uploadChoosedFiles(win.webContents, files)
      }
    }
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  createProtocol('picgo')
  if (!windowManager.has(IWindowList.TRAY_WINDOW)) {
    windowManager.create(IWindowList.TRAY_WINDOW)
  }
  if (!windowManager.has(IWindowList.SETTING_WINDOW)) {
    windowManager.create(IWindowList.SETTING_WINDOW)
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  bus.removeAllListeners()
  server.shutdown()
})

app.setLoginItemSettings({
  openAtLogin: db.get('settings.autoStart') || false
})

function initEventCenter () {
  const eventList: any = {
    'picgo:upload': uploadClipboardFiles,
    [UPLOAD_WITH_CLIPBOARD_FILES]: busCallUploadClipboardFiles,
    [UPLOAD_WITH_FILES]: busCallUploadFiles,
    [GET_WINDOW_ID]: busCallGetWindowId,
    [GET_SETTING_WINDOW_ID]: busCallGetSettingWindowId,
    [CREATE_APP_MENU]: createMenu
  }
  for (let i in eventList) {
    bus.on(i, eventList[i])
  }
}

async function busCallUploadClipboardFiles () {
  const imgUrl = await uploadClipboardFiles()
  bus.emit(UPLOAD_WITH_CLIPBOARD_FILES_RESPONSE, imgUrl)
}

async function busCallUploadFiles (pathList: IFileWithPath[]) {
  const win = windowManager.getAvailableWindow()
  const urls = await uploadChoosedFiles(win.webContents, pathList)
  bus.emit(UPLOAD_WITH_FILES_RESPONSE, urls)
}

function busCallGetWindowId () {
  const win = windowManager.getAvailableWindow()
  bus.emit(GET_WINDOW_ID_REPONSE, win.id)
}

function busCallGetSettingWindowId () {
  const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)!
  bus.emit(GET_SETTING_WINDOW_ID_RESPONSE, settingWindow.id)
}

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
        server.shutdown()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
      server.shutdown()
    })
  }
}

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
*/

// import { autoUpdater } from 'electron-updater'

// autoUpdater.on('update-downloaded', () => {
//   autoUpdater.quitAndInstall()
// })

// app.on('ready', () => {
//   if (process.env.NODE_ENV === 'production') {
//     autoUpdater.checkForUpdates()
//   }
// })
