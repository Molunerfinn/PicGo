import Vue, { VNode } from 'vue'

declare global {
  type BridgeIpcListener = (...args: any[]) => void
  type BridgeIpcCleanup = () => void

  interface BridgeObjectAdapter {
    getLocale: (language: string) => ILocales | undefined
    setLocales: (locales: Record<string, ILocales>) => void
    setLocale: (language: string, locale: ILocales) => void
  }

  interface BridgeI18nInstance {
    getLanguage: () => string
    setLanguage: (language: string) => void
    setDefaultLanguage: (language: string) => void
    translate: (key: ILocalesKey, args?: IStringKeyMap) => string
  }

  interface BridgeApi {
    ipc: {
      send: (channel: string, ...args: unknown[]) => void
      invoke: <T>(channel: string, ...args: unknown[]) => Promise<T>
      on: (channel: string, listener: BridgeIpcListener) => BridgeIpcCleanup
      once: (channel: string, listener: BridgeIpcListener) => BridgeIpcCleanup
      off: (channel: string, listener: BridgeIpcListener) => void
      removeAllListeners: (channel: string) => void
    }
    clipboard: {
      writeText: (text: string) => void
    }
    webUtils: {
      getPathForFile: (file: File) => string
    }
    webFrame: {
      setVisualZoomLevelLimits: (minimumLevel: number, maximumLevel: number) => void
    }
    env: {
      platform: NodeJS.Platform
      isDev: boolean
    }
    i18n: {
      ObjectAdapter: {
        create: (locales: Record<string, ILocales>) => BridgeObjectAdapter
      }
      I18n: {
        createFromLocales: (locales: Record<string, ILocales>, defaultLanguage: string) => BridgeI18nInstance
      }
    }
  }

  namespace JSX {
    // tslint:disable no-empty-interface
    interface Element extends VNode {}
    // tslint:disable no-empty-interface
    interface ElementClass extends Vue {}
    interface IntrinsicElements {
      [elem: string]: any
    }
  }

  interface Window {
    bridgeApi: BridgeApi
    TDAPP: {
      onEvent: (EventId: string, Label?: string, MapKv?: IStringKeyMap) => void
      register: (opt: {
        profileId: string,
        profileType: number,
      }) => void
      login: (opt: {
        profileId: string,
        profileType: number,
      }) => void
    }
  }
}
