import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ipcRenderer } from 'electron'
import { APP_CONFIG_UPDATED } from '#/events/constants'
import { appConfigAdapter } from '@/adapters/app-config'

vi.mock('electron', () => {
  return {
    ipcRenderer: {
      on: vi.fn(),
      removeListener: vi.fn()
    }
  }
})

describe('renderer/adapters appConfig', () => {
  const ipcRendererMock = vi.mocked(ipcRenderer)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('subscribes and unsubscribes app config updates through ipcRenderer', () => {
    const listener = vi.fn()
    const unsubscribe = appConfigAdapter.subscribeToUpdates(listener)

    expect(ipcRendererMock.on).toHaveBeenCalledWith(APP_CONFIG_UPDATED, listener)

    unsubscribe()

    expect(ipcRendererMock.removeListener).toHaveBeenCalledWith(APP_CONFIG_UPDATED, listener)
  })
})
