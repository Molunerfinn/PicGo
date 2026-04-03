import { beforeEach, describe, expect, it, vi } from 'vitest'
import { saveConfig } from '@/utils/dataSender'
import { PICGO_SAVE_CONFIG } from '#/events/constants'

describe('renderer/utils/dataSender', () => {
  const bridgeApiMock = {
    ipc: {
      invoke: vi.fn(),
      on: vi.fn(),
      once: vi.fn(),
      send: vi.fn(),
      off: vi.fn(),
      removeAllListeners: vi.fn()
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
    vi.clearAllMocks()
    vi.stubGlobal('window', { bridgeApi: bridgeApiMock })
    bridgeApiMock.ipc.invoke.mockResolvedValue(true)
  })

  it('invokes save config IPC after saveConfig', async () => {
    await saveConfig('settings.language', 'en')

    expect(bridgeApiMock.ipc.invoke).toHaveBeenCalledWith(PICGO_SAVE_CONFIG, {
      'settings.language': 'en'
    })
  })
})
