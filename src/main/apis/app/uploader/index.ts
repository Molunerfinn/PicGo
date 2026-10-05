import {
  BrowserWindow,
  ipcMain,
  clipboard
} from 'electron'
import type { IpcMainEvent, WebContents } from 'electron'
import { AsyncLocalStorage } from 'node:async_hooks'
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
import { dataReportManager } from '~/main/utils/dataReport'
import type { UploadTask } from './types'

interface UploadTaskContext {
  active: boolean
  renameCleanups: Set<() => void>
  task: UploadTask
}

const isAvailableWebContents = (webContents: WebContents | undefined): webContents is WebContents => {
  return webContents !== undefined && !webContents.isDestroyed()
}

const waitForRename = (
  window: BrowserWindow,
  fileName: string | undefined,
  originalFileName: string | undefined,
  context: UploadTaskContext | undefined
): Promise<string | null> => {
  return new Promise((resolve) => {
    const windowId = window.id
    const replyChannel = `${RENAME_FILE_NAME}${window.webContents.id}`
    let settled = false
    let windowDeleted = false

    const deleteWindow = () => {
      if (windowDeleted) return
      windowDeleted = true
      windowManager.deleteById(windowId)
    }
    const cleanup = () => {
      ipcMain.removeListener(GET_RENAME_FILE_NAME, handleReady)
      ipcMain.removeListener(replyChannel, handleReply)
      window.removeListener('close', handleClose)
      context?.renameCleanups.delete(cancel)
    }
    const finish = (name: string | null) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(name)
    }
    const closeWindow = () => {
      if (!window.isDestroyed()) {
        window.close()
      }
      deleteWindow()
    }
    function handleReady (evt: IpcMainEvent) {
      if (evt.sender.id === window.webContents.id) {
        logger.info('rename window ready, wait for rename...')
        window.webContents.send(RENAME_FILE_NAME, fileName, originalFileName, window.webContents.id)
      }
    }
    function handleReply (_evt: IpcMainEvent, newName: string) {
      finish(newName)
      closeWindow()
    }
    function handleClose () {
      finish(null)
      deleteWindow()
    }
    function cancel () {
      finish(null)
      closeWindow()
    }

    ipcMain.on(GET_RENAME_FILE_NAME, handleReady)
    ipcMain.on(replyChannel, handleReply)
    window.on('close', handleClose)
    context?.renameCleanups.add(cancel)
  })
}

class Uploader {
  private readonly uploadTaskStorage = new AsyncLocalStorage<UploadTaskContext>()
  constructor () {
    this.init()
  }

  init () {
    picgo.on('notification', (message: IShowNotificationOption | undefined) => {
      if (!message) return
      showNotification(message)
    })

    picgo.on('uploadProgress', (progress: unknown) => {
      const context = this.uploadTaskStorage.getStore()
      if (!context?.active || !isAvailableWebContents(context.task.webContents)) return
      try {
        context.task.webContents.send('uploadProgress', progress)
      } catch (error: unknown) {
        logger.error(error)
      }
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
        const rename = ctx.getConfig<boolean>('settings.rename')
        const autoRename = ctx.getConfig<boolean>('settings.autoRename')
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
              name = await waitForRename(
                window,
                fileName,
                item.fileName,
                this.uploadTaskStorage.getStore()
              )
            }
            item.fileName = name || fileName
          }))
        }
      }
    })
  }

  private cleanupRenameListeners (context: UploadTaskContext) {
    for (const cleanup of [...context.renameCleanups]) {
      cleanup()
    }
    context.renameCleanups.clear()
  }

  /**
   * use electron's clipboard image to upload
   */
  async uploadWithBuildInClipboard (task: Omit<UploadTask, 'input'> = {}): Promise<ImgInfo[] | false> {
    const clipboardTask = { ...task, options: task.options && { ...task.options } }
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
        return await this.upload({ ...clipboardTask, input: [filePath] })
      } else {
        return await this.upload({ ...clipboardTask, input: imgPath })
      }
    } catch (e: unknown) {
      logger.error(e)
      return false
    } finally {
      if (filePath) {
        try {
          await fse.unlink(filePath)
        } catch (e: unknown) {
          logger.error(e)
        }
      }
    }
  }

  async upload (task: UploadTask = {}): Promise<ImgInfo[] | false> {
    // Capture the caller's values before any await; each task keeps its original window.
    const capturedTask: UploadTask = { ...task, options: task.options && { ...task.options } }
    const context: UploadTaskContext = {
      active: true,
      renameCleanups: new Set(),
      task: capturedTask
    }
    return await this.uploadTaskStorage.run(context, async () => {
      try {
        const privacyCheckRes = await privacyManager.check()
        if (!privacyCheckRes) {
          throw Error(T('PRIVACY_TIPS'))
        }
        const startTime = Date.now()
        const output = await picgo.upload(capturedTask.input, capturedTask.options)
        if (Array.isArray(output) && output.some((item: ImgInfo) => item.imgUrl)) {
          if (context.active && isAvailableWebContents(capturedTask.webContents)) {
            try {
              await dataReportManager.reportUploadData(capturedTask.webContents, {
                fromClipboard: !capturedTask.input,
                duration: Date.now() - startTime,
                outputList: output
              })
            } catch (e: unknown) {
              logger.error(e)
            }
          }
          return output.filter(item => item.imgUrl)
        }
        return false
      } catch (e: unknown) {
        logger.error(e)
        setTimeout(() => {
          showNotification({
            title: T('UPLOAD_FAILED'),
            body: util.format(e instanceof Error ? e.stack : e),
            clickToCopy: true
          })
        }, 500)
        return false
      } finally {
        context.active = false
        this.cleanupRenameListeners(context)
      }
    })
  }
}

export default new Uploader()
export type { UploadTask } from './types'
