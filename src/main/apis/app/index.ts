import {
  app,
  Menu,
  Tray,
  dialog,
  clipboard,
  systemPreferences,
  Notification
} from 'electron'
import uploader from '~/main/apis/uploader'
import getPicBeds from '~/main/utils/getPicBeds'
import db from '#/datastore'
import windowManager from '~/main/apis/window/windowManager'
import { IWindowList } from '~/main/apis/window/constants'
import picgo from '~/main/apis/picgo'
import pasteTemplate from '#/utils/pasteTemplate'
import pkg from 'root/package.json'
let contextMenu: Menu | null
let menu: Menu | null
let tray: Tray | null
export function createContextMenu () {
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

export function createTray () {
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

export function createMenu () {
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
