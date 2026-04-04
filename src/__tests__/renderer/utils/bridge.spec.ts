import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type CleanupFn = ReturnType<typeof vi.fn>

describe('renderer/utils/bridge', () => {
  let onCleanup: CleanupFn
  let onceCleanup: CleanupFn

  const bridgeApiMock = {
    ipc: {
      invoke: vi.fn(),
      send: vi.fn(),
      removeAllListeners: vi.fn(),
      on: vi.fn((_channel: string, _listener: BridgeIpcListener) => {
        onCleanup = vi.fn()
        return onCleanup
      }),
      once: vi.fn((_channel: string, _listener: BridgeIpcListener) => {
        onceCleanup = vi.fn()
        return onceCleanup
      })
    },
    clipboard: {
      writeText: vi.fn()
    },
    webUtils: {
      getPathForFile: vi.fn()
    },
    webFrame: {
      setVisualZoomLevelLimits: vi.fn()
    },
    env: {
      platform: 'darwin' as NodeJS.Platform,
      isDev: false
    },
    i18n: {
      ObjectAdapter: {
        create: vi.fn()
      },
      I18n: {
        createFromLocales: vi.fn()
      }
    }
  }

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    onCleanup = vi.fn()
    onceCleanup = vi.fn()
    vi.stubGlobal('window', { bridgeApi: bridgeApiMock })
    vi.stubGlobal('bridgeApi', bridgeApiMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns preload cleanup for on', async () => {
    const { ipc } = await import('@/utils/bridge')
    const listener = vi.fn()

    const cleanup = ipc.on('demo', listener)
    cleanup()

    expect(bridgeApiMock.ipc.on).toHaveBeenCalledWith('demo', listener)
    expect(onCleanup).toHaveBeenCalledTimes(1)
  })

  it('returns preload cleanup for once', async () => {
    const { ipc } = await import('@/utils/bridge')
    const listener = vi.fn()

    const cleanup = ipc.once('demo', listener)
    cleanup()

    expect(bridgeApiMock.ipc.once).toHaveBeenCalledTimes(1)
    expect(bridgeApiMock.ipc.once).toHaveBeenCalledWith('demo', listener)
    expect(onceCleanup).toHaveBeenCalledTimes(1)
  })

  it('delegates removeAllListeners to preload', async () => {
    const { ipc } = await import('@/utils/bridge')
    ipc.removeAllListeners('demo')

    expect(bridgeApiMock.ipc.removeAllListeners).toHaveBeenCalledWith('demo')
  })
})
