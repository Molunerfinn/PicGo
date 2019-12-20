import {
  app,
  Notification,
  BrowserWindow,
  ipcMain,
  WebContents
} from 'electron'
import path from 'path'
import dayjs from 'dayjs'
import PicGoCore from '~/universal/types/picgo'

// eslint-disable-next-line
const requireFunc = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require
const PicGo = requireFunc('picgo') as typeof PicGoCore
const STORE_PATH = app.getPath('userData')
const CONFIG_PATH = path.join(STORE_PATH, '/data.json')
const renameURL = process.env.NODE_ENV === 'development'
  ? `${(process.env.WEBPACK_DEV_SERVER_URL as string)}#rename-page`
  : `picgo://./index.html#rename-page`

// type BrowserWindowOptions = {
//   height: number,
//   width: number,
//   show: boolean,
//   fullscreenable: boolean,
//   resizable: boolean,
//   vibrancy: string | any,
//   webPreferences: {
//     nodeIntegration: boolean,
//     nodeIntegrationInWorker: boolean,
//     backgroundThrottling: boolean
//   },
//   backgroundColor?: string
//   autoHideMenuBar?: boolean
//   transparent?: boolean
// }

const createRenameWindow = (win: BrowserWindow) => {
  let options: BrowserWindowOptions = {
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
  if (win.isVisible()) {
    // bounds: { x: 821, y: 75, width: 800, height: 450 }
    const bounds = win.getBounds()
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
      window.hide()
    })
    window.on('close', () => {
      resolve(null)
      ipcMain.removeAllListeners(`rename${id}`)
    })
  })
}

class Uploader {
  private picgo: PicGoCore
  private webContents: WebContents
  private img: undefined | string[]
  constructor (img: undefined | string[], webContents: WebContents, picgo: PicGoCore | undefined = undefined) {
    this.img = img
    this.webContents = webContents
    this.picgo = picgo || new PicGo(CONFIG_PATH)
  }

  upload (): Promise<ImgInfo[]|false> {
    const win = BrowserWindow.fromWebContents(this.webContents)
    const picgo = this.picgo
    picgo.config.debug = true
    // for picgo-core
    picgo.config.PICGO_ENV = 'GUI'
    let input = this.img

    picgo.helper.beforeUploadPlugins.register('renameFn', {
      handle: async ctx => {
        const rename = picgo.getConfig('settings.rename')
        const autoRename = picgo.getConfig('settings.autoRename')
        await Promise.all(ctx.output.map(async (item, index) => {
          let name: undefined | string | null
          let fileName: string | undefined
          if (autoRename) {
            fileName = dayjs().add(index, 'second').format('YYYYMMDDHHmmss') + item.extname
          } else {
            fileName = item.fileName
          }
          if (rename) {
            const window = createRenameWindow(win)
            await waitForShow(window.webContents)
            window.webContents.send('rename', fileName, window.webContents.id)
            name = await waitForRename(window, window.webContents.id)
          }
          item.fileName = name || fileName
        }))
      }
    })

    picgo.on('beforeTransform', ctx => {
      if (ctx.getConfig('settings.uploadNotification')) {
        const notification = new Notification({
          title: '上传进度',
          body: '正在上传'
        })
        notification.show()
      }
    })

    picgo.upload(input)

    picgo.on('notification', message => {
      const notification = new Notification(message)
      notification.show()
    })

    picgo.on('uploadProgress', progress => {
      this.webContents.send('uploadProgress', progress)
    })

    return new Promise((resolve) => {
      picgo.on('finished', ctx => {
        if (ctx.output.every((item: ImgInfo) => item.imgUrl)) {
          resolve(ctx.output)
        } else {
          resolve(false)
        }
      })
      picgo.on('failed', ctx => {
        const notification = new Notification({
          title: '上传失败',
          body: '请检查配置和上传的文件是否符合要求'
        })
        notification.show()
        resolve(false)
      })
    })
  }
}

export default Uploader
