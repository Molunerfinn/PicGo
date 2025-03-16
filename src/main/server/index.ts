import http from 'http'
import routers from './routerManager'
import {
  handleResponse,
  ensureHTTPLink
} from './utils'
import { dbPathDir } from 'apis/core/datastore/dbChecker'
import picgo from '@core/picgo'
import logger from '@core/picgo/logger'
import axios from 'axios'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

// 扩展原生 IncomingMessage，添加 multer 字段
declare module 'http' {
  interface IncomingMessage {
    files?: {
      path: string;
      originalname: string;
      mimetype: string;
      size: number;
      [key: string]: any;
    }[];
    body?: any;
  }
}

// Multer 中间件适配器类型
export type MulterMiddleware = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  callback: (error?: any) => void
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

const STORE_PATH = dbPathDir()
const formImagesPath = path.join(STORE_PATH, 'picgo-form-images')
if (!fs.existsSync(formImagesPath)) {
  fs.mkdirSync(formImagesPath, { recursive: true })
}

// 使用 multer 处理表单文件
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, formImagesPath)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

const upload = multer({
  storage
})

class Server {
  private httpServer: http.Server
  private config: IServerConfig
  constructor () {
    let config = picgo.getConfig<IServerConfig>('settings.server')
    const result = this.checkIfConfigIsValid(config)
    if (result) {
      this.config = config
    } else {
      config = {
        port: 36677,
        host: '127.0.0.1',
        enable: true
      }
      this.config = config
      picgo.saveConfig({
        'settings.server': config
      })
    }
    this.httpServer = http.createServer(this.handleRequest)
  }

  private checkIfConfigIsValid (config: IObj | undefined) {
    if (config && config.port && config.host && (config.enable !== undefined)) {
      return true
    } else {
      return false
    }
  }

  private handleRequest = (request: http.IncomingMessage, response: http.ServerResponse) => {
    if (request.method === 'OPTIONS') {
      handleResponse({
        response
      })
      return
    }

    if (request.method === 'POST') {
      if (!routers.getHandler(request.url!)) {
        logger.warn(`[PicGo Server] don't support [${request.url}] url`)
        handleResponse({
          response,
          statusCode: 404,
          body: {
            success: false
          }
        })
      } else if (request.headers['content-type'] && request.headers['content-type'].includes('multipart/form-data')) {
        logger.info('[PicGo Server] handling file upload')
        upload.array('files')(request, response, async (err) => {
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
            const files = (request).files
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
      } else {
        let body: string = ''
        let postObj: IObj
        request.on('data', chunk => {
          body += chunk
        })
        request.on('end', () => {
          try {
            postObj = (body === '') ? {} : JSON.parse(body)
          } catch (err: any) {
            logger.error('[PicGo Server]', err)
            return handleResponse({
              response,
              body: {
                success: false,
                message: 'Not sending data in JSON format'
              }
            })
          }
          logger.info('[PicGo Server] get the request', body)
          const handler = routers.getHandler(request.url!)
          handler!({
            ...postObj,
            response
          })
        })
      }
    } else {
      logger.warn(`[PicGo Server] don't support [${request.method}] method`)
      response.statusCode = 404
      response.end()
    }
  }

  // port as string is a bug
  private listen = (port: number | string) => {
    logger.info(`[PicGo Server] is listening at ${port}`)
    if (typeof port === 'string') {
      port = parseInt(port, 10)
    }
    this.httpServer.listen(port, this.config.host).on('error', async (err: ErrnoException) => {
      if (err.errno === 'EADDRINUSE') {
        try {
          // make sure the system has a PicGo Server instance
          await axios.post(ensureHTTPLink(`${this.config.host}:${port}/heartbeat`))
          this.shutdown(true)
        } catch (e) {
          logger.warn(`[PicGo Server] ${port} is busy, trying with port ${(port as number) + 1}`)
          // fix a bug: not write an increase number to config file
          // to solve the auto number problem
          this.listen((port as number) + 1)
        }
      }
    })
  }

  startup () {
    console.log('startup', this.config.enable)
    if (this.config.enable) {
      this.listen(this.config.port)
    }
  }

  shutdown (hasStarted?: boolean) {
    this.httpServer.close()
    if (!hasStarted) {
      logger.info('[PicGo Server] shutdown')
    }
  }

  restart () {
    this.config = picgo.getConfig('settings.server')
    this.shutdown()
    this.startup()
  }
}

export default new Server()
