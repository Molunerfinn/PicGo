import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppConfig } from '@/components/main/providers/types'
import { IPasteStyle, IStartupMode } from '~/universal/types/enum'

vi.mock('@/adapters/providers', () => ({
  providersAdapter: {
    getProviderSchema: vi.fn(),
    getProviderConfigList: vi.fn(),
    selectProviderConfig: vi.fn(),
    changeCurrentUploader: vi.fn(),
    deleteProviderConfig: vi.fn(),
    copyProviderConfig: vi.fn(),
    saveProviderConfig: vi.fn()
  }
}))

vi.mock('@/store/app-actions', () => ({
  appActions: {
    hydrateAppState: vi.fn(),
    ensureHydrated: vi.fn(),
    ensureSettingsHydrated: vi.fn(),
    setDefaultPicBed: vi.fn()
  }
}))

import { providersAdapter } from '@/adapters/providers'
import { appActions } from '@/store/app-actions'
import { useAppStore } from '@/store/app-store'
import { useProviderStore } from '@/store/providers/store'
import { providerStoreActions } from '@/store/providers/actions'

function createAppConfig (): AppConfig {
  return {
    picBed: {
      uploader: 'github',
      current: 'github',
      transformer: 'path',
      proxy: '',
      list: [
        { type: 'github', name: 'GitHub', visible: true }
      ]
    },
    uploader: {
      github: {
        defaultId: 'cfg-1',
        configList: [
          {
            _id: 'cfg-1',
            _configName: 'Default',
            _createdAt: 1,
            _updatedAt: 1,
            token: 'old-token'
          }
        ]
      }
    },
    settings: {
      appearance: 'auto',
      pasteStyle: IPasteStyle.MARKDOWN,
      showUpdateTip: false,
      autoStart: false,
      rename: false,
      autoRename: false,
      uploadNotification: false,
      notificationSound: true,
      miniWindowOnTop: false,
      logLevel: ['all'],
      autoCopyUrl: true,
      checkBetaUpdate: true,
      useBuiltinClipboard: false,
      language: 'en',
      logFileSizeLimit: 10,
      encodeOutputURL: false,
      showDockIcon: true,
      showMenubarIcon: true,
      customLink: '$url',
      npmProxy: '',
      npmRegistry: '',
      server: {
        port: 36677,
        host: '127.0.0.1',
        enable: true
      },
      startupMode: IStartupMode.SHOW_MAIN_WINDOW,
      shortKey: {
        'picgo:upload': {
          name: 'upload',
          label: 'Quick Upload',
          key: 'CommandOrControl+Shift+U',
          enable: true
        }
      },
      urlRewrite: {
        rules: []
      }
    },
    picgoPlugins: {},
    plugins: {},
    transformer: {},
    needReload: false
  }
}

function resetStores () {
  useAppStore.setState((state) => {
    state.appConfig = createAppConfig()
    state.providers = [
      {
        id: 'github',
        name: 'GitHub',
        visible: true,
        isDefaultUploader: true
      }
    ]
    state.providerSchemas = {}
    state.hasHydrated = true
  })

  useProviderStore.setState((state) => {
    state.isHydrating = false
    state.isLoadingByProvider = {}
    state.expandedProviderIds = []
    state.searchValue = ''
  })
}

describe('renderer/store providers', () => {
  const getProviderSchemaMock = vi.mocked(providersAdapter.getProviderSchema)
  const selectProviderConfigMock = vi.mocked(providersAdapter.selectProviderConfig)
  const changeCurrentUploaderMock = vi.mocked(providersAdapter.changeCurrentUploader)
  const deleteProviderConfigMock = vi.mocked(providersAdapter.deleteProviderConfig)
  const copyProviderConfigMock = vi.mocked(providersAdapter.copyProviderConfig)
  const saveProviderConfigMock = vi.mocked(providersAdapter.saveProviderConfig)
  const hydrateAppStateMock = vi.mocked(appActions.hydrateAppState)
  const setDefaultPicBedMock = vi.mocked(appActions.setDefaultPicBed)

  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
  })

  it('loads provider schema into global store', async () => {
    getProviderSchemaMock.mockResolvedValue({
      name: 'GitHub',
      config: [
        {
          name: 'token',
          type: 'password',
          required: true,
          alias: 'Token'
        }
      ]
    })

    const schema = await providerStoreActions.ensureSchema('github')

    expect(schema).toEqual({
      id: 'github',
      name: 'GitHub',
      config: [
        {
          name: 'token',
          type: 'password',
          required: true,
          alias: 'Token',
          default: undefined,
          message: undefined,
          prefix: undefined,
          tips: undefined,
          confirmText: undefined,
          cancelText: undefined,
          choices: undefined
        }
      ]
    })
    expect(useAppStore.getState().providerSchemas.github).toEqual(schema)
    expect(useProviderStore.getState().isLoadingByProvider.github).toBe(false)
  })

  it('maps config id to name for default/select dashboard actions', async () => {
    selectProviderConfigMock.mockResolvedValue('cfg-1')

    const selectedId = await providerStoreActions.setDefaultConfig('github', 'cfg-1')

    expect(selectProviderConfigMock).toHaveBeenCalledWith('github', 'Default')
    expect(hydrateAppStateMock).toHaveBeenCalled()
    expect(selectedId).toBe('cfg-1')

    await providerStoreActions.selectDashboardProviderConfig('github', 'cfg-1')

    expect(changeCurrentUploaderMock).toHaveBeenCalledWith('github', 'Default')
  })

  it('creates, copies, deletes and saves provider configs with real adapter calls', async () => {
    saveProviderConfigMock.mockImplementation(async (_type, configId, values) => {
      if (!configId && values._configName === 'New Config') {
        useAppStore.setState((state) => {
          if (!state.appConfig) {
            return
          }

          state.appConfig.uploader.github.configList.push({
            _id: 'cfg-2',
            _configName: 'New Config',
            _createdAt: 2,
            _updatedAt: 2
          })
        })
      }
    })

    const createdId = await providerStoreActions.createConfig('github', 'New Config')

    expect(saveProviderConfigMock).toHaveBeenCalledWith('github', '', {
      _configName: 'New Config'
    })
    expect(createdId).toBe('cfg-2')

    await providerStoreActions.saveConfig('github', 'cfg-2', {
      token: 'new-token'
    })

    expect(saveProviderConfigMock).toHaveBeenLastCalledWith('github', 'cfg-2', {
      token: 'new-token',
      _configName: 'New Config'
    })

    copyProviderConfigMock.mockResolvedValue({
      defaultId: 'cfg-1',
      configList: [
        {
          _id: 'cfg-1',
          _configName: 'Default',
          _createdAt: 1,
          _updatedAt: 1
        },
        {
          _id: 'cfg-3',
          _configName: 'Default - Copy',
          _createdAt: 3,
          _updatedAt: 3
        }
      ]
    })

    const copiedId = await providerStoreActions.copyConfig(
      'github',
      'cfg-1',
      'Default - Copy'
    )

    expect(copyProviderConfigMock).toHaveBeenCalledWith(
      'github',
      'Default',
      'Default - Copy'
    )
    expect(copiedId).toBe('cfg-3')

    deleteProviderConfigMock.mockResolvedValue({
      defaultId: 'cfg-1',
      configList: [
        {
          _id: 'cfg-1',
          _configName: 'Default',
          _createdAt: 1,
          _updatedAt: 1
        }
      ]
    })

    const fallbackId = await providerStoreActions.deleteConfig('github', 'cfg-2')

    expect(deleteProviderConfigMock).toHaveBeenCalledWith('github', 'New Config')
    expect(fallbackId).toBe('cfg-1')
  })

  it('forwards default provider changes to app actions', async () => {
    await providerStoreActions.setDefaultProvider('github')

    expect(setDefaultPicBedMock).toHaveBeenCalledWith('github')
  })
})
