import {
  app,
  globalShortcut,
  protocol
} from 'electron'
import {
  createProtocol,
  installVueDevtools
} from 'vue-cli-plugin-electron-builder/lib'
import db from '#/datastore'
import { IWindowList } from 'apis/app/window/constants'
import windowManager from 'apis/app/window/windowManager'
import {
  uploadChoosedFiles,
  uploadClipboardFiles
} from 'apis/app/uploader/apis'
import beforeOpen from '~/main/utils/beforeOpen'
import updateChecker from '~/main/utils/updateChecker'
import ipcList from '~/main/events/ipcList'
import busEventList from '~/main/events/busEventList'
import fixPath from 'fix-path'
import { getUploadFiles } from '~/main/utils/handleArgv'
import bus from '@core/bus'
import {
  updateShortKeyFromVersion212
} from '~/main/migrate'
import shortKeyHandler from 'apis/app/shortKey/shortKeyHandler'
import server from '~/main/server/index'
import {
  createTray
} from 'apis/app/system'

const isDevelopment = process.env.NODE_ENV !== 'production'
protocol.registerSchemesAsPrivileged([{ scheme: 'picgo', privileges: { secure: true, standard: true } }])

beforeOpen()

// fix the $PATH in macOS
fixPath()

ipcList.listen()
busEventList.listen()

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
    windowManager.create(IWindowList.TRAY_WINDOW)
    windowManager.create(IWindowList.SETTING_WINDOW)
    if (process.platform === 'darwin' || process.platform === 'win32') {
      createTray()
    }
    db.set('needReload', false)
    updateChecker()
    // 不需要阻塞
    process.nextTick(() => {
      updateShortKeyFromVersion212(db, db.get('settings.shortKey'))
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
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
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

  app.on('will-quit', () => {
    globalShortcut.unregisterAll()
    bus.removeAllListeners()
    server.shutdown()
  })

  app.setLoginItemSettings({
    openAtLogin: db.get('settings.autoStart') || false
  })
}

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
