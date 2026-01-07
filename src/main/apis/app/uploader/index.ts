import {
  BrowserWindow,
  ipcMain,
  WebContents,
  clipboard
} from 'electron'
import dayjs from 'dayjs'
import picgo from '@core/picgo'
import windowManager from 'apis/app/window/windowManager'
import { IWindowList } from '#/types/enum'
import util from 'util'
import type { IPicGo } from 'picgo'
import { showNotification, getClipboardFilePathList } from '~/main/utils/common'
import { GET_RENAME_FILE_NAME, RENAME_FILE_NAME } from '~/universal/events/constants'
import logger from '@core/picgo/logger'
import { T } from '~/main/i18n'
import fse from 'fs-extra'
import path from 'path'
import { privacyManager } from '~/main/utils/privacyManager'
import writeFile from 'write-file-atomic'
import { CLIPBOARD_IMAGE_FOLDER } from '~/universal/utils/static'
import { cleanupFormUploaderFiles } from '~/main/utils/cleanupFormUploaderFiles'
import { IpcMainEvent } from 'electron/main'
import { dataReportManager } from '~/main/utils/dataReport'

const waitForRename = (window: BrowserWindow, id: number): Promise<string|null> => {
  return new Promise((resolve) => {
    const windowId = window.id
    ipcMain.once(`${RENAME_FILE_NAME}${id}`, (evt: IpcMainEvent, newName: string) => {
      resolve(newName)
      window.close()
    })
    window.on('close', () => {
      resolve(null)
      ipcMain.removeAllListeners(`${RENAME_FILE_NAME}${id}`)
      windowManager.deleteById(windowId)
    })
  })
}

class Uploader {
  private webContents: WebContents | null = null
  // private uploading: boolean = false
  constructor () {
    this.init()
  }

  init () {
    picgo.on('notification', (message: IShowNotificationOption | undefined) => {
      if (!message) return
      showNotification(message)
    })

    picgo.on('uploadProgress', (progress: any) => {
      this.webContents?.send('uploadProgress', progress)
    })
    picgo.on('beforeTransform', () => {
      if (picgo.getConfig<boolean>('settings.uploadNotification')) {
        showNotification({
          title: T('UPLOAD_PROGRESS'),
          body: T('UPLOADING')
        })
      }
    })
    picgo.helper.beforeUploadPlugins.register('renameFn', {
      handle: async (ctx: IPicGo) => {
        const rename = picgo.getConfig<boolean>('settings.rename')
        const autoRename = picgo.getConfig<boolean>('settings.autoRename')
        if (autoRename || rename) {
          await Promise.all(ctx.output.map(async (item, index) => {
            let name: undefined | string | null
            let fileName: string | undefined
            if (autoRename) {
              fileName = dayjs().add(index, 'ms').format('YYYYMMDDHHmmssSSS') + item.extname
            } else {
              fileName = item.fileName
            }
            if (rename) {
              const window = windowManager.create(IWindowList.RENAME_WINDOW)!
              logger.info('wait for rename window ready...')
              ipcMain.on(GET_RENAME_FILE_NAME, (evt) => {
                if (evt.sender.id === window.webContents.id) {
                  logger.info('rename window ready, wait for rename...')
                  window.webContents.send(RENAME_FILE_NAME, fileName, item.fileName, window.webContents.id)
                }
              })
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

  /**
   * use electron's clipboard image to upload
   */
  async uploadWithBuildInClipboard (): Promise<ImgInfo[]|false> {
    let filePath = ''
    try {
      const imgPath = getClipboardFilePathList()
      if (!imgPath.length) {
        const nativeImage = clipboard.readImage()
        if (nativeImage.isEmpty()) {
          return false
        }
        const buffer = nativeImage.toPNG()
        const baseDir = picgo.baseDir
        const fileName = `${dayjs().format('YYYYMMDDHHmmssSSS')}.png`
        filePath = path.join(baseDir, CLIPBOARD_IMAGE_FOLDER, fileName)
        await writeFile(filePath, buffer)
        return await this.upload([filePath])
      } else {
        return await this.upload(imgPath)
      }
    } catch (e: any) {
      logger.error(e)
      return false
    } finally {
      if (filePath) {
        fse.unlink(filePath)
      }
    }
  }

  async upload (img?: IUploadOption): Promise<ImgInfo[]|false> {
    try {
      const privacyCheckRes = await privacyManager.check()
      if (!privacyCheckRes) {
        throw Error(T('PRIVACY_TIPS'))
      }
      const startTime = Date.now()
      const output = await picgo.upload(img)
      if (Array.isArray(output) && output.some((item: ImgInfo) => item.imgUrl)) {
        if (this.webContents) {
          dataReportManager.reportUploadData(this.webContents, {
            fromClipboard: !img,
            duration: Date.now() - startTime,
            outputList: output
          })
        }
        return output.filter(item => item.imgUrl)
      } else {
        return false
      }
    } catch (e: any) {
      logger.error(e)
      setTimeout(() => {
        showNotification({
          title: T('UPLOAD_FAILED'),
          body: util.format(e.stack),
          clickToCopy: true
        })
      }, 500)
      return false
    } finally {
      ipcMain.removeAllListeners(GET_RENAME_FILE_NAME)
      cleanupFormUploaderFiles(img)
    }
  }
}

export default new Uploader()
