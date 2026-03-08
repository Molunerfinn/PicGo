import { ipcRenderer } from 'electron'
import { toast } from 'sonner'
import type { IConfig } from 'picgo'
import { PICGO_OPEN_FILE, TOGGLE_SHORTKEY_MODIFIED_MODE, GET_PICBEDS } from '#/events/constants'
import { IStartupMode, IRPCActionType } from '~/universal/types/enum'
import { appConfigAdapter } from './app-config'
import { getConfig, invokeRPC, saveConfig, sendRPC, sendToMain } from '@/utils/dataSender'

export function buildSettingsForm (config: IConfig | null): ISettingForm {
  const settings = config?.settings || {}
  const picBed = (config?.picBed || {}) as IStringKeyMap
  const picBedList = Array.isArray(picBed.list) ? picBed.list as IPicBedType[] : []

  return {
    showUpdateTip: settings.showUpdateTip || false,
    showPicBedList: picBedList.filter((item) => item.visible).map((item) => item.name),
    autoStart: settings.autoStart || false,
    rename: settings.rename || false,
    autoRename: settings.autoRename || false,
    uploadNotification: settings.uploadNotification || false,
    notificationSound: settings.notificationSound === undefined ? true : settings.notificationSound,
    miniWindowOnTop: settings.miniWindowOnTop || false,
    logLevel: Array.isArray(settings.logLevel)
      ? [...settings.logLevel]
      : settings.logLevel
        ? [settings.logLevel]
        : ['all'],
    autoCopyUrl: settings.autoCopyUrl === undefined ? true : settings.autoCopyUrl,
    checkBetaUpdate: settings.checkBetaUpdate === undefined ? true : settings.checkBetaUpdate,
    useBuiltinClipboard: settings.useBuiltinClipboard === undefined ? false : settings.useBuiltinClipboard,
    language: settings.language ?? 'en',
    logFileSizeLimit: Number(settings.logFileSizeLimit ?? 10) || 10,
    encodeOutputURL: settings.encodeOutputURL === undefined ? false : settings.encodeOutputURL,
    showDockIcon: settings.showDockIcon === undefined ? true : settings.showDockIcon,
    showMenubarIcon: settings.showMenubarIcon === undefined ? true : settings.showMenubarIcon,
    customLink: settings.customLink || '$url',
    npmProxy: settings.npmProxy || '',
    npmRegistry: settings.npmRegistry || '',
    server: {
      port: Number(settings.server?.port ?? 36677) || 36677,
      host: settings.server?.host || '127.0.0.1',
      enable: settings.server?.enable ?? true
    },
    startupMode: settings.startupMode || IStartupMode.HIDE
  }
}

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
    return new Promise<boolean>((resolve) => {
      const handleResponse = (_event: Electron.IpcRendererEvent, result: boolean) => {
        resolve(result)
      }

      ipcRenderer.once('updateShortKeyResponse', handleResponse)
      sendToMain('updateShortKey', item, oldKey, item.from)
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

export function toastSettingsError (error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  toast.error(message)
}
