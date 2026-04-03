let bridgeApi: BridgeApi | null = null

const resolveBridgeApi = (): BridgeApi => {
  if (bridgeApi) {
    return bridgeApi
  }

  const windowBridgeApi = typeof window !== 'undefined' ? window.bridgeApi : undefined
  const globalBridgeApi = (globalThis as { bridgeApi?: BridgeApi }).bridgeApi
  const resolvedBridgeApi = windowBridgeApi || globalBridgeApi

  if (!resolvedBridgeApi) {
    throw new Error('bridgeApi is unavailable. Ensure the Electron preload script loaded successfully and exposed window.bridgeApi.')
  }

  bridgeApi = resolvedBridgeApi

  return bridgeApi
}

const listenerCleanupMap = new Map<string, Map<BridgeIpcListener, Set<BridgeIpcCleanup>>>()

const getChannelListeners = (channel: string) => {
  let channelListeners = listenerCleanupMap.get(channel)
  if (!channelListeners) {
    channelListeners = new Map()
    listenerCleanupMap.set(channel, channelListeners)
  }
  return channelListeners
}

const untrackCleanup = (channel: string, listener: BridgeIpcListener, cleanup: BridgeIpcCleanup) => {
  const channelListeners = listenerCleanupMap.get(channel)
  if (!channelListeners) return

  const cleanupSet = channelListeners.get(listener)
  if (!cleanupSet) return

  cleanupSet.delete(cleanup)
  if (cleanupSet.size === 0) {
    channelListeners.delete(listener)
  }

  if (channelListeners.size === 0) {
    listenerCleanupMap.delete(channel)
  }
}

const trackCleanup = (channel: string, listener: BridgeIpcListener, cleanup: BridgeIpcCleanup) => {
  const channelListeners = getChannelListeners(channel)
  const cleanupSet = channelListeners.get(listener) || new Set<BridgeIpcCleanup>()
  const trackedCleanup = () => {
    cleanup()
    untrackCleanup(channel, listener, trackedCleanup)
  }

  cleanupSet.add(trackedCleanup)
  channelListeners.set(listener, cleanupSet)

  return trackedCleanup
}

export const ipc = {
  send: (channel: string, ...args: unknown[]) => resolveBridgeApi().ipc.send(channel, ...args),
  invoke: <T>(channel: string, ...args: unknown[]) => resolveBridgeApi().ipc.invoke<T>(channel, ...args),
  on: (channel: string, listener: BridgeIpcListener) => {
    const cleanup = resolveBridgeApi().ipc.on(channel, listener)
    return trackCleanup(channel, listener, cleanup)
  },
  once: (channel: string, listener: BridgeIpcListener) => {
    let trackedCleanup: BridgeIpcCleanup = () => {}

    const wrappedListener: BridgeIpcListener = (...args) => {
      untrackCleanup(channel, listener, trackedCleanup)
      listener(...args)
    }

    const cleanup = resolveBridgeApi().ipc.once(channel, wrappedListener)
    trackedCleanup = trackCleanup(channel, listener, cleanup)

    return trackedCleanup
  },
  off: (channel: string, listener: BridgeIpcListener) => {
    const cleanupSet = listenerCleanupMap.get(channel)?.get(listener)
    if (!cleanupSet) return

    Array.from(cleanupSet).forEach((cleanup) => {
      cleanup()
    })
  },
  removeAllListeners: (channel: string) => {
    resolveBridgeApi().ipc.removeAllListeners(channel)
    listenerCleanupMap.delete(channel)
  }
}

export const clipboard = {
  writeText: (text: string) => resolveBridgeApi().clipboard.writeText(text)
}

export const webUtils = {
  getPathForFile: (file: File) => resolveBridgeApi().webUtils.getPathForFile(file)
}

export const webFrame = {
  setVisualZoomLevelLimits: (minimumLevel: number, maximumLevel: number) => {
    resolveBridgeApi().webFrame.setVisualZoomLevelLimits(minimumLevel, maximumLevel)
  }
}

export const env: BridgeApi['env'] = {
  get platform () {
    return resolveBridgeApi().env.platform
  },
  get isDev () {
    return resolveBridgeApi().env.isDev
  }
}

export const picgoI18n: BridgeApi['i18n'] = {
  ObjectAdapter: {
    create: (locales: Record<string, ILocales>) => resolveBridgeApi().i18n.ObjectAdapter.create(locales)
  },
  I18n: {
    createFromLocales: (locales: Record<string, ILocales>, defaultLanguage: string) => {
      return resolveBridgeApi().i18n.I18n.createFromLocales(locales, defaultLanguage)
    }
  }
}

export const getPlatform = () => env.platform
export const isDevEnv = () => env.isDev
export const isMacOSPlatform = () => env.platform === 'darwin'
export const isWindowsPlatform = () => env.platform === 'win32'
export const isLinuxPlatform = () => env.platform === 'linux'
