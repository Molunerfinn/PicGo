import bus from '.'
import {
  UPLOAD_WITH_FILES,
  UPLOAD_WITH_FILES_RESPONSE,
  UPLOAD_WITH_CLIPBOARD_FILES,
  UPLOAD_WITH_CLIPBOARD_FILES_RESPONSE,
  GET_WINDOW_ID,
  GET_WINDOW_ID_REPONSE,
  GET_SETTING_WINDOW_ID,
  GET_SETTING_WINDOW_ID_RESPONSE
} from './constants'

export const uploadWithClipboardFiles = (): Promise<{
  success: boolean,
  result?: string[]
}> => {
  return new Promise((resolve) => {
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
    bus.emit(UPLOAD_WITH_CLIPBOARD_FILES)
  })
}

export const uploadWithFiles = (pathList: IFileWithPath[]): Promise<{
  success: boolean,
  result?: string[]
}> => {
  return new Promise((resolve) => {
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
    bus.emit(UPLOAD_WITH_FILES, pathList)
  })
}

// get available window id:
// miniWindow or settingWindow or trayWindow
export const getWindowId = (): Promise<number> => {
  return new Promise((resolve) => {
    bus.once(GET_WINDOW_ID_REPONSE, (id: number) => {
      resolve(id)
    })
    bus.emit(GET_WINDOW_ID)
  })
}

// get settingWindow id:
export const getSettingWindowId = (): Promise<number> => {
  return new Promise((resolve) => {
    bus.once(GET_SETTING_WINDOW_ID_RESPONSE, (id: number) => {
      resolve(id)
    })
    bus.emit(GET_SETTING_WINDOW_ID)
  })
}
