import {
  SETTING_WINDOW_URL,
  TRAY_WINDOW_URL,
  MINI_WINDOW_URL,
  RENAME_WINDOW_URL,
  TOOLBOX_WINDOW_URL
} from './constants'
import { IStartupMode, IWindowList } from '#/types/enum'
import bus from '@core/bus'
import { CREATE_APP_MENU } from '@core/bus/constants'
import db from '~/main/apis/core/datastore'
import { TOGGLE_SHORTKEY_MODIFIED_MODE } from '#/events/constants'
import { app } from 'electron'
import { T } from '~/main/i18n'
import { isLinux } from '~/universal/utils/common'
// import { URLSearchParams } from 'url'

const windowList = new Map<IWindowList, IWindowListItem>()

const handleWindowParams = (windowURL: string) => {
  // const [baseURL, hash = ''] = windowURL.split('#')
  // const search = new URLSearchParams()
  // const lang = i18n.getLanguage()
  // search.append('lang', lang)
  // return `${baseURL}?${search.toString()}#${hash}`
  return windowURL
}

export const isWindowShouldShowOnStartup = (currentWindow: IWindowList) => {
  const startupMode = db.get('settings.startupMode') || (isLinux ? IStartupMode.SHOW_MINI_WINDOW : IStartupMode.HIDE)
  switch (currentWindow) {
    case IWindowList.MINI_WINDOW: {
      return startupMode === IStartupMode.SHOW_MINI_WINDOW
    }
    case IWindowList.SETTING_WINDOW: {
      return startupMode === IStartupMode.SHOW_MAIN_WINDOW
    }
    default: {
      return false
    }
  }
}

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
        nodeIntegration: !!process.env.ELECTRON_NODE_INTEGRATION,
        contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
        nodeIntegrationInWorker: true,
        backgroundThrottling: false,
        webSecurity: false
      }
    }
  },
  callback (window) {
    window.loadURL(handleWindowParams(TRAY_WINDOW_URL))
    window.on('blur', () => {
      window.hide()
    })
  }
})

windowList.set(IWindowList.SETTING_WINDOW, {
  isValid: true,
  multiple: false,
  options () {
    const showDockIcon = db.get('settings.showDockIcon') !== false
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
      skipTaskbar: !showDockIcon,
      titleBarStyle: 'hidden',
      webPreferences: {
        backgroundThrottling: false,
        nodeIntegration: !!process.env.ELECTRON_NODE_INTEGRATION,
        contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
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
      options.skipTaskbar = false
    }
    return options
  },
  callback (window, windowManager) {
    window.loadURL(handleWindowParams(SETTING_WINDOW_URL))
    window.on('closed', () => {
      bus.emit(TOGGLE_SHORTKEY_MODIFIED_MODE, false)
      if (process.platform === 'linux') {
        process.nextTick(() => {
          app.quit()
        })
      }
    })
    bus.emit(CREATE_APP_MENU)
    windowManager.create(IWindowList.MINI_WINDOW)
  }
})

windowList.set(IWindowList.MINI_WINDOW, {
  isValid: process.platform !== 'darwin',
  multiple: false,
  options () {
    const obj: IBrowserWindowOptions = {
      height: 64,
      width: 64,
      show: isLinux,
      frame: false,
      fullscreenable: false,
      skipTaskbar: true,
      resizable: false,
      transparent: process.platform !== 'linux',
      icon: `${__static}/logo.png`,
      webPreferences: {
        backgroundThrottling: false,
        nodeIntegration: !!process.env.ELECTRON_NODE_INTEGRATION,
        contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
        nodeIntegrationInWorker: true
      }
    }

    if (db.get('settings.miniWindowOnTop')) {
      obj.alwaysOnTop = true
    }
    return obj
  },
  callback (window) {
    window.loadURL(handleWindowParams(MINI_WINDOW_URL))
  }
})

windowList.set(IWindowList.RENAME_WINDOW, {
  isValid: true,
  multiple: true,
  options () {
    const options: IBrowserWindowOptions = {
      height: 175,
      width: 300,
      show: true,
      fullscreenable: false,
      resizable: false,
      vibrancy: 'ultra-dark',
      webPreferences: {
        nodeIntegration: !!process.env.ELECTRON_NODE_INTEGRATION,
        contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
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
  async callback (window, windowManager) {
    window.loadURL(handleWindowParams(RENAME_WINDOW_URL))
    const currentWindow = windowManager.getAvailableWindow()
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
      window.setPosition(positionX, positionY, false)
    }
  }
})

windowList.set(IWindowList.TOOLBOX_WINDOW, {
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
      title: `PicGo ${T('TOOLBOX')}`,
      vibrancy: 'ultra-dark',
      icon: `${__static}/logo.png`,
      webPreferences: {
        backgroundThrottling: false,
        nodeIntegration: !!process.env.ELECTRON_NODE_INTEGRATION,
        contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
        nodeIntegrationInWorker: true,
        webSecurity: false
      }
    }
    if (process.platform !== 'darwin') {
      options.backgroundColor = '#3f3c37'
      options.autoHideMenuBar = true
      options.transparent = false
    }
    return options
  },
  async callback (window, windowManager) {
    window.loadURL(TOOLBOX_WINDOW_URL)
    const currentWindow = windowManager.getAvailableWindow()
    if (currentWindow && currentWindow.isVisible()) {
    // bounds: { x: 821, y: 75, width: 800, height: 450 }
      const bounds = currentWindow.getBounds()
      const positionX = bounds.x + bounds.width / 2 - 400
      let positionY
      // if is the settingWindow
      if (bounds.height > 400) {
        positionY = bounds.y + bounds.height / 2 - 225
      } else { // if is the miniWindow
        positionY = bounds.y + bounds.height / 2
      }
      window.setPosition(positionX, positionY, false)
    }
  }
})

export default windowList
