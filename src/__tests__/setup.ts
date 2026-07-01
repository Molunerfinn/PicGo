import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import {
  GET_CURRENT_LANGUAGE,
  GET_LANGUAGE_LIST,
  GET_PICBEDS,
  PICGO_GET_CONFIG,
  RPC_ACTIONS
} from '#/events/constants'
import { IRPCActionType } from '~/universal/types/enum'

type TestBridgeListener = (...args: unknown[]) => void

const bridgeListeners = new Map<string, Set<TestBridgeListener>>()

const addBridgeListener = (channel: string, listener: TestBridgeListener) => {
  const listeners = bridgeListeners.get(channel) || new Set<TestBridgeListener>()
  listeners.add(listener)
  bridgeListeners.set(channel, listeners)

  return () => {
    const currentListeners = bridgeListeners.get(channel)
    currentListeners?.delete(listener)
    if (currentListeners?.size === 0) {
      bridgeListeners.delete(channel)
    }
  }
}

const emitBridgeEvent = (channel: string, ...args: unknown[]) => {
  const listeners = bridgeListeners.get(channel)
  if (!listeners) {
    return
  }

  Array.from(listeners).forEach((listener) => {
    listener(...args)
  })
}

const createDefaultBridgeApi = (): BridgeApi => {
  return {
    ipc: {
      send: (channel: string, ...args: unknown[]) => {
        if (channel === PICGO_GET_CONFIG) {
          emitBridgeEvent(PICGO_GET_CONFIG, undefined, args[1])
          return
        }

        if (channel === GET_PICBEDS) {
          emitBridgeEvent(GET_PICBEDS, [])
          return
        }

        if (channel === GET_CURRENT_LANGUAGE) {
          emitBridgeEvent(GET_CURRENT_LANGUAGE, 'en')
          return
        }

        if (channel === GET_LANGUAGE_LIST) {
          emitBridgeEvent(GET_LANGUAGE_LIST, [])
        }
      },
      invoke: async <T>(channel: string, ...args: unknown[]) => {
        if (channel === RPC_ACTIONS) {
          const action = args[0]

          if (action === IRPCActionType.GET_WINDOW_STATE) {
            return {
              success: true,
              data: {
                isMaximized: false
              },
              error: ''
            } as T
          }

          return {
            success: true,
            data: null,
            error: ''
          } as T
        }

        return undefined as T
      },
      on: (channel: string, listener: BridgeIpcListener) => addBridgeListener(channel, listener),
      once: (channel: string, listener: BridgeIpcListener) => {
        let cleanup = () => {}
        const wrappedListener: TestBridgeListener = (...args: unknown[]) => {
          cleanup()
          listener(...args)
        }
        cleanup = addBridgeListener(channel, wrappedListener)
        return cleanup
      },
      removeAllListeners: (channel: string) => {
        bridgeListeners.delete(channel)
      }
    },
    webUtils: {
      getPathForFile: () => '/tmp/mock-file.png'
    },
    webFrame: {
      setVisualZoomLevelLimits: () => {}
    },
    env: {
      platform: 'darwin',
      isDev: false
    },
    i18n: {
      ObjectAdapter: {
        create: (locales: Record<string, ILocales>) => ({
          getLocale: (language: string) => locales[language],
          setLocales: () => {},
          setLocale: () => {}
        })
      },
      I18n: {
        createFromLocales: (locales: Record<string, ILocales>, defaultLanguage: string) => {
          let language = defaultLanguage

          return {
            getLanguage: () => language,
            setLanguage: (nextLanguage: string) => {
              language = nextLanguage
            },
            setDefaultLanguage: (nextLanguage: string) => {
              language = nextLanguage
            },
            translate: (key: ILocalesKey, args: IStringKeyMap = {}) => {
              const locale = locales[language]
              const template = locale?.[key] || key

              return Object.keys(args).reduce((result, token) => {
                return result.replaceAll(`\${${token}}`, String(args[token]))
              }, template)
            }
          }
        }
      }
    }
  }
}

const installDefaultBridgeApi = () => {
  const bridgeApi = createDefaultBridgeApi()
  ;(globalThis as typeof globalThis & { bridgeApi?: BridgeApi }).bridgeApi = bridgeApi

  if (typeof window !== 'undefined') {
    window.bridgeApi = bridgeApi
  }
}

installDefaultBridgeApi()

beforeEach(() => {
  bridgeListeners.clear()
  installDefaultBridgeApi()
})

afterEach(() => {
  bridgeListeners.clear()
  cleanup()
})

if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    })
  })
}
