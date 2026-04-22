import { env, webUtils } from './bridge'

const isDevelopment = env.isDev
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

export const getFilePath = (file: File) => {
  return webUtils.getPathForFile(file)
}

/**
 * Normalize a timestamp value (number, string, or Date) to milliseconds.
 * Returns 0 if the value is missing or not a valid date.
 */
export function resolveTimestampValue (value?: number | string | Date): number {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string' || value instanceof Date) {
    const ms = new Date(value).getTime()
    return Number.isFinite(ms) ? ms : 0
  }

  return 0
}
