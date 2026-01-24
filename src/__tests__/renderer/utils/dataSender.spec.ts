import { beforeEach, describe, expect, it, vi } from 'vitest'
import { saveConfig } from '@/utils/dataSender'
import { PICGO_SAVE_CONFIG } from '#/events/constants'
import { ipcRenderer } from 'electron'

vi.mock('electron', () => {
  return {
    ipcRenderer: {
      invoke: vi.fn(),
      on: vi.fn(),
      once: vi.fn(),
      send: vi.fn(),
      removeListener: vi.fn()
    }
  }
})

describe('renderer/utils/dataSender', () => {
  const ipcRendererMock = vi.mocked(ipcRenderer)

  beforeEach(() => {
    vi.clearAllMocks()
    ipcRendererMock.invoke.mockResolvedValue(true)
  })

  it('invokes save config IPC after saveConfig', async () => {
    await saveConfig('settings.language', 'en')

    expect(ipcRendererMock.invoke).toHaveBeenCalledWith(PICGO_SAVE_CONFIG, {
      'settings.language': 'en'
    })
  })
})
