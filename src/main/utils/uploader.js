import {
  app,
  Notification,
  BrowserWindow,
  ipcMain
} from 'electron'
import path from 'path'
import dayjs from 'dayjs'

// eslint-disable-next-line
const requireFunc = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require
const PicGo = requireFunc('picgo')
const STORE_PATH = app.getPath('userData')
const CONFIG_PATH = path.join(STORE_PATH, '/data.json')
const renameURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080/#rename-page` : `file://${__dirname}/index.html#rename-page`

const createRenameWindow = () => {
  let options = {
    height: 175,
    width: 300,
    show: true,
    fullscreenable: false,
    resizable: false,
    vibrancy: 'ultra-dark',
    webPreferences: {
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
  return window
}

const waitForShow = (webcontent) => {
  return new Promise((resolve, reject) => {
    webcontent.on('dom-ready', () => {
      resolve()
    })
  })
}

const waitForRename = (window, id) => {
  return new Promise((resolve, reject) => {
    ipcMain.once(`rename${id}`, (evt, newName) => {
      resolve(newName)
      window.hide()
    })
    window.on('close', () => {
      resolve(null)
      ipcMain.removeAllListeners(`rename${id}`)
    })
  })
}

const uploader = (img, type, webContents) => {
  const picgo = new PicGo(CONFIG_PATH)
  picgo.config.debug = true
  let input = img

  picgo.helper.beforeUploadPlugins.register('renameFn', {
    handle: async ctx => {
      const rename = picgo.getConfig('settings.rename')
      const autoRename = picgo.getConfig('settings.autoRename')
      await Promise.all(ctx.output.map(async (item, index) => {
        let name
        let fileName
        if (autoRename) {
          fileName = dayjs().add(index, 'second').format('YYYYMMDDHHmmss') + item.extname
        } else {
          fileName = item.fileName
        }
        if (rename) {
          const window = createRenameWindow()
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
    webContents.send('uploadProgress', progress)
  })

  return new Promise((resolve) => {
    picgo.on('finished', ctx => {
      if (ctx.output.every(item => item.imgUrl)) {
        resolve(ctx.output)
      } else {
        resolve(false)
      }
    })
    picgo.on('failed', ctx => {
      console.log(ctx)
      resolve(false)
    })
  })
}

export default uploader
