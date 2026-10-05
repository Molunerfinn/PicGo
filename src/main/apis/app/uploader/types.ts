import type { WebContents } from 'electron'
import type { UploadOptions } from 'picgo'

export interface UploadTask {
  input?: IUploadOption
  webContents?: WebContents
  options?: UploadOptions
}
