'use strict'

import uploader from './utils/uploader.js'
import { app, BrowserWindow, Tray, Menu, Notification, clipboard, ipcMain, globalShortcut, dialog } from 'electron'
import db from '../datastore'
import pasteTemplate from './utils/pasteTemplate'
import updateChecker from './utils/updateChecker'
import pkg from '../../package.json'
import picBed from '../datastore/pic-bed'
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}
if (process.env.DEBUG_ENV === 'debug') {
  global.__static = require('path').join(__dirname, '../../static').replace(/\\/g, '\\\\')
}

let window
let settingWindow
let miniWindow
let tray
let menu
let contextMenu
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`
const settingWinURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080/#setting/upload`
  : `file://${__dirname}/index.html#setting/upload`
const miniWinURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080/#mini-page`
  : `file://${__dirname}/index.html#mini-page`

const uploadFailed = () => {
  const notification = new Notification({
    title: '上传失败',
    body: '请检查你的图床配置！'
  })
  notification.show()
}

function createTray () {
  const menubarPic = process.platform === 'darwin' ? `${__static}/menubar.png` : `${__static}/menubar-nodarwin.png`
  tray = new Tray(menubarPic)
  const submenu = picBed.map(item => {
    return {
      label: item.name,
      type: 'radio',
      checked: db.read().get('picBed.current').value() === item.type,
      click () {
        db.read().set('picBed.current', item.type).write()
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
          settingWindow.show()
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
      submenu
    },
    {
      label: '打开更新助手',
      type: 'checkbox',
      checked: db.get('picBed.showUpdateTip').value(),
      click () {
        const value = db.read().get('picBed.showUpdateTip').value()
        db.read().set('picBed.showUpdateTip', !value).write()
      }
    },
    {
      role: 'quit',
      label: '退出'
    }
  ])
  tray.on('right-click', () => {
    if (window) {
      window.hide()
    }
    tray.popUpContextMenu(contextMenu)
  })
  tray.on('click', () => {
    if (process.platform === 'darwin') {
      let img = clipboard.readImage()
      let obj = []
      if (!img.isEmpty()) {
        // 从剪贴板来的图片默认转为png
        const imgUrl = 'data:image/png;base64,' + Buffer.from(img.toPNG(), 'binary').toString('base64')
        obj.push({
          width: img.getSize().width,
          height: img.getSize().height,
          imgUrl
        })
      }
      toggleWindow()
      setTimeout(() => {
        window.webContents.send('clipboardFiles', obj)
      }, 0)
    } else {
      if (window) {
        window.hide()
      }
      if (settingWindow === null) {
        createSettingWindow()
        settingWindow.show()
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
    tray.setImage(`${__static}/upload.png`)
  })

  tray.on('drag-end', () => {
    tray.setImage(`${__static}/menubar.png`)
  })

  tray.on('drop-files', async (event, files) => {
    const pasteStyle = db.read().get('picBed.pasteStyle').value() || 'markdown'
    const imgs = await uploader(files, 'imgFromPath', window.webContents)
    if (imgs !== false) {
      for (let i in imgs) {
        clipboard.writeText(pasteTemplate(pasteStyle, imgs[i].imgUrl))
        const notification = new Notification({
          title: '上传成功',
          body: imgs[i].imgUrl,
          icon: files[i]
        })
        setTimeout(() => {
          notification.show()
        }, i * 100)
      }
      imgs.forEach(item => {
        db.read().get('uploaded').insert(item).write()
      })
      window.webContents.send('dragFiles', imgs)
    } else {
      uploadFailed()
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
      backgroundThrottling: false
    }
  })

  window.loadURL(winURL)

  window.on('closed', () => {
    window = null
  })

  window.on('blur', () => {
    window.hide()
  })
}

const createMiniWidow = () => {
  if (miniWindow) {
    return false
  }
  let obj = {
    height: 64,
    width: 64,
    show: true,
    frame: false,
    fullscreenable: false,
    resizable: false,
    transparent: true,
    icon: `${__static}/logo.png`,
    webPreferences: {
      backgroundThrottling: false
    }
  }

  if (process.platform === 'linux') {
    obj.transparent = false
  }

  if (db.read().get('miniWindowOntop').value()) {
    obj.alwaysOnTop = true
  }

  miniWindow = new BrowserWindow(obj)

  miniWindow.loadURL(miniWinURL)

  miniWindow.on('closed', () => {
    miniWindow = null
  })
}

const createSettingWindow = () => {
  const options = {
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
      backgroundThrottling: false
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

  settingWindow.loadURL(settingWinURL)

  settingWindow.on('closed', () => {
    settingWindow = null
    if (process.platform === 'linux') {
      app.quit()
    }
  })
  createMenu()
  createMiniWidow()
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
    menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  }
}

const getWindowPosition = () => {
  const windowBounds = window.getBounds()
  const trayBounds = tray.getBounds()
  const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))
  const y = Math.round(trayBounds.y + trayBounds.height - 10)

  return {
    x,
    y
  }
}

const toggleWindow = () => {
  if (window.isVisible()) {
    window.hide()
  } else {
    showWindow()
  }
}

const showWindow = () => {
  const position = getWindowPosition()
  window.setPosition(position.x, position.y, false)
  window.webContents.send('updateFiles')
  window.show()
  window.focus()
}

const uploadClipboardFiles = async () => {
  let img = clipboard.readImage()
  let uploadImg = null
  if (!img.isEmpty()) {
    // 从剪贴板来的图片默认转为png
    const imgUrl = 'data:image/png;base64,' + Buffer.from(img.toPNG(), 'binary').toString('base64')
    uploadImg = {
      width: img.getSize().width,
      height: img.getSize().height,
      imgUrl
    }
  }
  let win
  if (miniWindow.isVisible) {
    win = miniWindow
  } else {
    win = settingWindow || window
  }
  img = await uploader(uploadImg, 'imgFromClipboard', win.webContents)
  if (img !== false) {
    if (img.length > 0) {
      const pasteStyle = db.read().get('picBed.pasteStyle').value() || 'markdown'
      clipboard.writeText(pasteTemplate(pasteStyle, img[0].imgUrl))
      const notification = new Notification({
        title: '上传成功',
        body: img[0].imgUrl,
        icon: img[0].imgUrl
      })
      notification.show()
      img.forEach(item => {
        db.read().get('uploaded').insert(item).write()
      })
      window.webContents.send('clipboardFiles', [])
      window.webContents.send('uploadFiles', img)
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
  } else {
    uploadFailed()
  }
}

const updateDefaultPicBed = () => {
  if (process.platform === 'darwin' || process.platform === 'win32') {
    const types = picBed.map(item => item.type)
    let submenuItem = contextMenu.items[2].submenu.items
    submenuItem.forEach((item, index) => {
      const result = db.read().get('picBed.current').value() === types[index]
      if (result) {
        item.click() // It's a bug which can not set checked status
        return true
      }
    })
  } else {
    return false
  }
}

ipcMain.on('uploadClipboardFiles', async (evt, file) => {
  const img = await uploader(file, 'imgFromClipboard', window.webContents)
  if (img !== false) {
    const pasteStyle = db.read().get('picBed.pasteStyle').value() || 'markdown'
    clipboard.writeText(pasteTemplate(pasteStyle, img[0].imgUrl))
    const notification = new Notification({
      title: '上传成功',
      body: img[0].imgUrl,
      // icon: file[0]
      icon: img[0].imgUrl
    })
    notification.show()
    img.forEach(item => {
      db.read().get('uploaded').insert(item).write()
    })
    window.webContents.send('clipboardFiles', [])
    window.webContents.send('uploadFiles')
    if (settingWindow) {
      settingWindow.webContents.send('updateGallery')
    }
  } else {
    uploadFailed()
  }
})

ipcMain.on('uploadClipboardFilesFromUploadPage', () => {
  uploadClipboardFiles()
})

ipcMain.on('uploadChoosedFiles', async (evt, files) => {
  const imgs = await uploader(files, 'imgFromUploader', evt.sender)
  if (imgs !== false) {
    const pasteStyle = db.read().get('picBed.pasteStyle').value() || 'markdown'
    let pasteText = ''
    for (let i in imgs) {
      pasteText += pasteTemplate(pasteStyle, imgs[i].imgUrl) + '\r\n'
      const notification = new Notification({
        title: '上传成功',
        body: imgs[i].imgUrl,
        icon: files[i].path
      })
      setTimeout(() => {
        notification.show()
      }, i * 100)
    }
    clipboard.writeText(pasteText)
    imgs.forEach(item => {
      db.read().get('uploaded').insert(item).write()
    })
    window.webContents.send('uploadFiles', imgs)
    if (settingWindow) {
      settingWindow.webContents.send('updateGallery')
    }
  } else {
    uploadFailed()
  }
})

ipcMain.on('updateShortKey', (evt, oldKey) => {
  globalShortcut.unregisterAll()
  for (let key in oldKey) {
    globalShortcut.register(db.read().get('shortKey').value()[key], () => {
      return shortKeyHash[key]()
    })
  }
  const notification = new Notification({
    title: '操作成功',
    body: '你的快捷键已经修改成功'
  })
  notification.show()
})

ipcMain.on('updateCustomLink', (evt, oldLink) => {
  const notification = new Notification({
    title: '操作成功',
    body: '你的自定义链接格式已经修改成功'
  })
  notification.show()
})

ipcMain.on('autoStart', (evt, val) => {
  app.setLoginItemSettings({
    openAtLogin: val
  })
})

ipcMain.on('openSettingWindow', (evt) => {
  if (!settingWindow) {
    createSettingWindow()
  } else {
    settingWindow.show()
  }
  miniWindow.hide()
})

ipcMain.on('openMiniWindow', (evt) => {
  if (!miniWindow) {
    createMiniWidow()
  }
  miniWindow.show()
  miniWindow.focus()
  settingWindow.hide()
})

// update
ipcMain.on('updateDefaultPicBed', (evt) => {
  updateDefaultPicBed()
})

//  from mini window
ipcMain.on('syncPicBed', (evt) => {
  if (settingWindow) {
    settingWindow.webContents.send('syncPicBed')
  }
  updateDefaultPicBed()
})

const shortKeyHash = {
  upload: uploadClipboardFiles
}

const isSecondInstance = app.makeSingleInstance(() => {
  if (settingWindow) {
    if (settingWindow.isMinimized()) {
      settingWindow.restore()
    }
    settingWindow.focus()
  }
})

if (isSecondInstance) {
  app.quit()
}

if (process.platform === 'win32') {
  app.setAppUserModelId(pkg.build.appId)
}

if (process.env.XDG_CURRENT_DESKTOP && process.env.XDG_CURRENT_DESKTOP.includes('Unity')) {
  process.env.XDG_CURRENT_DESKTOP = 'Unity'
}

app.on('ready', () => {
  createWindow()
  createSettingWindow()
  if (process.platform === 'darwin' || process.platform === 'win32') {
    createTray()
  }
  updateChecker()

  globalShortcut.register(db.read().get('shortKey.upload').value(), () => {
    uploadClipboardFiles()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (window === null) {
    createWindow()
  }
  if (settingWindow === null) {
    createSettingWindow()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.setLoginItemSettings({
  openAtLogin: db.read().get('picBed.autoStart').value() || false
})

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
