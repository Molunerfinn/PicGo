import router from './router'
import {
  handleResponse
} from './utils'
import logger from '@core/picgo/logger'
import windowManager from 'apis/app/window/windowManager'
import { uploadChoosedFiles, uploadClipboardFiles } from 'apis/app/uploader/apis'

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
      if (res) {
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
            message: 'upload error'
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
            message: 'upload error'
          }
        })
      }
    }
  } catch (err) {
    logger.error(err)
    handleResponse({
      response,
      body: {
        success: false,
        message: err
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
