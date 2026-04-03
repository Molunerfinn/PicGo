import {
  clipboard,
  contextBridge,
  ipcRenderer,
  webFrame,
  webUtils
} from 'electron'
import { I18n } from '@picgo/i18n/dist/i18n'
import { ObjectAdapter } from '@picgo/i18n/dist/adapters/object'

type PreloadIpcListener = (...args: unknown[]) => void
type ElectronIpcListener = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => void

const listenerMap = new Map<string, Map<PreloadIpcListener, Set<ElectronIpcListener>>>()

const getChannelListeners = (channel: string) => {
  let channelListeners = listenerMap.get(channel)
  if (!channelListeners) {
    channelListeners = new Map()
    listenerMap.set(channel, channelListeners)
  }
  return channelListeners
}

const trackListener = (channel: string, listener: PreloadIpcListener, wrappedListener: ElectronIpcListener) => {
  const channelListeners = getChannelListeners(channel)
  const listenerSet = channelListeners.get(listener) || new Set<ElectronIpcListener>()
  listenerSet.add(wrappedListener)
  channelListeners.set(listener, listenerSet)
}

const untrackListener = (channel: string, listener: PreloadIpcListener, wrappedListener: ElectronIpcListener) => {
  const channelListeners = listenerMap.get(channel)
  if (!channelListeners) return

  const listenerSet = channelListeners.get(listener)
  if (!listenerSet) return

  listenerSet.delete(wrappedListener)
  if (listenerSet.size === 0) {
    channelListeners.delete(listener)
  }

  if (channelListeners.size === 0) {
    listenerMap.delete(channel)
  }
}

const createCleanup = (channel: string, listener: PreloadIpcListener, wrappedListener: ElectronIpcListener) => {
  return () => {
    ipcRenderer.removeListener(channel, wrappedListener)
    untrackListener(channel, listener, wrappedListener)
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

    trackListener(channel, listener, wrappedListener)
    ipcRenderer.on(channel, wrappedListener)

    return createCleanup(channel, listener, wrappedListener)
  },
  once: (channel: string, listener: PreloadIpcListener) => {
    const wrappedListener: ElectronIpcListener = (_event, ...args) => {
      try {
        listener(...args)
      } finally {
        untrackListener(channel, listener, wrappedListener)
      }
    }

    trackListener(channel, listener, wrappedListener)
    ipcRenderer.once(channel, wrappedListener)

    return createCleanup(channel, listener, wrappedListener)
  },
  off: (channel: string, listener: PreloadIpcListener) => {
    const listenerSet = listenerMap.get(channel)?.get(listener)
    if (!listenerSet) return

    listenerSet.forEach((wrappedListener) => {
      ipcRenderer.removeListener(channel, wrappedListener)
    })

    listenerMap.get(channel)?.delete(listener)
    if (listenerMap.get(channel)?.size === 0) {
      listenerMap.delete(channel)
    }
  },
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
    listenerMap.delete(channel)
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
  clipboard: {
    writeText: (text: string) => clipboard.writeText(text)
  },
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
