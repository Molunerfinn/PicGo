import router from './router'
import {
  handleResponse
} from './utils'
import logger from '@core/picgo/logger'
import windowManager from 'apis/app/window/windowManager'
import { uploadChoosedFiles, uploadClipboardFiles } from 'apis/app/uploader/apis'
import path from 'path'
import { dbPathDir } from 'apis/core/datastore/dbChecker'
const STORE_PATH = dbPathDir()
const LOG_PATH = path.join(STORE_PATH, 'picgo.log')

const errorMessage = `upload error. see ${LOG_PATH} for more detail.`

router.post('/upload', async ({
  response,
  list = []
} : {
  response: IHttpResponse,
  list?: string[]
}): Promise<void> => {
  try {
    if (list.length === 0) {
      // upload with clipboard
      logger.info('[PicGo Server] upload clipboard file')
      const res = await uploadClipboardFiles()
      logger.info('[PicGo Server] upload result:', res)
      if (res) {
        handleResponse({
          response,
          body: {
            success: true,
            result: [res]
          }
        })
      } else {
        handleResponse({
          response,
          body: {
            success: false,
            message: errorMessage
          }
        })
      }
    } else {
      logger.info('[PicGo Server] upload files in list')
      //  upload with files
      const pathList = list.map(item => {
        return {
          path: item
        }
      })
      const win = windowManager.getAvailableWindow()
      const res = await uploadChoosedFiles(win.webContents, pathList)
      logger.info('[PicGo Server] upload result', res.join(' ; '))
      if (res.length) {
        handleResponse({
          response,
          body: {
            success: true,
            result: res
          }
        })
      } else {
        handleResponse({
          response,
          body: {
            success: false,
            message: errorMessage
          }
        })
      }
    }
  } catch (err: any) {
    logger.error(err)
    handleResponse({
      response,
      body: {
        success: false,
        message: errorMessage
      }
    })
  }
})

router.post('/heartbeat', async ({
  response
} : {
  response: IHttpResponse,
}) => {
  handleResponse({
    response,
    body: {
      success: true,
      result: 'alive'
    }
  })
})

export default router
