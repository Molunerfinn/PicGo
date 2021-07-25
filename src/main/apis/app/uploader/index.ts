import {
  Notification,
  BrowserWindow,
  ipcMain,
  WebContents
} from 'electron'
import dayjs from 'dayjs'
import picgo from '@core/picgo'
import db from '~/main/apis/core/datastore'
import windowManager from 'apis/app/window/windowManager'
import { IWindowList } from 'apis/app/window/constants'
import util from 'util'
import { IPicGo } from 'picgo/dist/src/types'
import { showNotification, calcDurationRange } from '~/main/utils/common'
import { TALKING_DATA_EVENT } from '~/universal/events/constants'
import logger from '@core/picgo/logger'

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

const handleTalkingData = (webContents: WebContents, options: IAnalyticsData) => {
  const data: ITalkingDataOptions = {
    EventId: 'upload',
    Label: options.type,
    MapKv: {
      by: options.fromClipboard ? 'clipboard' : 'files', // 上传剪贴板图片还是选择的文文件
      count: options.count, // 上传的数量
      duration: calcDurationRange(options.duration || 0), // 上传耗时
      type: options.type
    }
  }
  webContents.send(TALKING_DATA_EVENT, data)
}

class Uploader {
  private webContents: WebContents | null = null
  // private uploading: boolean = false
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
              fileName = dayjs().add(index, 'ms').format('YYYYMMDDHHmmSSS') + item.extname
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

  async upload (img?: IUploadOption): Promise<ImgInfo[]|false> {
    try {
      const startTime = Date.now()
      const output = await picgo.upload(img)
      if (Array.isArray(output) && output.some((item: ImgInfo) => item.imgUrl)) {
        if (this.webContents) {
          handleTalkingData(this.webContents, {
            fromClipboard: !img,
            type: db.get('picBed.uploader') || db.get('picBed.current') || 'smms',
            count: img ? img.length : 1,
            duration: Date.now() - startTime
          } as IAnalyticsData)
        }
        return output.filter(item => item.imgUrl)
      } else {
        return false
      }
    } catch (e) {
      logger.error(e)
      setTimeout(() => {
        showNotification({
          title: '上传失败',
          body: util.format(e.stack),
          clickToCopy: true
        })
      }, 500)
      return false
    }
  }
}

export default new Uploader()
