import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SHOW_PLUGIN_PAGE_MENU, OPEN_URL } from '#/events/constants'
import { IRPCActionType } from '~/universal/types/enum'

vi.mock('@/utils/dataSender', () => ({
  getConfig: vi.fn(),
  invokeRPC: vi.fn(),
  saveConfig: vi.fn(),
  sendRPC: vi.fn(),
  sendToMain: vi.fn()
}))

import { pluginsAdapter } from '@/adapters/plugins'
import {
  getConfig,
  invokeRPC,
  saveConfig,
  sendRPC,
  sendToMain
} from '@/utils/dataSender'

describe('renderer/adapters plugins', () => {
  const getConfigMock = vi.mocked(getConfig)
  const invokeRPCMock = vi.mocked(invokeRPC)
  const saveConfigMock = vi.mocked(saveConfig)
  const sendRPCMock = vi.mocked(sendRPC)
  const sendToMainMock = vi.mocked(sendToMain)

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

    expect(sendToMainMock).toHaveBeenCalledWith(SHOW_PLUGIN_PAGE_MENU, plugin)
  })

  it('installs plugin through install RPC', async () => {
    invokeRPCMock.mockResolvedValue({
      success: true,
      data: 'picgo-plugin-demo'
    })

    const result = await pluginsAdapter.installPlugin('picgo-plugin-demo')

    expect(invokeRPCMock).toHaveBeenCalledWith(
      IRPCActionType.INSTALL_PLUGIN,
      'picgo-plugin-demo'
    )
    expect(result).toEqual({
      success: true,
      body: 'picgo-plugin-demo',
      errMsg: ''
    })
  })

  it('imports local plugin through import RPC', async () => {
    invokeRPCMock.mockResolvedValue({
      success: true,
      data: 'picgo-plugin-local'
    })

    const result = await pluginsAdapter.importLocalPlugin()

    expect(invokeRPCMock).toHaveBeenCalledWith(IRPCActionType.IMPORT_LOCAL_PLUGIN)
    expect(result).toEqual({
      success: true,
      data: 'picgo-plugin-local'
    })
  })

  it('toggles plugin enabled through enable and disable RPC', async () => {
    invokeRPCMock.mockResolvedValue({
      success: true,
      data: 'picgo-plugin-demo'
    })

    await pluginsAdapter.togglePluginEnabled('picgo-plugin-demo', true)
    await pluginsAdapter.togglePluginEnabled('picgo-plugin-demo', false)

    expect(invokeRPCMock).toHaveBeenNthCalledWith(
      1,
      IRPCActionType.ENABLE_PLUGIN,
      'picgo-plugin-demo'
    )
    expect(invokeRPCMock).toHaveBeenNthCalledWith(
      2,
      IRPCActionType.DISABLE_PLUGIN,
      'picgo-plugin-demo'
    )
  })

  it('updates and uninstalls plugin through RPC', async () => {
    invokeRPCMock.mockResolvedValue({
      success: true,
      data: 'picgo-plugin-demo'
    })

    await pluginsAdapter.updatePlugin('picgo-plugin-demo')
    await pluginsAdapter.uninstallPlugin('picgo-plugin-demo')

    expect(invokeRPCMock).toHaveBeenNthCalledWith(
      1,
      IRPCActionType.UPDATE_PLUGIN,
      'picgo-plugin-demo'
    )
    expect(invokeRPCMock).toHaveBeenNthCalledWith(
      2,
      IRPCActionType.UNINSTALL_PLUGIN,
      'picgo-plugin-demo'
    )
  })

  it('persists transformer and needReload via config helpers', async () => {
    await pluginsAdapter.saveTransformer('path')
    await pluginsAdapter.setNeedReload(true)

    expect(saveConfigMock).toHaveBeenNthCalledWith(1, {
      'picBed.transformer': 'path'
    })
    expect(saveConfigMock).toHaveBeenNthCalledWith(2, {
      needReload: true
    })
  })

  it('reads needReload via config helper', async () => {
    getConfigMock.mockResolvedValue(true)

    const result = await pluginsAdapter.getNeedReload()

    expect(getConfigMock).toHaveBeenCalledWith('needReload')
    expect(result).toBe(true)
  })

  it('reloads app through system RPC', () => {
    pluginsAdapter.reloadApp()

    expect(sendRPCMock).toHaveBeenCalledWith(IRPCActionType.RELOAD_APP)
  })

  it('opens homepage and awesome list through main events', () => {
    pluginsAdapter.openPluginHomepage('https://example.com')
    pluginsAdapter.openAwesomeList()

    expect(sendToMainMock).toHaveBeenNthCalledWith(1, OPEN_URL, 'https://example.com')
    expect(sendToMainMock).toHaveBeenNthCalledWith(
      2,
      OPEN_URL,
      'https://github.com/PicGo/Awesome-PicGo'
    )
  })
})
