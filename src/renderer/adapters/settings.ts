import { GET_PICBEDS, PICGO_OPEN_FILE, TOGGLE_SHORTKEY_MODIFIED_MODE } from '#/events/constants'
import { IRPCActionType } from '~/universal/types/enum'
import { appConfigAdapter } from './app-config'
import { getConfig, invokeRPC, openURL, saveConfig, sendRPC, sendToMain } from '@/utils/dataSender'
import { ipc } from '@/utils/bridge'

export const settingsAdapter = {
  async savePatch (patch: IStringKeyMap) {
    await saveConfig(patch)
  },
  async saveSingle (path: string, value: unknown) {
    await saveConfig(path, value)
  },
  setAutoStart (value: boolean) {
    sendToMain('autoStart', value)
  },
  showDockIcon (value: boolean) {
    sendRPC(IRPCActionType.SHOW_DOCK_ICON, value)
  },
  showMenubarIcon (value: boolean) {
    sendRPC(IRPCActionType.SHOW_MENUBAR_ICON, value)
  },
  openConfigFile () {
    sendToMain(PICGO_OPEN_FILE, 'data.json')
  },
  openLogFile () {
    sendToMain(PICGO_OPEN_FILE, 'picgo.log')
  },
  openExternalUrl (url: string) {
    openURL(url)
  },
  updateServer () {
    sendToMain('updateServer')
  },
  updateCustomLink () {
    sendToMain('updateCustomLink')
  },
  async checkLatestVersion (includeBeta: boolean) {
    const result = await invokeRPC<string>(IRPCActionType.GET_LATEST_VERSION, includeBeta)
    if (!result.success) {
      throw new Error(result.error || 'Failed to check latest version')
    }

    return result.data
  },
  async loadShortcuts () {
    const config = await getConfig<IShortKeyConfigs>('settings.shortKey')
    return config || {}
  },
  toggleShortcutModifiedMode (value: boolean) {
    sendToMain(TOGGLE_SHORTKEY_MODIFIED_MODE, value)
  },
  toggleShortcutEnabled (item: IShortKeyConfig) {
    sendToMain('bindOrUnbindShortKey', item, item.from)
  },
  updateShortcut (item: IShortKeyConfig, oldKey: string) {
    return new Promise<boolean>((resolve, reject) => {
      const cleanup = ipc.once('updateShortKeyResponse', (result: boolean) => {
        resolve(result)
      })

      try {
        sendToMain('updateShortKey', item, oldKey, item.from)
      } catch (error) {
        cleanup()
        reject(error)
      }
    })
  },
  async loadUrlRewriteRules () {
    return (await getConfig<IStringKeyMap[]>('settings.urlRewrite.rules')) || []
  },
  async saveUrlRewriteRules (rules: IStringKeyMap[]) {
    await saveConfig('settings.urlRewrite.rules', rules)
  },
  async updateVisiblePicBeds (visibleNames: string[]) {
    const currentPicBeds = await appConfigAdapter.getPicBeds()
    const nextList = currentPicBeds.map((item) => ({
      ...item,
      visible: visibleNames.includes(item.name)
    }))
    await saveConfig({
      'picBed.list': nextList
    })
    sendToMain(GET_PICBEDS)
    return nextList
  }
}
