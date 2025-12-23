import { ipcMain, IpcMainEvent, type WebContents } from "electron";
import { deviceIdManager } from "./deviceId";
import { REGISTER_DEVICE_ID, TALKING_DATA_EVENT } from "~/universal/events/constants";
import type { IImgInfo } from "picgo";
import { calcUploadBigFileSizeRange, calcUploadProcessDurationRange, calcVideoDurationRange } from "./common";
import { app } from "electron/main";
import db from "~/main/apis/core/datastore";
import { getVideoDuration } from "@picgo/video-duration";
import { MB, SECOND } from "./constants";

export interface IReportUploadDataOptions {
  fromClipboard: boolean;
  duration: number;
  outputList: IImgInfo[];
}

class DataReportManager {
  private deviceId: string | null = null;
  private hasRegisterDeviceID: boolean = false;
  constructor () {
    this.init()
    this.handleRegisterDeviceID()
  }
  private handleRegisterDeviceID() {
    ipcMain.once(REGISTER_DEVICE_ID, (_evt: IpcMainEvent) => {
      this.hasRegisterDeviceID = true;
      console.log('Device ID registered');
    });
  }
  private async init () {
    if (this.deviceId) return;
    this.deviceId = await deviceIdManager.getId()
  }
  public async reportUploadData(webContents: WebContents, options: IReportUploadDataOptions) {
    await this.init();
    await this.registerDeviceID(webContents);
    const { fromClipboard, duration, outputList } = options;
    const fileList = outputList.map(item => {
      return {
        fileName: item.fileName,
        filePath: item.filePath,
        mimeType: item.mimeType,
        size: item.size || 0
      }
    })
    const uploadEventData: ITalkingDataOptions = {
      EventId: 'upload',
      Label: '',
      MapKv: {
        by: fromClipboard ? 'clipboard' : 'files', // 上传剪贴板图片还是选择的文文件
        count: fileList.length, // 上传的数量
        duration: calcUploadProcessDurationRange(duration || 0), // 上传耗时
        type: db.get('picBed.uploader') || db.get('picBed.current') || 'smms',
        deviceId: this.deviceId,
        version: app.getVersion()
      }
    }
    webContents.send(TALKING_DATA_EVENT, uploadEventData)
    fileList.forEach(async file => {
      if (file?.mimeType?.startsWith('video/') && file.filePath) {
        const metadata = await getVideoDuration(file.filePath);
        const sizeMB = metadata.size / MB;
        const durationSec = (metadata.duration / SECOND) || 0;
        const videoEventData: ITalkingDataOptions = {
          EventId: 'upload_video',
          Label: '',
          MapKv: {
            deviceId: this.deviceId,
            sizeRange: calcUploadBigFileSizeRange(sizeMB),
            durationRange: calcVideoDurationRange(durationSec),
            version: app.getVersion()
          }
        };
        webContents.send(TALKING_DATA_EVENT, videoEventData);
      } else if (file?.mimeType?.startsWith('image/') || fromClipboard) {
        const imageEventData: ITalkingDataOptions = {
          EventId: 'upload_image',
          Label: '',
          MapKv: {
            deviceId: this.deviceId,
            version: app.getVersion(),
            type: db.get('picBed.uploader') || db.get('picBed.current') || 'smms',
            mimeType: file.mimeType,
            sizeRange: calcUploadBigFileSizeRange(file.size / MB)
          }
        };
        webContents.send(TALKING_DATA_EVENT, imageEventData);
      }
    });
  }

  public async registerDeviceID(webContents: WebContents) {
    if (this.hasRegisterDeviceID) return;
    await this.init();
    webContents.send(REGISTER_DEVICE_ID, this.deviceId);
  }
}

export const dataReportManager = new DataReportManager()
