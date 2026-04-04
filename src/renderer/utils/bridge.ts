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

export const ipc = {
  send: (channel: string, ...args: unknown[]) => resolveBridgeApi().ipc.send(channel, ...args),
  invoke: <T>(channel: string, ...args: unknown[]) => resolveBridgeApi().ipc.invoke<T>(channel, ...args),
  on: (channel: string, listener: BridgeIpcListener) => resolveBridgeApi().ipc.on(channel, listener),
  once: (channel: string, listener: BridgeIpcListener) => resolveBridgeApi().ipc.once(channel, listener),
  removeAllListeners: (channel: string) => resolveBridgeApi().ipc.removeAllListeners(channel)
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
export const isMacOS = () => env.platform === 'darwin'
export const isWindows = () => env.platform === 'win32'
export const isLinux = () => env.platform === 'linux'
