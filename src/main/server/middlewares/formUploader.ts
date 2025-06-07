import http from 'http'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { dbPathDir } from 'apis/core/datastore/dbChecker'
import logger from '@core/picgo/logger'
import { handleResponse } from '../utils'
import routers from '../routerManager'
import { FORM_IMAGE_FOLDER } from '~/universal/utils/static'

// Multer 错误类型定义
export interface MulterError extends Error {
  code: string
  field?: string
  storageErrors?: any[]
}

// Multer 中间件适配器类型
export type MulterMiddleware = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  callback: (error?: MulterError) => void
) => void;

// 扩展 multer 函数的返回类型
declare module 'multer' {
  interface Multer {
    array(fieldname: string, maxCount?: number): MulterMiddleware;
    single(fieldname: string): MulterMiddleware;
    fields(fields: { name: string; maxCount?: number }[]): MulterMiddleware;
    none(): MulterMiddleware;
  }
}

class FormUploader {
  private upload!: multer.Multer
  private formImagesPath!: string

  constructor () {
    this.initializeStorage()
    this.setupMulter()
  }

  private initializeStorage () {
    const STORE_PATH = dbPathDir()
    this.formImagesPath = path.join(STORE_PATH, FORM_IMAGE_FOLDER)
    if (!fs.existsSync(this.formImagesPath)) {
      fs.mkdirSync(this.formImagesPath, { recursive: true })
    }
  }

  private setupMulter () {
    const storage = multer.diskStorage({
      destination: (req: http.IncomingMessage, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        cb(null, this.formImagesPath)
      },
      filename: (req: http.IncomingMessage, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        cb(null, file.originalname || Date.now() + path.extname(file.originalname))
      }
    })

    this.upload = multer({
      storage
    })
  }

  /**
   * 处理文件上传的中间件
   */
  public handleFileUpload = (request: http.IncomingMessage, response: http.ServerResponse): void => {
    logger.info('[PicGo Server] handling file upload')

    this.upload.array('files')(request, response, async (err?: MulterError) => {
      if (err) {
        logger.error('[PicGo Server] file upload error', err)
        return handleResponse({
          response,
          body: {
            success: false,
            message: 'File upload failed'
          }
        })
      }

      try {
        const files = request.files
        if (!files || files.length === 0) {
          return handleResponse({
            response,
            body: {
              success: false,
              message: 'No files were uploaded'
            }
          })
        }
        const filePaths = files.map((file) => file.path)
        logger.info('[PicGo Server] files uploaded: ' + filePaths.join(', '))

        const handler = routers.getHandler(request.url!)
        handler!({
          list: filePaths,
          response
        })
      } catch (err: any) {
        logger.error('[PicGo Server] process upload files error', err)
        handleResponse({
          response,
          body: {
            success: false,
            message: 'Failed to process uploaded files'
          }
        })
      }
    })
  }

  /**
   * 检查请求是否为文件上传
   */
  public isFileUpload (request: http.IncomingMessage): boolean {
    return !!(request.headers['content-type'] && request.headers['content-type'].includes('multipart/form-data'))
  }
}

export default new FormUploader()
