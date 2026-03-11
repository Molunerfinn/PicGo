import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { IConfig } from 'picgo'
import type { AppConfig } from '@/components/main/providers/types'
import type { SettingsUrlRewriteRule } from '@/components/main/settings/utils'
import { IPasteStyle, IStartupMode } from '~/universal/types/enum'

vi.mock('@/adapters/app-config', () => ({
  appConfigAdapter: {
    getAppConfig: vi.fn(),
    getPicBeds: vi.fn(),
    saveConfig: vi.fn(),
    subscribeToUpdates: vi.fn(() => () => {})
  }
}))

vi.mock('@/adapters/settings', () => ({
  settingsAdapter: {
    savePatch: vi.fn(),
    saveSingle: vi.fn(),
    setAutoStart: vi.fn(),
    showDockIcon: vi.fn(),
    showMenubarIcon: vi.fn(),
    openConfigFile: vi.fn(),
    openLogFile: vi.fn(),
    openExternalUrl: vi.fn(),
    updateServer: vi.fn(),
    updateCustomLink: vi.fn(),
    checkLatestVersion: vi.fn(),
    loadShortcuts: vi.fn(),
    toggleShortcutModifiedMode: vi.fn(),
    toggleShortcutEnabled: vi.fn(),
    updateShortcut: vi.fn(),
    loadUrlRewriteRules: vi.fn(),
    saveUrlRewriteRules: vi.fn(),
    updateVisiblePicBeds: vi.fn()
  }
}))

vi.mock('@/utils/storage', () => ({
  rendererStorage: {
    getItem: vi.fn(),
    setItem: vi.fn()
  }
}))

import { appConfigAdapter } from '@/adapters/app-config'
import { settingsAdapter } from '@/adapters/settings'
import { appActions, settingsStoreActions, useStore } from '@/store'

function createAppConfig (
  overrides?: Partial<AppConfig>,
  settingsOverrides?: Partial<AppConfig['settings']>
): AppConfig {
  const {
    settings: overriddenSettings,
    ...configOverrides
  } = overrides ?? {}
  const baseSettings: AppConfig['settings'] = {
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
  }

  return {
    picBed: {
      uploader: 'smms',
      current: 'smms',
      transformer: '',
      proxy: '',
      list: [
        { type: 'smms', name: 'SM.MS', visible: true },
        { type: 'github', name: 'GitHub', visible: false }
      ]
    },
    uploader: {},
    settings: {
      ...baseSettings,
      ...overriddenSettings,
      ...settingsOverrides
    },
    picgoPlugins: {},
    plugins: {},
    transformer: {},
    needReload: false,
    ...configOverrides
  }
}

function resetStore (overrides?: Partial<AppConfig>) {
  useStore.setState({
    hasHydrated: true,
    hasSettingsHydrated: true,
    appConfig: createAppConfig(overrides),
    picBeds: [
      { type: 'smms', name: 'SM.MS', visible: true },
      { type: 'github', name: 'GitHub', visible: false }
    ],
    settingsVersion: {
      currentVersion: '3.0.0',
      latestVersion: null
    }
  })
}

describe('renderer/store settings', () => {
  const getAppConfigMock = vi.mocked(appConfigAdapter.getAppConfig)
  const getPicBedsMock = vi.mocked(appConfigAdapter.getPicBeds)
  const saveAppConfigMock = vi.mocked(appConfigAdapter.saveConfig)
  const savePatchMock = vi.mocked(settingsAdapter.savePatch)
  const setAutoStartMock = vi.mocked(settingsAdapter.setAutoStart)
  const updateVisiblePicBedsMock = vi.mocked(settingsAdapter.updateVisiblePicBeds)
  const updateShortcutMock = vi.mocked(settingsAdapter.updateShortcut)
  const toggleShortcutEnabledMock = vi.mocked(settingsAdapter.toggleShortcutEnabled)
  const saveUrlRewriteRulesMock = vi.mocked(settingsAdapter.saveUrlRewriteRules)
  const checkLatestVersionMock = vi.mocked(settingsAdapter.checkLatestVersion)

  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('hydrates settings from real config fields', async () => {
    const config: IConfig = {
      picBed: {
        uploader: 'smms',
        current: 'smms',
        proxy: 'http://127.0.0.1:7890'
      },
      settings: {
        language: 'zh-CN',
        autoStart: true,
        shortKey: {
          'picgo:upload': {
            key: 'CommandOrControl+Shift+P',
            name: 'upload',
            label: 'Quick Upload',
            enable: true
          }
        },
        urlRewrite: {
          rules: [
            {
              match: 'foo',
              replace: 'bar',
              enable: false,
              global: true,
              ignoreCase: true
            }
          ]
        }
      },
      picgoPlugins: {}
    }

    getAppConfigMock.mockResolvedValue(config)
    getPicBedsMock.mockResolvedValue([
      { type: 'smms', name: 'SM.MS', visible: true },
      { type: 'github', name: 'GitHub', visible: false }
    ])

    useStore.setState({
      hasHydrated: false,
      hasSettingsHydrated: false,
      appConfig: null
    })

    await appActions.hydrateAppState()

    const state = useStore.getState().appConfig
    expect(state?.settings.language).toBe('zh-CN')
    expect(state?.settings.autoStart).toBe(true)
    expect(state?.picBed.proxy).toBe('http://127.0.0.1:7890')
    expect(state?.settings.shortKey).toEqual({
      'picgo:upload': {
        name: 'upload',
        label: 'Quick Upload',
        key: 'CommandOrControl+Shift+P',
        enable: true
      }
    })
    expect(state?.settings.urlRewrite).toEqual({
      rules: [
        {
          match: 'foo',
          replace: 'bar',
          enable: false,
          global: true,
          ignoreCase: true
        }
      ]
    })
  })

  it('persists prefixed settings keys without duplicating the settings prefix', async () => {
    await settingsStoreActions.saveSettingsConfig('settings.language', 'zh-CN')

    expect(savePatchMock).toHaveBeenCalledWith({
      'settings.language': 'zh-CN'
    })
    expect(useStore.getState().appConfig?.settings.language).toBe('zh-CN')
  })

  it('persists proxy and visible pic beds with production config paths', async () => {
    const nextPicBedList = [
      { type: 'smms', name: 'SM.MS', visible: true },
      { type: 'github', name: 'GitHub', visible: true }
    ]

    updateVisiblePicBedsMock.mockResolvedValue(nextPicBedList)

    await settingsStoreActions.saveSettingsConfig({
      npmProxy: 'http://127.0.0.1:7891',
      npmRegistry: 'https://registry.npmmirror.com'
    })

    expect(savePatchMock).toHaveBeenCalledWith({
      'settings.npmProxy': 'http://127.0.0.1:7891',
      'settings.npmRegistry': 'https://registry.npmmirror.com'
    })
    expect(useStore.getState().appConfig?.settings.npmProxy).toBe(
      'http://127.0.0.1:7891'
    )

    await settingsStoreActions.savePicBedProxy('http://127.0.0.1:7890')

    expect(saveAppConfigMock).toHaveBeenCalledWith({
      'picBed.proxy': 'http://127.0.0.1:7890'
    })
    expect(useStore.getState().appConfig?.picBed.proxy).toBe('http://127.0.0.1:7890')

    await settingsStoreActions.saveVisiblePicBedNames(['SM.MS', 'GitHub'])

    expect(updateVisiblePicBedsMock).toHaveBeenCalledWith(['SM.MS', 'GitHub'])
    expect(useStore.getState().appConfig?.picBed.list).toEqual(nextPicBedList)
  })

  it('updates shortcuts through main-process handlers and syncs local state', async () => {
    updateShortcutMock.mockResolvedValue(true)

    await settingsStoreActions.updateShortcutKeys('picgo:upload', [
      'CommandOrControl',
      'Shift',
      'P'
    ])

    expect(updateShortcutMock).toHaveBeenCalledWith({
      enable: true,
      key: 'CommandOrControl+Shift+P',
      label: 'Quick Upload',
      name: 'upload',
      from: 'picgo'
    }, 'CommandOrControl+Shift+U')
    expect(useStore.getState().appConfig?.settings.shortKey['picgo:upload']?.key).toBe(
      'CommandOrControl+Shift+P'
    )

    await settingsStoreActions.setShortcutEnabled('picgo:upload', false)

    expect(toggleShortcutEnabledMock).toHaveBeenCalledWith({
      enable: false,
      key: 'CommandOrControl+Shift+P',
      label: 'Quick Upload',
      name: 'upload',
      from: 'picgo'
    })
    expect(useStore.getState().appConfig?.settings.shortKey['picgo:upload']?.enable).toBe(false)
  })

  it('persists url rewrite rules and update checks via real adapters', async () => {
    const nextRules: SettingsUrlRewriteRule[] = [
      {
        match: 'foo',
        replace: 'bar',
        enable: false,
        global: true,
        ignoreCase: true
      }
    ]

    await settingsStoreActions.saveUrlRewriteRules(nextRules)

    expect(saveUrlRewriteRulesMock).toHaveBeenCalledWith([
      {
        match: 'foo',
        replace: 'bar',
        enable: false,
        global: true,
        ignoreCase: true
      }
    ])
    expect(useStore.getState().appConfig?.settings.urlRewrite.rules).toEqual(nextRules)

    checkLatestVersionMock.mockResolvedValue('9.9.9')

    const result = await settingsStoreActions.checkUpdates()

    expect(result).toEqual({
      currentVersion: '3.0.0',
      latestVersion: '9.9.9',
      hasUpdate: true
    })
    expect(useStore.getState().settingsVersion.latestVersion).toBe('9.9.9')
  })

  it('runs side effects after saving linked settings items', async () => {
    await settingsStoreActions.saveSettingsConfig('settings.autoStart', true)

    expect(setAutoStartMock).toHaveBeenCalledWith(true)
  })
})
