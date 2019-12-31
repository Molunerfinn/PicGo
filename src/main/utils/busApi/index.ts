import bus from '../eventBus'
import {
  UPLOAD_WITH_FILES,
  UPLOAD_WITH_FILES_RESPONSE,
  UPLOAD_WITH_CLIPBOARD_FILES,
  UPLOAD_WITH_CLIPBOARD_FILES_RESPONSE
} from './constants'

export const uploadWithClipboardFiles = (): Promise<{
  success: boolean,
  result?: string[]
}> => {
  return new Promise((resolve, reject) => {
    bus.emit(UPLOAD_WITH_CLIPBOARD_FILES)
    bus.once(UPLOAD_WITH_CLIPBOARD_FILES_RESPONSE, (result: string) => {
      if (result) {
        return resolve({
          success: true,
          result: [result]
        })
      } else {
        return resolve({
          success: false
        })
      }
    })
  })
}

export const uploadWithFiles = (pathList: IFileWithPath[]): Promise<{
  success: boolean,
  result?: string[]
}> => {
  return new Promise((resolve, reject) => {
    bus.emit(UPLOAD_WITH_FILES, pathList)
    bus.once(UPLOAD_WITH_FILES_RESPONSE, (result: string[]) => {
      if (result.length) {
        return resolve({
          success: true,
          result
        })
      } else {
        return resolve({
          success: false
        })
      }
    })
  })
}
