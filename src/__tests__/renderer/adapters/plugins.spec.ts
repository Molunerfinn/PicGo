import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ipcRenderer } from 'electron'
import { PICGO_CONFIG_PLUGIN, PICGO_HANDLE_PLUGIN_DONE, PICGO_HANDLE_PLUGIN_ING, PICGO_TOGGLE_PLUGIN } from '#/events/constants'
import { pluginsAdapter } from '@/adapters/plugins'

vi.mock('electron', () => {
  return {
    ipcRenderer: {
      on: vi.fn(),
      once: vi.fn(),
      removeListener: vi.fn()
    }
  }
})

describe('renderer/adapters plugins', () => {
  const ipcRendererMock = vi.mocked(ipcRenderer)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('subscribes and unsubscribes plugin lifecycle channels', () => {
    const onPluginDone = vi.fn()
    const onPluginIng = vi.fn()
    const onPluginToggle = vi.fn()
    const onConfigPlugin = vi.fn()

    const unsubscribe = pluginsAdapter.subscribeLifecycle({
      onConfigPlugin,
      onPluginDone,
      onPluginIng,
      onPluginToggle
    })

    expect(ipcRendererMock.on).toHaveBeenCalledWith(PICGO_CONFIG_PLUGIN, expect.any(Function))
    expect(ipcRendererMock.on).toHaveBeenCalledWith(PICGO_HANDLE_PLUGIN_DONE, expect.any(Function))
    expect(ipcRendererMock.on).toHaveBeenCalledWith(PICGO_HANDLE_PLUGIN_ING, expect.any(Function))
    expect(ipcRendererMock.on).toHaveBeenCalledWith(PICGO_TOGGLE_PLUGIN, expect.any(Function))

    unsubscribe()

    expect(ipcRendererMock.removeListener).toHaveBeenCalledTimes(4)
  })
})
