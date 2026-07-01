import type { IConfig } from 'picgo'
import { getConfig, getPicBeds, saveConfig } from '@/utils/dataSender'

export const appConfigAdapter = {
  getAppConfig () {
    return getConfig<IConfig>()
  },
  getPicBeds () {
    return getPicBeds()
  },
  saveConfig
}
