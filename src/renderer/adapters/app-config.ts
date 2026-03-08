import type { IConfig } from 'picgo'
import { ipcRenderer } from 'electron'
import { APP_CONFIG_UPDATED } from '#/events/constants'
import { getConfig, getPicBeds, saveConfig } from '@/utils/dataSender'

type AppConfigListener = () => void

export const appConfigAdapter = {
  getAppConfig () {
    return getConfig<IConfig>()
  },
  getPicBeds () {
    return getPicBeds()
  },
  saveConfig,
  subscribeToUpdates (listener: AppConfigListener) {
    ipcRenderer.on(APP_CONFIG_UPDATED, listener)

    return () => {
      ipcRenderer.removeListener(APP_CONFIG_UPDATED, listener)
    }
  }
}
