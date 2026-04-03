import {
  REGISTER_DEVICE_ID,
  TALKING_DATA_APPID, TALKING_DATA_DEVICE_ID_EVENT, TALKING_DATA_EVENT
} from '~/universal/events/constants'
import pkg from 'root/package.json'
import { handleTalkingDataEvent } from './common'
import { ipc } from './bridge'
const { version } = pkg

export const initTalkingData = () => {
  setTimeout(() => {
    const talkingDataScript = document.createElement('script')

    talkingDataScript.src = `https://jic.talkingdata.com/app/h5/v1?appid=${TALKING_DATA_APPID}&vn=${version}&vc=${version}`

    const head = document.getElementsByTagName('head')[0]
    head.appendChild(talkingDataScript)
  }, 0)
}

ipc.removeAllListeners(TALKING_DATA_EVENT)
ipc.on(TALKING_DATA_EVENT, (data: ITalkingDataOptions) => {
  handleTalkingDataEvent(data)
})
// 0：ANONYMOUS，匿名账号；
// 1：REGISTERED，自有帐户显性注册；
ipc.removeAllListeners(TALKING_DATA_DEVICE_ID_EVENT)
ipc.on(TALKING_DATA_DEVICE_ID_EVENT, (deviceId: string) => {
  window.TDAPP.register({
    profileId: deviceId,
    profileType: 1
  })
  window.TDAPP.login({
    profileId: deviceId,
    profileType: 1
  })
  ipc.send(REGISTER_DEVICE_ID)
})
