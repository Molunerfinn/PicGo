import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ipcRenderer } from 'electron'
import { SHOW_PLUGIN_PAGE_MENU } from '#/events/constants'
import { pluginsAdapter } from '@/adapters/plugins'

vi.mock('electron', () => {
  return {
    ipcRenderer: {
      on: vi.fn(),
      once: vi.fn(),
      removeListener: vi.fn(),
      send: vi.fn()
    }
  }
})

describe('renderer/adapters plugins', () => {
  const ipcRendererMock = vi.mocked(ipcRenderer)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('opens plugin page menu through ipc', () => {
    const plugin = {
      name: 'demo',
      fullName: 'picgo-plugin-demo',
      author: 'author',
      description: 'desc',
      logo: '',
      version: '1.0.0',
      gui: true,
      config: {},
      homepage: '',
      ing: false
    } as IPicGoPlugin

    pluginsAdapter.openPluginMenu(plugin)

    expect(ipcRendererMock.send).toHaveBeenCalledWith(SHOW_PLUGIN_PAGE_MENU, plugin)
  })
})
