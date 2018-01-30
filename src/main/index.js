'use strict'

import uploader from './utils/uploader.js'
import { app, BrowserWindow, Tray, Menu, Notification, clipboard, ipcMain, globalShortcut, dialog } from 'electron'
import db from '../datastore'
import pasteTemplate from './utils/pasteTemplate'
import updateChecker from './utils/updateChecker'
import pkg from '../../package.json'
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
let tray
let menu
let contextMenu
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`
const settingWinURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080/#setting/upload`
  : `file://${__dirname}/index.html#setting/upload`

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
      }
    },
    {
      label: '选择默认图床',
      type: 'submenu',
      submenu: [
        {
          label: '微博图床',
          type: 'radio',
          checked: db.read().get('picBed.current').value() === 'weibo',
          click () {
            db.read().set('picBed.current', 'weibo')
              .write()
          }
        },
        {
          label: '七牛图床',
          type: 'radio',
          checked: db.read().get('picBed.current').value() === 'qiniu',
          click () {
            db.read().set('picBed.current', 'qiniu')
              .write()
          }
        },
        {
          label: '腾讯云COS',
          type: 'radio',
          checked: db.read().get('picBed.current').value() === 'tcyun',
          click () {
            db.read().set('picBed.current', 'tcyun')
              .write()
          }
        },
        {
          label: '又拍云图床',
          type: 'radio',
          checked: db.read().get('picBed.current').value() === 'upyun',
          click () {
            db.read().set('picBed.current', 'upyun')
              .write()
          }
        }
      ]
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
    window.hide()
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
      window.hide()
      if (settingWindow === null) {
        createSettingWindow()
        settingWindow.show()
      } else {
        settingWindow.show()
        settingWindow.focus()
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
      window.webContents.send('dragFiles', imgs)
    } else {
      uploadFailed()
    }
  })
  // toggleWindow()
}

const createWindow = () => {
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

  createSettingWindow()
  createMenu()
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
  if (process.platform === 'win32') {
    options.show = true
    options.frame = false
    options.backgroundColor = '#3f3c37'
  }
  settingWindow = new BrowserWindow(options)

  settingWindow.loadURL(settingWinURL)

  settingWindow.on('closed', () => {
    settingWindow = null
  })
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
  img = await uploader(uploadImg, 'imgFromClipboard', settingWindow.webContents)
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
      window.webContents.send('clipboardFiles', [])
      window.webContents.send('uploadFiles', img)
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
    window.webContents.send('clipboardFiles', [])
    window.webContents.send('uploadFiles', img)
  } else {
    uploadFailed()
  }
})

ipcMain.on('uploadClipboardFilesFromUploadPage', () => {
  uploadClipboardFiles()
})

ipcMain.on('uploadChoosedFiles', async (evt, files) => {
  const imgs = await uploader(files, 'imgFromUploader', settingWindow.webContents)
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
    window.webContents.send('uploadFiles', imgs)
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

ipcMain.on('updateDefaultPicBed', (evt) => {
  const types = ['weibo', 'qiniu', 'tcyun', 'upyun']
  let submenuItem = contextMenu.items[2].submenu.items
  submenuItem.forEach((item, index) => {
    const result = db.read().get('picBed.current').value() === types[index]
    if (result) {
      item.click() // It's a bug which can not set checked status
    }
  })
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

app.on('ready', () => {
  createWindow()
  createTray()
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
  if (window === null || settingWindow === null) {
    createWindow()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
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
