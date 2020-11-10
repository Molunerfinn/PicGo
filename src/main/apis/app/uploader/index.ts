import {
  app,
  Notification,
  BrowserWindow,
  ipcMain,
  WebContents
} from 'electron'
import dayjs from 'dayjs'
import picgo from '@core/picgo'
import db from '#/datastore'
import windowManager from 'apis/app/window/windowManager'
import { IWindowList } from 'apis/app/window/constants'
import util from 'util'

const waitForShow = (webcontent: WebContents) => {
  return new Promise((resolve, reject) => {
    webcontent.on('did-finish-load', () => {
      resolve()
    })
  })
}

const waitForRename = (window: BrowserWindow, id: number): Promise<string|null> => {
  return new Promise((resolve, reject) => {
    const windowId = window.id
    ipcMain.once(`rename${id}`, (evt: Event, newName: string) => {
      resolve(newName)
      window.close()
    })
    window.on('close', () => {
      resolve(null)
      ipcMain.removeAllListeners(`rename${id}`)
      windowManager.deleteById(windowId)
    })
  })
}

class Uploader {
  private webContents: WebContents | null = null
  constructor () {
    this.init()
  }

  init () {
    picgo.on('notification', message => {
      const notification = new Notification(message)
      notification.show()
    })

    picgo.on('uploadProgress', progress => {
      this.webContents?.send('uploadProgress', progress)
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
        if (autoRename || rename) {
          await Promise.all(ctx.output.map(async (item, index) => {
            let name: undefined | string | null
            let fileName: string | undefined
            if (autoRename) {
              fileName = dayjs().add(index, 'second').format('YYYYMMDDHHmmss') + item.extname
            } else {
              fileName = item.fileName
            }
            if (rename) {
              const window = windowManager.create(IWindowList.RENAME_WINDOW)!
              await waitForShow(window.webContents)
              window.webContents.send('rename', fileName, window.webContents.id)
              name = await waitForRename(window, window.webContents.id)
            }
            item.fileName = name || fileName
          }))
        }
      }
    })
  }

  setWebContents (webContents: WebContents) {
    this.webContents = webContents
    return this
  }

  upload (img?: IUploadOption): Promise<ImgInfo[]|false> {
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
      picgo.once('failed', (e: Error) => {
        setTimeout(() => {
          const notification = new Notification({
            title: '上传失败',
            body: util.format(e.stack)
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
