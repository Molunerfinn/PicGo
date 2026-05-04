import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/adapters/plugins', () => ({
  pluginsAdapter: {
    installPlugin: vi.fn(),
    importLocalPlugin: vi.fn(),
    uninstallPlugin: vi.fn(),
    updatePlugin: vi.fn(),
    togglePluginEnabled: vi.fn(),
    saveTransformer: vi.fn(),
    setNeedReload: vi.fn(),
    getInstalledPlugins: vi.fn(),
    savePluginConfig: vi.fn(),
    fetchPluginReadme: vi.fn(),
    searchPlugins: vi.fn()
  }
}))

vi.mock('@/store/app-actions', () => ({
  appActions: {
    hydrateAppState: vi.fn(),
    refreshAppConfig: vi.fn()
  }
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn()
  }
}))

import { pluginsAdapter } from '@/adapters/plugins'
import { pluginReadmeStatus, type PluginInstalledItem } from '@/components/main/plugins/types'
import { appActions } from '@/store/app-actions'
import { useAppStore } from '@/store/app-store'
import { pluginStoreActions } from '@/store/plugins/actions'
import { usePluginStore } from '@/store/plugins/store'
import { toast } from 'sonner'
import { IPasteStyle, IStartupMode } from '~/universal/types/enum'

function createInstalledPlugin (overrides?: Partial<PluginInstalledItem>): PluginInstalledItem {
  return {
    name: 'cloudflare-r2-xqv',
    fullName: 'picgo-plugin-cloudflare-r2-xqv',
    author: 'xiaoqinvar',
    description: 'picgo for cloudflare-r2 storage',
    logo: 'https://example.com/logo.png',
    version: '1.0.4',
    gui: true,
    homepage: 'https://example.com',
    enabled: true,
    hasInstall: true,
    guiMenu: [],
    config: {
      plugin: {
        name: 'cloudflare-r2-xqv',
        fullName: 'picgo-plugin-cloudflare-r2-xqv',
        config: []
      },
      transformer: {
        name: 'path',
        fullName: 'path',
        config: []
      }
    },
    uploader: {
      id: 'cloudflare',
      name: 'cloudflare',
      schema: [],
      configState: {
        configList: [],
        defaultId: ''
      }
    },
    ...overrides
  }
}

function resetStores () {
  useAppStore.setState({
    defaultPicBed: 'smms',
    appConfig: {
      picBed: {
        uploader: 'smms',
        current: 'smms',
        transformer: 'path',
        proxy: '',
        list: []
      },
      uploader: {},
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
        startupMode: IStartupMode.HIDE,
        shortKey: {},
        urlRewrite: {
          rules: []
        }
      },
      picgoPlugins: {},
      plugins: {},
      transformer: {},
      needReload: false
    },
    picBeds: [],
    providers: [],
    providerSchemas: {},
    pluginsInstalled: [],
    settingsVersion: {
      currentVersion: '2.5.3',
      latestVersion: null
    },
    hasHydrated: true,
    hasSettingsHydrated: true,
    picgoCloud: {
      loginStatus: 'IDLE',
      loginError: null,
      hasAgreedToTermsAndPrivacy: false
    }
  })

  usePluginStore.setState({
    searchValue: '',
    exactMatch: false,
    rawSearchResults: [],
    searchResults: [],
    isSearching: false,
    isImportingLocal: false,
    isMutatingByPlugin: {},
    readmeByPlugin: {}
  })
}

describe('renderer/store plugins', () => {
  const installPluginMock = vi.mocked(pluginsAdapter.installPlugin)
  const importLocalPluginMock = vi.mocked(pluginsAdapter.importLocalPlugin)
  const uninstallPluginMock = vi.mocked(pluginsAdapter.uninstallPlugin)
  const updatePluginMock = vi.mocked(pluginsAdapter.updatePlugin)
  const togglePluginEnabledMock = vi.mocked(pluginsAdapter.togglePluginEnabled)
  const getInstalledPluginsMock = vi.mocked(pluginsAdapter.getInstalledPlugins)
  const fetchPluginReadmeMock = vi.mocked(pluginsAdapter.fetchPluginReadme)
  const hydrateAppStateMock = vi.mocked(appActions.hydrateAppState)
  const refreshAppConfigMock = vi.mocked(appActions.refreshAppConfig)
  const toastSuccessMock = vi.mocked(toast.success)

  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
  })

  it('installs plugin and shows success toast', async () => {
    const installedPlugin = createInstalledPlugin()
    installPluginMock.mockResolvedValue({
      success: true,
      body: installedPlugin.fullName,
      errMsg: ''
    })
    getInstalledPluginsMock.mockResolvedValue([installedPlugin as unknown as IPicGoPlugin])

    await pluginStoreActions.installPlugin(installedPlugin.fullName)

    expect(installPluginMock).toHaveBeenCalledWith(installedPlugin.fullName)
    expect(hydrateAppStateMock).toHaveBeenCalled()
    expect(useAppStore.getState().pluginsInstalled).toHaveLength(1)
    expect(toastSuccessMock).toHaveBeenCalled()
  })

  it('toggles plugin enabled state and shows success toast', async () => {
    const installedPlugin = createInstalledPlugin()
    useAppStore.setState({ pluginsInstalled: [installedPlugin] })
    togglePluginEnabledMock.mockResolvedValue({
      success: true,
      data: installedPlugin.fullName
    })
    getInstalledPluginsMock.mockResolvedValue([
      { ...installedPlugin, enabled: false } as unknown as IPicGoPlugin
    ])

    await pluginStoreActions.setPluginEnabled(installedPlugin.fullName, false)

    expect(togglePluginEnabledMock).toHaveBeenCalledWith(installedPlugin.fullName, false)
    expect(useAppStore.getState().pluginsInstalled[0]?.enabled).toBe(false)
    expect(toastSuccessMock).toHaveBeenCalled()
  })

  it('updates plugin and marks needReload', async () => {
    const installedPlugin = createInstalledPlugin()
    useAppStore.setState({ pluginsInstalled: [installedPlugin] })
    updatePluginMock.mockResolvedValue({
      success: true,
      data: installedPlugin.fullName
    })
    getInstalledPluginsMock.mockResolvedValue([installedPlugin as unknown as IPicGoPlugin])

    await pluginStoreActions.updatePlugin(installedPlugin.fullName)

    expect(updatePluginMock).toHaveBeenCalledWith(installedPlugin.fullName)
    expect(useAppStore.getState().appConfig?.needReload).toBe(true)
    expect(toastSuccessMock).toHaveBeenCalled()
  })

  it('uninstalls plugin and marks needReload', async () => {
    const installedPlugin = createInstalledPlugin()
    useAppStore.setState({ pluginsInstalled: [installedPlugin] })
    uninstallPluginMock.mockResolvedValue({
      success: true,
      data: installedPlugin.fullName
    })
    getInstalledPluginsMock.mockResolvedValue([])

    await pluginStoreActions.uninstallPlugin(installedPlugin.fullName)

    expect(uninstallPluginMock).toHaveBeenCalledWith(installedPlugin.fullName)
    expect(useAppStore.getState().pluginsInstalled).toEqual([])
    expect(useAppStore.getState().appConfig?.needReload).toBe(true)
    expect(toastSuccessMock).toHaveBeenCalled()
  })

  it('imports local plugin via RPC result and selects installed plugin data', async () => {
    const installedPlugin = createInstalledPlugin()
    importLocalPluginMock.mockResolvedValue({
      success: true,
      data: installedPlugin.fullName
    })
    getInstalledPluginsMock.mockResolvedValue([installedPlugin as unknown as IPicGoPlugin])

    const result = await pluginStoreActions.importLocalPlugin()

    expect(importLocalPluginMock).toHaveBeenCalled()
    expect(result?.installedPlugin.fullName).toBe(installedPlugin.fullName)
    expect(usePluginStore.getState().isImportingLocal).toBe(false)
    expect(toastSuccessMock).toHaveBeenCalled()
  })

  it('returns null when local import is cancelled', async () => {
    importLocalPluginMock.mockResolvedValue({
      success: true,
      data: null
    })

    const result = await pluginStoreActions.importLocalPlugin()

    expect(result).toBeNull()
    expect(getInstalledPluginsMock).not.toHaveBeenCalled()
    expect(usePluginStore.getState().isImportingLocal).toBe(false)
  })

  it('filters exact-match search results from cached raw results', () => {
    usePluginStore.setState({
      searchValue: 'cloudflare',
      exactMatch: false,
      rawSearchResults: [
        {
          name: 'cloudflare-r2-xqv',
          fullName: 'picgo-plugin-cloudflare-r2-xqv',
          author: 'foo',
          description: 'foo',
          logo: '',
          version: '1.0.0',
          homepage: '',
          gui: true,
          hasInstall: false
        },
        {
          name: 'other',
          fullName: 'picgo-plugin-other',
          author: 'bar',
          description: 'bar',
          logo: '',
          version: '1.0.0',
          homepage: '',
          gui: true,
          hasInstall: false
        }
      ],
      searchResults: []
    })

    pluginStoreActions.toggleExactMatch()

    expect(usePluginStore.getState().exactMatch).toBe(true)
    expect(usePluginStore.getState().searchResults).toHaveLength(1)
    expect(usePluginStore.getState().searchResults[0]?.fullName).toBe(
      'picgo-plugin-cloudflare-r2-xqv'
    )
  })

  it('fetches README into ready state', async () => {
    fetchPluginReadmeMock.mockResolvedValue('# hello')

    await pluginStoreActions.fetchPluginReadme('picgo-plugin-cloudflare-r2-xqv')

    expect(usePluginStore.getState().readmeByPlugin['picgo-plugin-cloudflare-r2-xqv']).toEqual({
      status: pluginReadmeStatus.Ready,
      content: '# hello',
      errorMessage: null
    })
  })

  it('refreshes app config after saving plugin config', async () => {
    const installedPlugin = createInstalledPlugin()
    useAppStore.setState({ pluginsInstalled: [installedPlugin] })
    vi.mocked(pluginsAdapter.savePluginConfig).mockResolvedValue(undefined)
    getInstalledPluginsMock.mockResolvedValue([installedPlugin as unknown as IPicGoPlugin])

    await pluginStoreActions.savePluginConfig(installedPlugin.fullName, 'config', {
      token: 'abc'
    })

    expect(vi.mocked(pluginsAdapter.savePluginConfig)).toHaveBeenCalledWith(
      'plugin',
      installedPlugin.config.plugin.fullName,
      { token: 'abc' }
    )
    expect(refreshAppConfigMock).toHaveBeenCalled()
  })
})
