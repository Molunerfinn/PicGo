import { app, ipcMain, type IpcMainEvent, type WebContents } from 'electron'
import { deviceIdManager } from './deviceId'
import { REGISTER_DEVICE_ID, TALKING_DATA_EVENT } from '~/universal/events/constants'
import type { IImgInfo } from 'picgo'
import { calcUploadBigFileSizeRange, calcUploadProcessDurationRange, calcVideoDurationRange } from './common'
import picgo from '@core/picgo'
import { getVideoDuration } from '@picgo/video-duration'
import { MB, SECOND } from './constants'
import { PICGO_CLOUD_UPLOADER_TYPE } from '#/utils/static'

export interface IReportUploadItem extends IImgInfo {
  type?: string
}

export interface IReportUploadDataOptions {
  fromClipboard: boolean
  duration: number
  outputList: IReportUploadItem[]
}

class DataReportManager {
  private deviceId: string | null = null
  private hasRegisterDeviceID = false
  private initPromise: Promise<void> | null = null

  constructor () {
    this.handleRegisterDeviceID()
  }

  private handleRegisterDeviceID () {
    ipcMain.once(REGISTER_DEVICE_ID, (_evt: IpcMainEvent) => {
      this.hasRegisterDeviceID = true
      console.log('Device ID registered')
    })
  }

  private async init () {
    if (this.deviceId) return
    if (!this.initPromise) {
      this.initPromise = this.loadDeviceId()
    }
    await this.initPromise
  }

  private async loadDeviceId () {
    try {
      this.deviceId = await deviceIdManager.getId()
    } finally {
      this.initPromise = null
    }
  }

  public async reportUploadData (webContents: WebContents, options: IReportUploadDataOptions) {
    await this.init()
    if (webContents.isDestroyed()) return
    await this.registerDeviceID(webContents)
    if (webContents.isDestroyed()) return

    const { fromClipboard, duration, outputList } = options
    const fileList = outputList.map(item => {
      return {
        fileName: item.fileName,
        filePath: item.filePath,
        mimeType: item.mimeType,
        size: item.size || 0,
        type: item.type
      }
    })
    let legacyUploaderType: string | undefined
    const resolveUploaderType = (type?: string): string => {
      if (type) return type
      legacyUploaderType ??= picgo.getConfig<string>('picBed.uploader') || picgo.getConfig<string>('picBed.current') || PICGO_CLOUD_UPLOADER_TYPE
      return legacyUploaderType
    }
    const batchOutput = outputList.find(item => item.type)
    const uploadEventData: ITalkingDataOptions = {
      EventId: 'upload',
      Label: '',
      MapKv: {
        by: fromClipboard ? 'clipboard' : 'files', // 上传剪贴板图片还是选择的文文件
        count: fileList.length, // 上传的数量
        duration: calcUploadProcessDurationRange(duration || 0), // 上传耗时
        type: resolveUploaderType(batchOutput?.type)
      }
    }
    this.reportDataToWebContents(webContents, uploadEventData)
    await Promise.all(fileList.map(async file => {
      if (file?.mimeType?.startsWith('video/') && file.filePath) {
        const metadata = await getVideoDuration(file.filePath)
        const sizeMB = metadata.size / MB
        const durationSec = (metadata.duration / SECOND) || 0
        const videoEventData: ITalkingDataOptions = {
          EventId: 'upload_video',
          Label: '',
          MapKv: {
            type: resolveUploaderType(file.type),
            mimeType: file.mimeType,
            sizeRange: calcUploadBigFileSizeRange(sizeMB),
            durationRange: calcVideoDurationRange(durationSec)
          }
        }
        this.reportDataToWebContents(webContents, videoEventData)
      } else if (file?.mimeType?.startsWith('image/') || fromClipboard) {
        const imageEventData: ITalkingDataOptions = {
          EventId: 'upload_image',
          Label: '',
          MapKv: {
            type: resolveUploaderType(file.type),
            mimeType: file.mimeType || 'image/png',
            sizeRange: calcUploadBigFileSizeRange(file.size / MB)
          }
        }
        this.reportDataToWebContents(webContents, imageEventData)
      } else {
        const otherEventData: ITalkingDataOptions = {
          EventId: 'upload_file',
          Label: '',
          MapKv: {
            type: resolveUploaderType(file.type),
            mimeType: file.mimeType || 'UNKNOWN',
            sizeRange: calcUploadBigFileSizeRange(file.size / MB)
          }
        }
        this.reportDataToWebContents(webContents, otherEventData)
      }
    }))
  }

  public async registerDeviceID (webContents: WebContents) {
    if (this.hasRegisterDeviceID) return
    await this.init()
    if (webContents.isDestroyed()) return
    webContents.send(REGISTER_DEVICE_ID, this.deviceId)
  }

  private reportDataToWebContents (webContents: WebContents, data: ITalkingDataOptions) {
    if (webContents.isDestroyed()) return
    webContents.send(TALKING_DATA_EVENT, {
      ...data,
      MapKv: {
        ...data.MapKv,
        deviceId: this.deviceId,
        version: app.getVersion(),
        area: this.getAreaFromTimezone()
      }
    })
  }

  private getAreaFromTimezone () {
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (!timeZone) return 'UNKNOWN'

      if (timeZone === 'Asia/Shanghai') return 'CN'

      const region = timeZone.split('/')[0] // Asia, America, Europe
      return region
    } catch (e) {
      return 'UNKNOWN'
    }
  }
}

export const dataReportManager = new DataReportManager()
