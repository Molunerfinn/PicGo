import {
  app,
  Menu,
  Tray,
  dialog,
  clipboard,
  systemPreferences,
  Notification
} from 'electron'
import uploader from 'apis/app/uploader'
import getPicBeds from '~/main/utils/getPicBeds'
import db, { GalleryDB } from '~/main/apis/core/datastore'
import windowManager from 'apis/app/window/windowManager'
import { IWindowList } from '#/types/enum'
import picgo from '@core/picgo'
import pasteTemplate from '~/main/utils/pasteTemplate'
import pkg from 'root/package.json'
import { handleCopyUrl } from '~/main/utils/common'
import { privacyManager } from '~/main/utils/privacyManager'
import { T } from '#/i18n'
let contextMenu: Menu | null
let menu: Menu | null
let tray: Tray | null
export function createContextMenu () {
  const picBeds = getPicBeds()
  if (process.platform === 'darwin' || process.platform === 'win32') {
    const submenu = picBeds.filter(item => item.visible).map(item => {
      return {
        label: item.name,
        type: 'radio',
        checked: db.get('picBed.current') === item.type,
        click () {
          picgo.saveConfig({
            'picBed.current': item.type,
            'picBed.uploader': item.type
          })
          if (windowManager.has(IWindowList.SETTING_WINDOW)) {
            windowManager.get(IWindowList.SETTING_WINDOW)!.webContents.send('syncPicBed')
          }
        }
      }
    })
    contextMenu = Menu.buildFromTemplate([
      {
        label: T('ABOUT'),
        click () {
          dialog.showMessageBox({
            title: 'PicGo',
            message: 'PicGo',
            detail: `Version: ${pkg.version}\nAuthor: Molunerfinn\nGithub: https://github.com/Molunerfinn/PicGo`
          })
        }
      },
      {
        label: T('OPEN_MAIN_WINDOW'),
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
        label: T('CHOOSE_DEFAULT_PICBED'),
        type: 'submenu',
        // @ts-ignore
        submenu
      },
      // @ts-ignore
      {
        label: T('OPEN_UPDATE_HELPER'),
        type: 'checkbox',
        checked: db.get('settings.showUpdateTip'),
        click () {
          const value = db.get('settings.showUpdateTip')
          db.set('settings.showUpdateTip', !value)
        }
      },
      {
        label: T('PRIVACY_AGREEMENT'),
        click () {
          privacyManager.show(false)
        }
      },
      {
        label: T('RELOAD_APP'),
        click () {
          app.relaunch()
          app.exit(0)
        }
      },
      // @ts-ignore
      {
        role: 'quit',
        label: T('QUIT')
      }
    ])
  } else if (process.platform === 'linux') {
    // TODO 图床选择功能
    // 由于在Linux难以像在Mac和Windows上那样在点击时构造ContextMenu，
    // 暂时取消这个选单，避免引起和设置中启用的图床不一致

    // TODO 重启应用功能
    // 目前的实现无法正常工作

    contextMenu = Menu.buildFromTemplate([
      {
        label: T('OPEN_MAIN_WINDOW'),
        click () {
          const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)
          settingWindow!.show()
          settingWindow!.focus()
          if (windowManager.has(IWindowList.MINI_WINDOW)) {
            windowManager.get(IWindowList.MINI_WINDOW)!.hide()
          }
        }
      },
      // @ts-ignore
      {
        label: T('OPEN_UPDATE_HELPER'),
        type: 'checkbox',
        checked: db.get('settings.showUpdateTip'),
        click () {
          const value = db.get('settings.showUpdateTip')
          db.set('settings.showUpdateTip', !value)
        }
      },
      {
        label: T('ABOUT'),
        click () {
          dialog.showMessageBox({
            title: 'PicGo',
            message: 'PicGo',
            buttons: ['Ok'],
            detail: `Version: ${pkg.version}\nAuthor: Molunerfinn\nGithub: https://github.com/Molunerfinn/PicGo`
          })
        }
      },
      // @ts-ignore
      {
        role: 'quit',
        label: T('QUIT')
      }
    ])
  }
}

export function createTray () {
  const menubarPic = process.platform === 'darwin' ? `${__static}/menubar.png` : `${__static}/menubar-nodarwin.png`
  tray = new Tray(menubarPic)
  // click事件在Mac和Windows上可以触发（在Ubuntu上无法触发，Unity不支持）
  if (process.platform === 'darwin' || process.platform === 'win32') {
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
          const img = clipboard.readImage()
          const obj: ImgInfo[] = []
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

    // drop-files only be supported in macOS
    // so the tray window must be available
    tray.on('drop-files', async (event: Event, files: string[]) => {
      const pasteStyle = db.get('settings.pasteStyle') || 'markdown'
      const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW)!
      const imgs = await uploader
        .setWebContents(trayWindow.webContents)
        .upload(files)
      if (imgs !== false) {
        const pasteText: string[] = []
        for (let i = 0; i < imgs.length; i++) {
          pasteText.push(pasteTemplate(pasteStyle, imgs[i], db.get('settings.customLink')))
          const notification = new Notification({
            title: T('UPLOAD_SUCCEED'),
            body: imgs[i].imgUrl!,
            icon: files[i]
          })
          setTimeout(() => {
            notification.show()
          }, i * 100)
          await GalleryDB.getInstance().insert(imgs[i])
        }
        handleCopyUrl(pasteText.join('\n'))
        trayWindow.webContents.send('dragFiles', imgs)
      }
    })
    // toggleWindow()
  } else if (process.platform === 'linux') {
  // click事件在Ubuntu上无法触发，Unity不支持（在Mac和Windows上可以触发）
  // 需要使用 setContextMenu 设置菜单
    createContextMenu()
    tray!.setContextMenu(contextMenu)
  }
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
