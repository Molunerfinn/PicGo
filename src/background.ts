'use strict'

import Uploader from '~/main/utils/uploader'
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
import beforeOpen from '~/main/utils/beforeOpen'
import pasteTemplate from '#/utils/pasteTemplate'
import updateChecker from '~/main/utils/updateChecker'
import { getPicBeds } from '~/main/utils/getPicBeds'
import pkg from 'root/package.json'
import picgoCoreIPC from '~/main/utils/picgoCoreIPC'
import fixPath from 'fix-path'
import { getUploadFiles } from '~/main/utils/handleArgv'
import bus from '~/main/utils/eventBus'
import {
  updateShortKeyFromVersion212
} from '~/main/migrate/shortKeyUpdateHelper'
import shortKeyHandler from '~/main/utils/shortKeyHandler'
import logger from '~/main/utils/logger'

const isDevelopment = process.env.NODE_ENV !== 'production'
protocol.registerSchemesAsPrivileged([{ scheme: 'picgo', privileges: { secure: true, standard: true } }])

if (process.platform === 'darwin') {
  beforeOpen()
}

let window: BrowserWindow | null
let settingWindow: BrowserWindow | null
let miniWindow: BrowserWindow | null
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
  const picBeds = getPicBeds(app)
  const submenu = picBeds.map(item => {
    return {
      label: item.name,
      type: 'radio',
      checked: db.get('picBed.current') === item.type,
      click () {
        db.set('picBed.current', item.type)
        if (settingWindow) {
          settingWindow.webContents.send('syncPicBed')
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
        if (settingWindow === null) {
          createSettingWindow()
          settingWindow!.show()
        } else {
          settingWindow.show()
          settingWindow.focus()
        }
        if (miniWindow) {
          miniWindow.hide()
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
    if (window) {
      window.hide()
    }
    createContextMenu()
    tray!.popUpContextMenu(contextMenu!)
  })
  tray.on('click', (event, bounds) => {
    if (process.platform === 'darwin') {
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
      toggleWindow(bounds)
      setTimeout(() => {
        window!.webContents.send('clipboardFiles', obj)
      }, 0)
    } else {
      if (window) {
        window.hide()
      }
      if (settingWindow === null) {
        createSettingWindow()
        settingWindow!.show()
      } else {
        settingWindow.show()
        settingWindow.focus()
      }
      if (miniWindow) {
        miniWindow.hide()
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
    const imgs = await new Uploader(files, window!.webContents).upload()
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
      window!.webContents.send('dragFiles', imgs)
    }
  })
  // toggleWindow()
}

const createWindow = () => {
  if (process.platform !== 'darwin' && process.platform !== 'win32') {
    return
  }
  window = new BrowserWindow({
    height: 350,
    width: 196, // 196
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    transparent: true,
    vibrancy: 'ultra-dark',
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      backgroundThrottling: false
    }
  })

  window.loadURL(winURL)

  window.on('closed', () => {
    window = null
  })

  window.on('blur', () => {
    window!.hide()
  })
  return window
}

const createMiniWidow = () => {
  if (miniWindow) {
    return false
  }
  let obj: IBrowserWindowOptions = {
    height: 64,
    width: 64,
    show: process.platform === 'linux',
    frame: false,
    fullscreenable: false,
    skipTaskbar: true,
    resizable: false,
    transparent: process.platform !== 'linux',
    icon: `${__static}/logo.png`,
    webPreferences: {
      backgroundThrottling: false,
      nodeIntegration: true,
      nodeIntegrationInWorker: true
    }
  }

  if (db.get('settings.miniWindowOntop')) {
    obj.alwaysOnTop = true
  }

  miniWindow = new BrowserWindow(obj)

  miniWindow.loadURL(miniWinURL)

  miniWindow.on('closed', () => {
    miniWindow = null
  })
  return miniWindow
}

const createSettingWindow = () => {
  const options: IBrowserWindowOptions = {
    height: 450,
    width: 800,
    show: false,
    frame: true,
    center: true,
    fullscreenable: false,
    resizable: false,
    title: 'PicGo',
    vibrancy: 'ultra-dark',
    transparent: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      backgroundThrottling: false,
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      webSecurity: false
    }
  }
  if (process.platform !== 'darwin') {
    options.show = false
    options.frame = false
    options.backgroundColor = '#3f3c37'
    options.transparent = false
    options.icon = `${__static}/logo.png`
  }
  settingWindow = new BrowserWindow(options)

  settingWindow!.loadURL(settingWinURL)

  settingWindow!.on('closed', () => {
    bus.emit('toggleShortKeyModifiedMode', false)
    settingWindow = null
    if (process.platform === 'linux') {
      process.nextTick(() => {
        app.quit()
      })
    }
  })
  createMenu()
  createMiniWidow()
  return settingWindow
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
  if (window!.isVisible()) {
    window!.hide()
  } else {
    showWindow(bounds)
  }
}

const showWindow = (bounds: IBounds) => {
  window!.setPosition(bounds.x - 98 + 11, bounds.y, false)
  window!.webContents.send('updateFiles')
  window!.show()
  window!.focus()
}

const uploadClipboardFiles = async () => {
  let win
  if (miniWindow!.isVisible()) {
    win = miniWindow
  } else {
    win = settingWindow || window || createSettingWindow()
  }
  let img = await new Uploader(undefined, win!.webContents).upload()
  if (img !== false) {
    if (img.length > 0) {
      const pasteStyle = db.get('settings.pasteStyle') || 'markdown'
      clipboard.writeText(pasteTemplate(pasteStyle, img[0]))
      const notification = new Notification({
        title: '上传成功',
        body: img[0].imgUrl!,
        icon: img[0].imgUrl
      })
      notification.show()
      db.insert('uploaded', img[0])
      window!.webContents.send('clipboardFiles', [])
      window!.webContents.send('uploadFiles', img)
      if (settingWindow) {
        settingWindow.webContents.send('updateGallery')
      }
    } else {
      const notification = new Notification({
        title: '上传不成功',
        body: '你剪贴板最新的一条记录不是图片哦'
      })
      notification.show()
    }
  }
}

const uploadChoosedFiles = async (webContents: WebContents, files: IFileWithPath[]) => {
  const input = files.map(item => item.path)
  const imgs = await new Uploader(input, webContents).upload()
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
    }
    clipboard.writeText(pasteText)
    window!.webContents.send('uploadFiles', imgs)
    if (settingWindow) {
      settingWindow.webContents.send('updateGallery')
    }
  }
}

picgoCoreIPC(app, ipcMain)

// from macOS tray
ipcMain.on('uploadClipboardFiles', async () => {
  const img = await new Uploader(undefined, window!.webContents).upload()
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
    window!.webContents.send('clipboardFiles', [])
    if (settingWindow) {
      settingWindow.webContents.send('updateGallery')
    }
  }
  window!.webContents.send('uploadFiles')
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
  if (!settingWindow) {
    createSettingWindow()
  } else {
    settingWindow.show()
  }
  if (miniWindow) {
    miniWindow.hide()
  }
})

ipcMain.on('openMiniWindow', () => {
  if (!miniWindow) {
    createMiniWidow()
  }
  miniWindow!.show()
  miniWindow!.focus()
  settingWindow!.hide()
})

//  from mini window
ipcMain.on('syncPicBed', () => {
  if (settingWindow) {
    settingWindow.webContents.send('syncPicBed')
  }
})

ipcMain.on('getPicBeds', (evt: IpcMainEvent) => {
  const picBeds = getPicBeds(app)
  evt.sender.send('getPicBeds', picBeds)
  evt.returnValue = picBeds
})

ipcMain.on('toggleShortKeyModifiedMode', (evt: IpcMainEvent, val: boolean) => {
  bus.emit('toggleShortKeyModifiedMode', val)
})

// const shortKeyHash = {
//   upload: uploadClipboardFiles
// }

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
        let win
        if (miniWindow && miniWindow.isVisible()) {
          win = miniWindow
        } else {
          win = settingWindow || window || createSettingWindow()
        }
        uploadChoosedFiles(win.webContents, files)
      }
    } else {
      if (settingWindow) {
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
  createWindow()
  createSettingWindow()
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

  if (process.env.NODE_ENV !== 'development') {
    let files = getUploadFiles()
    if (files === null) {
      logger.info('get clipboardFile, null')
    } else {
      logger.info(`get clipboardFile, ${files.toString()}`)
    }
    if (files === null || files.length > 0) { // 如果有文件列表作为参数，说明是命令行启动
      if (files === null) {
        uploadClipboardFiles()
      } else {
        let win
        if (miniWindow && miniWindow.isVisible()) {
          win = miniWindow
        } else {
          win = settingWindow || window || createSettingWindow()
        }
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
  if (window === null) {
    createWindow()
  }
  if (settingWindow === null) {
    createSettingWindow()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  bus.removeAllListeners()
})

app.setLoginItemSettings({
  openAtLogin: db.get('settings.autoStart') || false
})

function initEventCenter () {
  const eventList: any = {
    'picgo:upload': uploadClipboardFiles,
    'createSettingWindow': shortKeyRequestSettingWindow,
    hideMiniWindow
  }
  for (let i in eventList) {
    bus.on(i, eventList[i])
  }
}

function shortKeyRequestSettingWindow (command: string) {
  if (!settingWindow) createSettingWindow()
  bus.emit('createSettingWindowDone', command, settingWindow!.id)
}

function hideMiniWindow () {
  if (miniWindow && miniWindow.isVisible()) {
    miniWindow.hide()
  }
}

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
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
