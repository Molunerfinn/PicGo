import {
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
import { IPicGo } from 'picgo/dist/src/types'
import { showNotification } from '~/main/utils/common'
import { BAIDU_TONGJI_EVENT } from '~/universal/events/constants'

const waitForShow = (webcontent: WebContents) => {
  return new Promise<void>((resolve, reject) => {
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

const handleBaiduTongJi = (webContents: WebContents, options: IAnalyticsData) => {
  const data: IBaiduTongJiOptions = {
    category: 'upload',
    action: options.fromClipboard ? 'clipboard' : 'files', // 上传剪贴板图片还是选择的文件
    opt_label: JSON.stringify({
      type: options.type, // 上传的图床种类
      count: options.count, // 上传的图片数量
      timestamp: dayjs().format('YYYYMMDDHHmmss'), // 上传完成的时间戳
      duration: options.duration // 耗时
    })
  }
  webContents.send(BAIDU_TONGJI_EVENT, data)
}

class Uploader {
  private webContents: WebContents | null = null
  private uploading: boolean = false
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
      handle: async (ctx: IPicGo) => {
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
    if (this.uploading) {
      showNotification({
        title: '上传失败',
        body: '前序上传还在继续，请稍后再试'
      })
      return Promise.resolve(false)
    }
    return new Promise((resolve) => {
      try {
        const startTime = Date.now()
        this.uploading = true
        picgo.upload(img)
        picgo.once('finished', ctx => {
          this.uploading = false
          if (ctx.output.every((item: ImgInfo) => item.imgUrl)) {
            if (this.webContents) {
              handleBaiduTongJi(this.webContents, {
                fromClipboard: !img,
                type: db.get('picBed.current') || 'smms',
                count: img ? img.length : 1,
                duration: Date.now() - startTime
              } as IAnalyticsData)
            }
            resolve(ctx.output)
          } else {
            resolve(false)
          }
          picgo.removeAllListeners('failed')
        })
        picgo.once('failed', (e: Error) => {
          this.uploading = false
          setTimeout(() => {
            showNotification({
              title: '上传失败',
              body: util.format(e.stack),
              clickToCopy: true
            })
          }, 500)
          picgo.removeAllListeners('finished')
          resolve(false)
        })
      } catch (e) {
        this.uploading = false
        picgo.removeAllListeners('failed')
        picgo.removeAllListeners('finished')
        resolve([])
      }
    })
  }
}

export default new Uploader()
