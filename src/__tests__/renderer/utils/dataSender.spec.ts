import { beforeEach, describe, expect, it, vi } from 'vitest'
import { saveConfig } from '@/utils/dataSender'
import { APP_CONFIG_UPDATED, PICGO_SAVE_CONFIG } from '#/events/constants'
import bus from '@/utils/bus'
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

vi.mock('@/utils/bus', () => {
  return {
    default: {
      emit: vi.fn()
    }
  }
})

describe('renderer/utils/dataSender', () => {
  const ipcRendererMock = vi.mocked(ipcRenderer)
  const busMock = vi.mocked(bus)

  beforeEach(() => {
    vi.clearAllMocks()
    ipcRendererMock.invoke.mockResolvedValue(true)
  })

  it('emits app config updated after saveConfig', async () => {
    await saveConfig('settings.language', 'en')

    expect(ipcRendererMock.invoke).toHaveBeenCalledWith(PICGO_SAVE_CONFIG, {
      'settings.language': 'en'
    })
    expect(busMock.emit).toHaveBeenCalledWith(APP_CONFIG_UPDATED)
  })
})
