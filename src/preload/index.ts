import {
  contextBridge,
  ipcRenderer,
  webFrame,
  webUtils
} from 'electron'
import { I18n } from '@picgo/i18n/dist/i18n'
import { ObjectAdapter } from '@picgo/i18n/dist/adapters/object'

type PreloadIpcListener = (...args: unknown[]) => void
type ElectronIpcListener = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => void

const createCleanup = (channel: string, wrappedListener: ElectronIpcListener) => {
  return () => {
    ipcRenderer.removeListener(channel, wrappedListener)
  }
}

const ipc = {
  send: (channel: string, ...args: unknown[]) => ipcRenderer.send(channel, ...args),
  invoke: <T>(channel: string, ...args: unknown[]) => {
    return ipcRenderer.invoke(channel, ...args) as Promise<T>
  },
  on: (channel: string, listener: PreloadIpcListener) => {
    const wrappedListener: ElectronIpcListener = (_event, ...args) => {
      listener(...args)
    }

    ipcRenderer.on(channel, wrappedListener)

    return createCleanup(channel, wrappedListener)
  },
  once: (channel: string, listener: PreloadIpcListener) => {
    const wrappedListener: ElectronIpcListener = (_event, ...args) => {
      listener(...args)
    }

    ipcRenderer.once(channel, wrappedListener)

    return createCleanup(channel, wrappedListener)
  },
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  }
}

type I18nLocalesMap = Record<string, ILocales>

const createObjectAdapterBridge = (locales: I18nLocalesMap) => {
  const adapter = new ObjectAdapter(locales)

  return {
    getLocale: (language: string) => adapter.getLocale(language) as ILocales | undefined,
    setLocales: (nextLocales: I18nLocalesMap) => adapter.setLocales(nextLocales),
    setLocale: (language: string, locale: ILocales) => adapter.setLocale(language, locale)
  }
}

const createI18nBridge = (locales: I18nLocalesMap, defaultLanguage: string) => {
  const i18n = new I18n({
    adapter: new ObjectAdapter(locales),
    defaultLanguage
  })

  return {
    getLanguage: () => i18n.getLanguage(),
    setLanguage: (language: string) => i18n.setLanguage(language),
    setDefaultLanguage: (language: string) => i18n.setDefaultLanguage(language),
    translate: (key: ILocalesKey, args: IStringKeyMap = {}) => i18n.translate(key, args) || key
  }
}

const bridgeApi = {
  ipc,
  // 注：clipboard 不在此暴露——sandboxed preload（Electron 22+ 默认）下
  // `require('electron').clipboard` 为 undefined。剪贴板操作改走 RPC（IRPCActionType.COPY_TEXT）。
  webUtils: {
    getPathForFile: (file: File): string => webUtils.getPathForFile(file)
  },
  webFrame: {
    setVisualZoomLevelLimits: (minimumLevel: number, maximumLevel: number) => {
      webFrame.setVisualZoomLevelLimits(minimumLevel, maximumLevel)
    }
  },
  env: {
    platform: process.platform,
    isDev: Boolean(process.env.ELECTRON_RENDERER_URL) || process.env.NODE_ENV === 'development'
  },
  i18n: {
    ObjectAdapter: {
      create: (locales: I18nLocalesMap) => createObjectAdapterBridge(locales)
    },
    I18n: {
      createFromLocales: (locales: I18nLocalesMap, defaultLanguage: string) => {
        return createI18nBridge(locales, defaultLanguage)
      }
    }
  }
}

contextBridge.exposeInMainWorld('bridgeApi', bridgeApi)

export type BridgeApi = typeof bridgeApi
