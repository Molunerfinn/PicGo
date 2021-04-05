/* eslint-disable camelcase */
import { ipcRenderer } from 'electron'
import {
  BAIDU_TONGJI_INIT,
  BAIDU_TONGJI_INIT_RES,
  BAIDU_TONGJI_EVENT
} from '~/universal/events/constants'
import { handleBaiduTongJiEvent } from './common'

ipcRenderer.on(BAIDU_TONGJI_INIT_RES, (_, scriptContent) => {
  window._hmt = window._hmt || []
  const hm = document.createElement('script')
  hm.text = scriptContent
  const head = document.getElementsByTagName('head')[0]
  head.appendChild(hm)
})

ipcRenderer.on(BAIDU_TONGJI_EVENT, (_, data: IBaiduTongJiOptions) => {
  handleBaiduTongJiEvent(data)
})

export const initBaiduTongJi = () => {
  setTimeout(() => {
    ipcRenderer.send(BAIDU_TONGJI_INIT)
  }, 0)
}
