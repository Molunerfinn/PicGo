import {
  app,
  globalShortcut,
  protocol,
  dialog,
  Notification
} from 'electron'
import {
  createProtocol,
  installVueDevtools
} from 'vue-cli-plugin-electron-builder/lib'
import beforeOpen from '~/main/utils/beforeOpen'
import fixPath from 'fix-path'
import ipcList from '~/main/events/ipcList'
import busEventList from '~/main/events/busEventList'
import { IWindowList } from 'apis/app/window/constants'
import windowManager from 'apis/app/window/windowManager'
import {
  updateShortKeyFromVersion212
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
import db from '#/datastore'
import bus from '@core/bus'

const isDevelopment = process.env.NODE_ENV !== 'production'
class LifeCycle {
  private beforeReady () {
    protocol.registerSchemesAsPrivileged([{ scheme: 'picgo', privileges: { secure: true, standard: true } }])
    // fix the $PATH in macOS
    fixPath()
    beforeOpen()
    ipcList.listen()
    busEventList.listen()
    updateShortKeyFromVersion212(db, db.get('settings.shortKey'))
  }
  private onReady () {
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
      createTray()
      db.set('needReload', false)
      updateChecker()
      // 不需要阻塞
      process.nextTick(() => {
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

      if (global.notificationList?.length > 0) {
        while (global.notificationList.length) {
          const option = global.notificationList.pop()
          const notice = new Notification(option!)
          notice.show()
        }
      }
    })
  }
  private onRunning () {
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
  }
  launchApp () {
    const gotTheLock = app.requestSingleInstanceLock()
    if (!gotTheLock) {
      app.quit()
    } else {
      this.beforeReady()
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
