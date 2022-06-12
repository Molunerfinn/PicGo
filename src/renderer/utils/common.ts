const isDevelopment = process.env.NODE_ENV !== 'production'
/* eslint-disable camelcase */
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
