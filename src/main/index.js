'use strict'

import uploader from './utils/uploader.js'
import { app, BrowserWindow, Tray, Menu, Notification, clipboard, ipcMain } from 'electron'
import db from '../datastore'
import pasteTemplate from './utils/pasteTemplate'
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let window
let settingWindow
let tray
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`
const settingWinURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080/#setting/upload`
  : `file://${__dirname}/index.html#setting/upload`

function createTray () {
  tray = new Tray(`${__static}/menubarDefaultTemplate.png`)
  const contextMenu = Menu.buildFromTemplate([
    {
      role: 'quit',
      label: 'Quit'
    },
    {
      label: '打开详细窗口',
      click () {
        if (settingWindow === null) {
          createSettingWindow()
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
        }
      ]
    }
  ])
  tray.on('right-click', () => {
    window.hide()
    tray.popUpContextMenu(contextMenu)
  })
  tray.on('click', () => {
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
  })

  tray.on('drag-enter', () => {
    tray.setImage(`${__static}/upload.png`)
  })

  tray.on('drag-end', () => {
    tray.setImage(`${__static}/menubarDefaultTemplate.png`)
  })

  tray.on('drop-files', async (event, files) => {
    const pasteStyle = db.read().get('picBed.pasteStyle').value() || 'markdown'
    const imgs = await uploader(files, 'imgFromPath', window.webContents)
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
  })
  toggleWindow()
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
}

const createSettingWindow = () => {
  settingWindow = new BrowserWindow({
    height: 450,
    width: 800,
    show: true,
    frame: true,
    center: true,
    fullscreenable: false,
    resizable: false,
    title: 'Pic',
    vibrancy: 'ultra-dark',
    transparent: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      backgroundThrottling: false
    }
  })

  settingWindow.loadURL(settingWinURL)

  settingWindow.on('closed', () => {
    settingWindow = null
  })
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

ipcMain.on('uploadClipboardFiles', async (evt, file) => {
  const img = await uploader(file, 'imgFromClipboard', window.webContents)
  const pasteStyle = db.read().get('picBed.pasteStyle').value() || 'markdown'
  clipboard.writeText(pasteTemplate(pasteStyle, img[0].imgUrl))
  const notification = new Notification({
    title: '上传成功',
    body: img[0].imgUrl,
    icon: file[0]
  })
  notification.show()
  window.webContents.send('clipboardFiles', [])
  window.webContents.send('uploadFiles', img)
})

ipcMain.on('uploadChoosedFiles', async (evt, files) => {
  const imgs = await uploader(files, 'imgFromUploader', settingWindow.webContents)
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
})

app.on('ready', () => {
  createWindow()
  createTray()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (window === null || settingWindow === null) {
    createWindow()
    createTray()
  }
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
