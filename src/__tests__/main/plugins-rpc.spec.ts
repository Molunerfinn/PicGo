import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { IpcMainInvokeEvent } from 'electron'
import { IRPCActionType } from '~/universal/types/enum'
import { PICGO_CLOUD_UPLOADER_TYPE } from '#/utils/static'

interface TestPlugin {
  uploader?: string
  transformer?: string
}

const pluginFullName = 'picgo-plugin-test'
const configValues: Record<string, string | undefined> = {}
let activePlugin: TestPlugin | undefined

const getPluginMock = vi.fn((_fullName: string) => activePlugin)
const getConfigMock = vi.fn((key: string) => configValues[key])
const saveConfigMock = vi.fn()
const uninstallMock = vi.fn()
const unregisterPluginShortKeyMock = vi.fn()
const notifyAppConfigUpdatedMock = vi.fn()

vi.mock('@core/picgo', () => ({
  default: {
    baseDir: '/tmp/picgo-test',
    getConfig: getConfigMock,
    saveConfig: saveConfigMock,
    pluginLoader: {
      getPlugin: getPluginMock
    },
    pluginHandler: {
      install: vi.fn(),
      uninstall: uninstallMock,
      update: vi.fn()
    },
    helper: {
      transformer: { get: vi.fn() },
      uploader: { get: vi.fn() }
    },
    log: {
      warn: vi.fn()
    }
  }
}))

vi.mock('@core/picgo/logger', () => ({
  default: {
    error: vi.fn()
  }
}))

vi.mock('electron', () => ({
  dialog: {
    showOpenDialog: vi.fn()
  }
}))

vi.mock('apis/app/shortKey/shortKeyHandler', () => ({
  default: {
    registerPluginShortKey: vi.fn(),
    unregisterPluginShortKey: unregisterPluginShortKeyMock
  }
}))

vi.mock('apis/app/window/windowManager', () => ({
  default: {
    get: vi.fn()
  }
}))

vi.mock('~/main/i18n', () => ({
  T: (key: string) => key
}))

vi.mock('~/main/utils/common', () => ({
  showNotification: vi.fn()
}))

vi.mock('~/main/utils/appConfigNotifier', () => ({
  notifyAppConfigUpdated: notifyAppConfigUpdatedMock
}))

function createInvokeEvent (): IpcMainInvokeEvent {
  return {
    sender: {
      send: vi.fn()
    }
  } as unknown as IpcMainInvokeEvent
}

async function invokePluginAction (action: IRPCActionType) {
  const { pluginsRouter } = await import('../../main/events/rpc/routes/plugins')
  const handler = pluginsRouter.routes().get(action)

  expect(handler).toBeDefined()
  return handler?.([pluginFullName], createInvokeEvent())
}

describe('plugins RPC restore state', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(configValues).forEach((key) => delete configValues[key])
    activePlugin = {
      uploader: 'test-uploader',
      transformer: 'test-transformer'
    }
    uninstallMock.mockResolvedValue({
      success: true,
      body: [pluginFullName]
    })
  })

  it('restores PicGo Cloud and the path transformer when disabling the active plugin', async () => {
    configValues['picBed.uploader'] = 'test-uploader'
    configValues['picBed.current'] = 'test-uploader'
    configValues['picBed.transformer'] = 'test-transformer'

    const result = await invokePluginAction(IRPCActionType.DISABLE_PLUGIN)

    expect(saveConfigMock).toHaveBeenNthCalledWith(1, {
      'picBed.current': PICGO_CLOUD_UPLOADER_TYPE,
      'picBed.uploader': PICGO_CLOUD_UPLOADER_TYPE,
      'picBed.transformer': 'path'
    })
    expect(saveConfigMock).toHaveBeenNthCalledWith(2, {
      [`picgoPlugins.${pluginFullName}`]: false,
      needReload: true
    })
    expect(notifyAppConfigUpdatedMock).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ success: true, data: pluginFullName })
  })

  it('restores PicGo Cloud when uninstalling the active uploader plugin', async () => {
    configValues['picBed.uploader'] = 'test-uploader'
    configValues['picBed.current'] = 'test-uploader'
    configValues['picBed.transformer'] = 'path'

    const result = await invokePluginAction(IRPCActionType.UNINSTALL_PLUGIN)

    expect(saveConfigMock).toHaveBeenNthCalledWith(1, {
      'picBed.current': PICGO_CLOUD_UPLOADER_TYPE,
      'picBed.uploader': PICGO_CLOUD_UPLOADER_TYPE
    })
    expect(uninstallMock).toHaveBeenCalledWith([pluginFullName])
    expect(unregisterPluginShortKeyMock).toHaveBeenCalledWith(pluginFullName)
    expect(saveConfigMock).toHaveBeenNthCalledWith(2, {
      needReload: true
    })
    expect(notifyAppConfigUpdatedMock).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ success: true, data: pluginFullName })
  })

  it('preserves an explicitly configured SM.MS uploader while restoring an active transformer', async () => {
    configValues['picBed.uploader'] = 'smms'
    configValues['picBed.current'] = 'smms'
    configValues['picBed.transformer'] = 'test-transformer'

    await invokePluginAction(IRPCActionType.DISABLE_PLUGIN)

    expect(saveConfigMock).toHaveBeenNthCalledWith(1, {
      'picBed.transformer': 'path'
    })
    expect(saveConfigMock).toHaveBeenNthCalledWith(2, {
      [`picgoPlugins.${pluginFullName}`]: false,
      needReload: true
    })
  })
})
