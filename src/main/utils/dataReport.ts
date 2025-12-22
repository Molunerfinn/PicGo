import { ipcMain, IpcMainEvent, type WebContents } from "electron";
import { deviceIdManager } from "./deviceId";
import { REGISTER_DEVICE_ID, TALKING_DATA_EVENT } from "~/universal/events/constants";
import type { IImgInfo } from "picgo";
import { calcUploadBigFileSizeRange, calcUploadProcessDurationRange, calcVideoDurationRange } from "./common";
import { app } from "electron/main";
import db from "~/main/apis/core/datastore";
import fs from 'fs-extra'
// @ts-ignore
import { videoDuration } from "@numairawan/video-duration";
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
        mimeType: item.mimeType
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
        const [stats, metadata] = await Promise.all([
          fs.stat(file.filePath),
          videoDuration(file.filePath)
        ]);
        // report video duration and size range
        const sizeMB = stats.size / MB;
        const durationSec = (metadata.ms / SECOND) || 0;
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
