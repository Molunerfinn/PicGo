import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type CleanupFn = ReturnType<typeof vi.fn>

describe('renderer/utils/bridge', () => {
  const onCleanupFns: CleanupFn[] = []
  const onceCleanupFns: CleanupFn[] = []
  const onceWrappedListeners: BridgeIpcListener[] = []

  const bridgeApiMock = {
    ipc: {
      invoke: vi.fn(),
      send: vi.fn(),
      off: vi.fn(),
      removeAllListeners: vi.fn(),
      on: vi.fn((_channel: string, _listener: BridgeIpcListener) => {
        const cleanup = vi.fn()
        onCleanupFns.push(cleanup)
        return cleanup
      }),
      once: vi.fn((channel: string, listener: BridgeIpcListener) => {
        onceWrappedListeners.push(listener)
        const cleanup = vi.fn()
        onceCleanupFns.push(cleanup)
        return cleanup
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
    onCleanupFns.length = 0
    onceCleanupFns.length = 0
    onceWrappedListeners.length = 0
    vi.stubGlobal('window', { bridgeApi: bridgeApiMock })
    vi.stubGlobal('bridgeApi', bridgeApiMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('cleans up all tracked listeners for off', async () => {
    const { ipc } = await import('@/utils/bridge')
    const listener = vi.fn()

    ipc.on('demo', listener)
    ipc.on('demo', listener)
    ipc.off('demo', listener)

    expect(bridgeApiMock.ipc.on).toHaveBeenCalledTimes(2)
    expect(onCleanupFns).toHaveLength(2)
    expect(onCleanupFns[0]).toHaveBeenCalledTimes(1)
    expect(onCleanupFns[1]).toHaveBeenCalledTimes(1)
  })

  it('untracks once listeners after invocation so off no longer cleans them up', async () => {
    const { ipc } = await import('@/utils/bridge')
    const listener = vi.fn()

    ipc.once('demo', listener)

    expect(bridgeApiMock.ipc.once).toHaveBeenCalledTimes(1)
    expect(onceWrappedListeners).toHaveLength(1)

    onceWrappedListeners[0]('payload')
    ipc.off('demo', listener)

    expect(listener).toHaveBeenCalledWith('payload')
    expect(onceCleanupFns[0]).not.toHaveBeenCalled()
  })

  it('clears local listener tracking after removeAllListeners', async () => {
    const { ipc } = await import('@/utils/bridge')
    const listener = vi.fn()

    ipc.on('demo', listener)
    ipc.on('demo', listener)
    ipc.removeAllListeners('demo')
    ipc.off('demo', listener)

    expect(bridgeApiMock.ipc.removeAllListeners).toHaveBeenCalledWith('demo')
    expect(onCleanupFns[0]).not.toHaveBeenCalled()
    expect(onCleanupFns[1]).not.toHaveBeenCalled()
  })
})
