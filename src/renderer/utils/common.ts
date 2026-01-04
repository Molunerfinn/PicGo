import { isReactive, isRef, toRaw, unref } from 'vue'
import { sendRPC, sendToMain } from './dataSender'
import { OPEN_URL, PICGO_NOTIFICATION_CLICKED, PICGO_OPEN_FILE } from '~/universal/events/constants'
import { ipcRenderer, webUtils } from 'electron'
import { v4 as uuid } from 'uuid'
import { IRPCActionType } from '~/universal/types/enum'

const isDevelopment = process.env.NODE_ENV !== 'production'
export const handleTalkingDataEvent = (data: ITalkingDataOptions) => {
  const { EventId, Label = '', MapKv = {} } = data
  MapKv.from = window.location.href
  window.TDAPP.onEvent(EventId, Label, MapKv)
  if (isDevelopment) {
    console.log('talkingData', data)
  }
}

export const trimValues = (obj: IStringKeyMap) => {
  const newObj = {} as IStringKeyMap
  Object.keys(obj).forEach(key => {
    newObj[key] = typeof obj[key] === 'string' ? obj[key].trim() : obj[key]
  })
  return newObj
}

/**
 * get raw data from reactive or ref
 */
export const getRawData = (args: any): any => {
  if (Array.isArray(args)) {
    const data = args.map((item: any) => {
      if (isRef(item)) {
        return unref(item)
      }
      if (isReactive(item)) {
        return toRaw(item)
      }
      return getRawData(item)
    })
    return data
  }
  if (typeof args === 'object') {
    const data = {} as IStringKeyMap
    Object.keys(args).forEach(key => {
      const item = args[key]
      if (isRef(item)) {
        data[key] = unref(item)
      } else if (isReactive(item)) {
        data[key] = toRaw(item)
      } else {
        data[key] = getRawData(item)
      }
    })
    return data
  }
  return args
}

const notificationCallbacks = new Map<string, () => void>()
const MAX_CALLBACK_LIMIT = 10

ipcRenderer.on(PICGO_NOTIFICATION_CLICKED, (event, id: string) => {
  const callback = notificationCallbacks.get(id)
  if (!callback) return
  try {
    callback()
  } finally {
    notificationCallbacks.delete(id)
  }
})

interface NotificationOptions {
  title: string
  body: string
  callback?: () => void
}

export const showNotification = (options: NotificationOptions) => {
  if (options.callback) {
    const id = uuid()
    if (notificationCallbacks.size >= MAX_CALLBACK_LIMIT) {
      const oldestId = notificationCallbacks.keys().next().value
      if (oldestId) {
        notificationCallbacks.delete(oldestId)
      }
    }
    notificationCallbacks.set(id, options.callback)
    sendRPC(IRPCActionType.SHOW_NOTIFICATION, options.title, options.body, id)
    return
  }
  sendRPC(IRPCActionType.SHOW_NOTIFICATION, options.title, options.body)
}

export const openFile = (fileName: string) => {
  sendToMain(PICGO_OPEN_FILE, fileName)
}

export const openURL = (url: string) => {
  sendToMain(OPEN_URL, url)
}

export const getFilePath = (file: File) => {
  return webUtils.getPathForFile(file)
}
