import {
  app,
  Notification,
  BrowserWindow,
  ipcMain,
  WebContents
} from 'electron'
import dayjs from 'dayjs'
import picgo from '~/main/utils/picgo'
import db from '#/datastore'

const renameURL = process.env.NODE_ENV === 'development'
  ? `${(process.env.WEBPACK_DEV_SERVER_URL as string)}#rename-page`
  : `picgo://./index.html#rename-page`

const createRenameWindow = (currentWindow: BrowserWindow) => {
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

  const window = new BrowserWindow(options)
  window.loadURL(renameURL)
  // check if this window is visible
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
  return window
}

const waitForShow = (webcontent: WebContents) => {
  return new Promise((resolve, reject) => {
    webcontent.on('did-finish-load', () => {
      resolve()
    })
  })
}

const waitForRename = (window: BrowserWindow, id: number): Promise<string|null> => {
  return new Promise((resolve, reject) => {
    ipcMain.once(`rename${id}`, (evt: Event, newName: string) => {
      resolve(newName)
      window.close()
    })
    window.on('close', () => {
      resolve(null)
      ipcMain.removeAllListeners(`rename${id}`)
    })
  })
}

class Uploader {
  private webContents: WebContents | null = null
  private currentWindow: BrowserWindow | null = null
  constructor () {
    this.init()
  }

  init () {
    picgo.on('notification', message => {
      const notification = new Notification(message)
      notification.show()
    })

    picgo.on('uploadProgress', progress => {
      this.webContents!.send('uploadProgress', progress)
    })
    picgo.on('beforeTransform', ctx => {
      if (db.get('settings.uploadNotification')) {
        const notification = new Notification({
          title: '上传进度',
          body: '正在上传'
        })
        notification.show()
      }
    })
    picgo.helper.beforeUploadPlugins.register('renameFn', {
      handle: async ctx => {
        const rename = db.get('settings.rename')
        const autoRename = db.get('settings.autoRename')
        await Promise.all(ctx.output.map(async (item, index) => {
          let name: undefined | string | null
          let fileName: string | undefined
          if (autoRename) {
            fileName = dayjs().add(index, 'second').format('YYYYMMDDHHmmss') + item.extname
          } else {
            fileName = item.fileName
          }
          if (rename) {
            const window = createRenameWindow(this.currentWindow!)
            await waitForShow(window.webContents)
            window.webContents.send('rename', fileName, window.webContents.id)
            name = await waitForRename(window, window.webContents.id)
          }
          item.fileName = name || fileName
        }))
      }
    })
  }

  setWebContents (webContents: WebContents) {
    this.webContents = webContents
    return this
  }

  upload (img?: IUploadOption): Promise<ImgInfo[]|false> {
    this.currentWindow = BrowserWindow.fromWebContents(this.webContents!)

    picgo.upload(img)

    return new Promise((resolve) => {
      picgo.once('finished', ctx => {
        if (ctx.output.every((item: ImgInfo) => item.imgUrl)) {
          resolve(ctx.output)
        } else {
          resolve(false)
        }
        picgo.removeAllListeners('failed')
      })
      picgo.once('failed', ctx => {
        setTimeout(() => {
          const notification = new Notification({
            title: '上传失败',
            body: '请检查配置和上传的文件是否符合要求'
          })
          notification.show()
        }, 500)
        picgo.removeAllListeners('finished')
        resolve(false)
      })
    })
  }
}

export default new Uploader()
