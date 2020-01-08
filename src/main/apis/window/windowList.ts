import {
  IWindowList,
  DELETE_WINDOW_EVENT,
  CREATE_WINDOW_EVENT,
  SETTING_WINDOW_URL,
  TRAY_WINDOW_URL,
  MINI_WINDOW_URL,
  RENAME_WINDOW_URL
} from './constants'
import { IWindowListItem } from '#/types/electron'
import bus from '~/main/utils/eventBus'
import db from '#/datastore'
import { getWindowId } from '~/main/apis/bus'
import { BrowserWindow, app } from 'electron'
import { CREATE_APP_MENU } from '~/main/apis/bus/constants'

const windowList = new Map<IWindowList, IWindowListItem>()

windowList.set(IWindowList.TRAY_WINDOW, {
  isValid: process.platform !== 'linux',
  multiple: false,
  options () {
    return {
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
    }
  },
  callback (window) {
    const id = window!.id
    window!.loadURL(TRAY_WINDOW_URL)
    window!.on('closed', () => {
      bus.emit(DELETE_WINDOW_EVENT, id)
    })

    window!.on('blur', () => {
      window!.hide()
    })
  }
})

windowList.set(IWindowList.SETTING_WINDOW, {
  isValid: true,
  multiple: false,
  options () {
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
    return options
  },
  callback (window) {
    const id = window!.id
    window!.loadURL(SETTING_WINDOW_URL)
    window!.on('closed', () => {
      bus.emit('toggleShortKeyModifiedMode', false)
      bus.emit(DELETE_WINDOW_EVENT, id)
      if (process.platform === 'linux') {
        process.nextTick(() => {
          app.quit()
        })
      }
    })
    bus.emit(CREATE_APP_MENU)
    bus.emit(CREATE_WINDOW_EVENT, IWindowList.MINI_WINDOW)
  }
})

windowList.set(IWindowList.MINI_WINDOW, {
  isValid: process.platform !== 'darwin',
  multiple: false,
  options () {
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
    return obj
  },
  callback (window) {
    const id = window!.id
    window!.loadURL(MINI_WINDOW_URL)
    window!.on('closed', () => {
      bus.emit(DELETE_WINDOW_EVENT, id)
    })
  }
})

windowList.set(IWindowList.RENAME_WINDOW, {
  isValid: true,
  multiple: true,
  options () {
    let options: IBrowserWindowOptions = {
      height: 175,
      width: 300,
      show: true,
      fullscreenable: false,
      resizable: false,
      vibrancy: 'ultra-dark',
      webPreferences: {
        nodeIntegration: true,
        nodeIntegrationInWorker: true,
        backgroundThrottling: false
      }
    }
    if (process.platform !== 'darwin') {
      options.show = true
      options.backgroundColor = '#3f3c37'
      options.autoHideMenuBar = true
      options.transparent = false
    }
    return options
  },
  async callback (window) {
    window!.loadURL(RENAME_WINDOW_URL)
    const currentWindowId = await getWindowId()
    const currentWindow = BrowserWindow.fromId(currentWindowId)
    if (currentWindow && currentWindow.isVisible()) {
    // bounds: { x: 821, y: 75, width: 800, height: 450 }
      const bounds = currentWindow.getBounds()
      const positionX = bounds.x + bounds.width / 2 - 150
      let positionY
      // if is the settingWindow
      if (bounds.height > 400) {
        positionY = bounds.y + bounds.height / 2 - 88
      } else { // if is the miniWindow
        positionY = bounds.y + bounds.height / 2
      }
      window!.setPosition(positionX, positionY, false)
    }
  }
})

export default windowList
