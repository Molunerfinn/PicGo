import './errorHandler'
import {
  app,
  globalShortcut,
  protocol,
  Notification
} from 'electron'
import {
  createProtocol
} from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import beforeOpen from '~/main/utils/beforeOpen'
import ipcList from '~/main/events/ipcList'
import busEventList from '~/main/events/busEventList'
import { IWindowList } from '#/types/enum'
import windowManager from 'apis/app/window/windowManager'
import {
  updateShortKeyFromVersion212,
  migrateGalleryFromVersion230
} from '~/main/migrate'
import {
  uploadChoosedFiles,
  uploadClipboardFiles
} from 'apis/app/uploader/apis'
import {
  createTray
} from 'apis/app/system'
import server from '~/main/server/index'
import updateChecker from '~/main/utils/updateChecker'
import shortKeyHandler from 'apis/app/shortKey/shortKeyHandler'
import { getUploadFiles } from '~/main/utils/handleArgv'
import db, { GalleryDB } from '~/main/apis/core/datastore'
import bus from '@core/bus'
import { privacyManager } from '~/main/utils/privacyManager'
import logger from 'apis/core/picgo/logger'
import picgo from 'apis/core/picgo'
import fixPath from './fixPath'
import { initI18n } from '~/main/utils/handleI18n'

const isDevelopment = process.env.NODE_ENV !== 'production'

const handleStartUpFiles = (argv: string[], cwd: string) => {
  const files = getUploadFiles(argv, cwd, logger)
  if (files === null || files.length > 0) { // 如果有文件列表作为参数，说明是命令行启动
    if (files === null) {
      logger.info('cli -> uploading file from clipboard')
      uploadClipboardFiles()
    } else {
      logger.info('cli -> uploading files from cli', ...files.map(item => item.path))
      const win = windowManager.getAvailableWindow()
      uploadChoosedFiles(win.webContents, files)
    }
    return true
  } else {
    return false
  }
}

class LifeCycle {
  private async beforeReady () {
    protocol.registerSchemesAsPrivileged([{ scheme: 'picgo', privileges: { secure: true, standard: true } }])
    // fix the $PATH in macOS & linux
    fixPath()
    beforeOpen()
    initI18n()
    ipcList.listen()
    busEventList.listen()
    updateShortKeyFromVersion212(db, db.get('settings.shortKey'))
    await migrateGalleryFromVersion230(db, GalleryDB.getInstance(), picgo)
  }

  private onReady () {
    const readyFunction = async () => {
      console.log('on ready')
      createProtocol('picgo')
      if (isDevelopment && !process.env.IS_TEST) {
        // Install Vue Devtools
        try {
          await installExtension(VUEJS_DEVTOOLS)
        } catch (e: any) {
          console.error('Vue Devtools failed to install:', e.toString())
        }
      }
      const res = await privacyManager.init()
      if (!res) {
        return app.quit()
      }
      windowManager.create(IWindowList.TRAY_WINDOW)
      windowManager.create(IWindowList.SETTING_WINDOW)
      createTray()
      db.set('needReload', false)
      updateChecker()
      // 不需要阻塞
      process.nextTick(() => {
        shortKeyHandler.init()
      })
      server.startup()
      if (process.env.NODE_ENV !== 'development') {
        handleStartUpFiles(process.argv, process.cwd())
      }

      if (global.notificationList && global.notificationList?.length > 0) {
        while (global.notificationList?.length) {
          const option = global.notificationList.pop()
          const notice = new Notification(option!)
          notice.show()
        }
      }
    }
    if (!app.isReady()) {
      app.on('ready', readyFunction)
    } else {
      readyFunction()
    }
  }

  private onRunning () {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      logger.info('detect second instance')
      const result = handleStartUpFiles(commandLine, workingDirectory)
      if (!result) {
        if (windowManager.has(IWindowList.SETTING_WINDOW)) {
          const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)!
          if (settingWindow.isMinimized()) {
            settingWindow.restore()
          }
          settingWindow.focus()
        }
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
    app.setLoginItemSettings({
      openAtLogin: db.get('settings.autoStart') || false
    })
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.molunerfinn.picgo')
    }

    if (process.env.XDG_CURRENT_DESKTOP && process.env.XDG_CURRENT_DESKTOP.includes('Unity')) {
      process.env.XDG_CURRENT_DESKTOP = 'Unity'
    }
  }

  private onQuit () {
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })

    app.on('will-quit', () => {
      globalShortcut.unregisterAll()
      bus.removeAllListeners()
      server.shutdown()
    })
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
  }

  async launchApp () {
    const gotTheLock = app.requestSingleInstanceLock()
    if (!gotTheLock) {
      app.quit()
    } else {
      await this.beforeReady()
      this.onReady()
      this.onRunning()
      this.onQuit()
    }
  }
}

const bootstrap = new LifeCycle()

export {
  bootstrap
}
