import { create } from 'zustand'
import type { IConfig } from 'picgo'
import type { IPicGoCloudUserInfo } from '#/types/cloud'
import i18n from '@/i18n'
import { appConfigAdapter } from '@/adapters/app-config'
import { providersAdapter } from '@/adapters/providers'
import type {
  PluginConfigSectionType,
  PluginImportResult,
  PluginInstalledItem,
  PluginReadmeState,
  PluginSearchResultItem
} from '@/components/main/plugins/types'
import { pluginReadmeStatus } from '@/components/main/plugins/types'
import type {
  SettingsConfigState,
  SettingsUrlRewriteRule,
  SettingsVersionState
} from '@/components/main/settings/utils'
import {
  defaultSettingsConfig,
  defaultSettingsVersion
} from '@/components/main/settings/utils'
import type {
  AppConfig,
  ProviderUploaderSchema,
  ProviderUploaderSummary
} from '@/components/main/providers/types'
import type { ProviderFormValues } from '@/components/main/providers/utils'

interface ProviderPageState {
  isHydrating: boolean
  isLoadingByProvider: Record<string, boolean>
  expandedProviderIds: string[]
  searchValue: string
}

interface PluginPageState {
  searchValue: string
  searchResults: PluginSearchResultItem[]
  isSearching: boolean
  isImportingLocal: boolean
  isMutatingByPlugin: Record<string, boolean>
  readmeByPlugin: Record<string, PluginReadmeState>
}

interface SettingsPageState {
  searchValue: string
}

interface CheckUpdateResult {
  currentVersion: string
  latestVersion: string
  hasUpdate: boolean
}

export const picGoCloudRequestStatus = {
  Idle: 'IDLE',
  Loading: 'LOADING',
  Error: 'ERROR'
} as const

export const picGoCloudLoginStatus = {
  Idle: 'IDLE',
  InProgress: 'IN_PROGRESS'
} as const

export type PicGoCloudRequestStatus =
  typeof picGoCloudRequestStatus[keyof typeof picGoCloudRequestStatus]

export type PicGoCloudLoginStatus =
  typeof picGoCloudLoginStatus[keyof typeof picGoCloudLoginStatus]

export interface PicGoCloudUserInfoState {
  userInfo: IPicGoCloudUserInfo | null | undefined
  userInfoStatus: PicGoCloudRequestStatus
  userInfoError: string | null
  loginStatus: PicGoCloudLoginStatus
  loginError: string | null
  hasAgreedToTermsAndPrivacy: boolean
}

export interface AppStoreState {
  defaultPicBed: string
  appConfig: AppConfig | null
  picBeds: IPicBedType[]
  providers: ProviderUploaderSummary[]
  providerSchemas: Record<string, ProviderUploaderSchema>
  pluginsInstalled: PluginInstalledItem[]
  providerPage: ProviderPageState
  pluginPage: PluginPageState
  settingsVersion: SettingsVersionState
  settingsPage: SettingsPageState
  hasHydrated: boolean
  hasSettingsHydrated: boolean
  picgoCloud: PicGoCloudUserInfoState
  refreshAppConfig: () => Promise<void>
  refreshPicBeds: () => Promise<void>
  hydrateAppState: () => Promise<void>
  ensureHydrated: () => Promise<void>
  ensureSettingsHydrated: () => Promise<void>
  refreshProviderState: () => Promise<void>
  setDefaultPicBed: (type: string) => Promise<void>
  setSettingsSearchValue: (value: string) => void
  saveSettingsConfig: (
    path: string | Partial<SettingsConfigState>,
    value?: unknown
  ) => Promise<void>
  updateShortcutKeys: (shortcutId: string, keys: string[]) => Promise<void>
  setShortcutEnabled: (shortcutId: string, enable: boolean) => Promise<void>
  saveUrlRewriteRules: (rules: SettingsUrlRewriteRule[]) => Promise<void>
  checkSettingsUpdates: () => Promise<CheckUpdateResult>
  setProviderSearchValue: (value: string) => void
  ensureProviderExpanded: (providerId: string) => void
  toggleProviderExpanded: (providerId: string) => void
  setDefaultProvider: (providerId: string) => Promise<void>
  setDefaultConfig: (providerId: string, configId: string) => Promise<string | null>
  selectDashboardProviderConfig: (providerId: string, configId: string) => Promise<void>
  createConfig: (providerId: string, configName: string) => Promise<string | null>
  renameConfig: (providerId: string, configId: string, configName: string) => Promise<string | null>
  copyConfig: (providerId: string, configId: string, configName: string) => Promise<string | null>
  deleteConfig: (providerId: string, configId: string) => Promise<string | null>
  saveConfig: (providerId: string, configId: string, formValues: ProviderFormValues) => Promise<string | null>
  setPluginSearchValue: (value: string) => void
  searchPlugins: (query: string) => Promise<void>
  installPlugin: (fullName: string) => Promise<void>
  setPluginEnabled: (fullName: string, enabled: boolean) => Promise<void>
  updatePlugin: (fullName: string) => Promise<void>
  uninstallPlugin: (fullName: string) => Promise<void>
  savePluginConfig: (fullName: string, section: PluginConfigSectionType, values: Record<string, unknown>) => Promise<void>
  togglePluginTransformer: (fullName: string) => Promise<string>
  runPluginGuiMenuAction: (fullName: string, label: string) => Promise<{ fullName: string, label: string, message: string }>
  fetchPluginReadme: (fullName: string) => Promise<void>
  importLocalPlugin: (folderPath: string) => Promise<PluginImportResult>
  setPicGoCloudUserInfo: (userInfo: IPicGoCloudUserInfo | null | undefined) => void
  setPicGoCloudUserInfoStatus: (status: PicGoCloudRequestStatus) => void
  setPicGoCloudUserInfoError: (error: string | null) => void
  setPicGoCloudLoginStatus: (status: PicGoCloudLoginStatus) => void
  setPicGoCloudLoginError: (error: string | null) => void
  setPicGoCloudHasAgreedToTermsAndPrivacy: (hasAgreed: boolean) => void
}

const initialProviderPageState: ProviderPageState = {
  isHydrating: false,
  isLoadingByProvider: {},
  expandedProviderIds: [],
  searchValue: ''
}

const initialPluginPageState: PluginPageState = {
  searchValue: '',
  searchResults: [],
  isSearching: false,
  isImportingLocal: false,
  isMutatingByPlugin: {},
  readmeByPlugin: {}
}

const initialSettingsPageState: SettingsPageState = {
  searchValue: ''
}

function resolveDefaultPicBed (config: IConfig | null) {
  if (!config) {
    return 'smms'
  }

  return config.picBed.uploader || config.picBed.current || 'smms'
}

function pickVisibleProviderNames (picBeds: IPicBedType[]) {
  return picBeds
    .filter((provider) => provider.visible)
    .map((provider) => provider.name)
}

function normalizeSettingsConfig (config: IConfig | null | undefined, picBeds: IPicBedType[]): SettingsConfigState {
  const rawSettings = config?.settings as Partial<SettingsConfigState> | undefined
  const rawServer = rawSettings?.server ?? {}

  return {
    ...defaultSettingsConfig,
    ...rawSettings,
    server: {
      ...defaultSettingsConfig.server,
      ...rawServer
    },
    showPicBedList: Array.isArray(rawSettings?.showPicBedList) && rawSettings.showPicBedList.length > 0
      ? rawSettings.showPicBedList
      : pickVisibleProviderNames(picBeds),
    shortcuts: Array.isArray(rawSettings?.shortcuts)
      ? rawSettings.shortcuts
      : defaultSettingsConfig.shortcuts,
    urlRewriteRules: Array.isArray(rawSettings?.urlRewriteRules)
      ? rawSettings.urlRewriteRules
      : defaultSettingsConfig.urlRewriteRules
  }
}

function normalizePicBedList (config: IConfig | null | undefined, picBeds: IPicBedType[]) {
  const rawList = config?.picBed ? (config.picBed as Partial<AppConfig['picBed']>).list : undefined
  if (Array.isArray(rawList) && rawList.length > 0) {
    return rawList
  }

  return picBeds.map((item) => ({
    type: item.type,
    name: item.name,
    visible: item.visible
  }))
}

function normalizeAppConfig (config: IConfig | null | undefined, picBeds: IPicBedType[]): AppConfig | null {
  if (!config) {
    return null
  }

  return {
    picBed: {
      uploader: config.picBed.uploader || '',
      current: config.picBed.current || '',
      transformer: config.picBed.transformer || '',
      list: normalizePicBedList(config, picBeds)
    },
    uploader: config.uploader ?? {},
    settings: normalizeSettingsConfig(config, picBeds),
    picgoPlugins: config.picgoPlugins ?? {},
    plugins: config.plugins ?? {},
    transformer: config.transformer ?? {},
    needReload: Boolean(config.needReload)
  }
}

function buildProviderSummaries (picBeds: IPicBedType[], appConfig: AppConfig | null): ProviderUploaderSummary[] {
  const defaultUploader = appConfig?.picBed.uploader || appConfig?.picBed.current || ''

  return picBeds.map((item) => ({
    id: item.type,
    name: item.name,
    visible: item.visible,
    isDefaultUploader: item.type === defaultUploader
  }))
}

function applySettingsPatch (
  path: string | Partial<SettingsConfigState>,
  value?: unknown
): Partial<SettingsConfigState> {
  if (typeof path === 'string') {
    return {
      [path]: value
    } as Partial<SettingsConfigState>
  }

  return path
}

function buildPersistedSettingsPatch (patch: Partial<SettingsConfigState>) {
  return Object.entries(patch).reduce<Record<string, unknown>>((acc, [key, value]) => {
    acc[`settings.${key}`] = value
    return acc
  }, {})
}

function updateSettingsState (
  set: (
    partial:
      | Partial<AppStoreState>
      | ((state: AppStoreState) => Partial<AppStoreState>)
  ) => void,
  patch: Partial<SettingsConfigState>
) {
  set((state) => ({
    appConfig: state.appConfig
      ? {
        ...state.appConfig,
        settings: {
          ...state.appConfig.settings,
          ...patch
        }
      }
      : state.appConfig
  }))
}

const useStoreBase = create<AppStoreState>((set, get) => ({
  defaultPicBed: 'smms',
  appConfig: null,
  picBeds: [],
  providers: [],
  providerSchemas: {},
  pluginsInstalled: [],
  providerPage: initialProviderPageState,
  pluginPage: initialPluginPageState,
  settingsVersion: defaultSettingsVersion,
  settingsPage: initialSettingsPageState,
  hasHydrated: false,
  hasSettingsHydrated: false,
  picgoCloud: {
    userInfo: undefined,
    userInfoStatus: picGoCloudRequestStatus.Idle,
    userInfoError: null,
    loginStatus: picGoCloudLoginStatus.Idle,
    loginError: null,
    hasAgreedToTermsAndPrivacy: false
  },
  async refreshAppConfig () {
    const config = await appConfigAdapter.getAppConfig()
    const picBeds = get().picBeds
    const normalizedConfig = normalizeAppConfig(config ?? null, picBeds)

    set({
      appConfig: normalizedConfig,
      defaultPicBed: resolveDefaultPicBed(config ?? null),
      providers: buildProviderSummaries(picBeds, normalizedConfig)
    })
  },
  async refreshPicBeds () {
    const picBeds = await appConfigAdapter.getPicBeds()
    const appConfig = normalizeAppConfig(get().appConfig, picBeds)

    set({
      picBeds,
      appConfig,
      providers: buildProviderSummaries(picBeds, appConfig)
    })
  },
  async hydrateAppState () {
    const [config, picBeds] = await Promise.all([
      appConfigAdapter.getAppConfig(),
      appConfigAdapter.getPicBeds()
    ])
    const normalizedConfig = normalizeAppConfig(config ?? null, picBeds)

    set({
      appConfig: normalizedConfig,
      defaultPicBed: resolveDefaultPicBed(config ?? null),
      picBeds,
      providers: buildProviderSummaries(picBeds, normalizedConfig),
      hasHydrated: true
    })
  },
  async ensureHydrated () {
    if (get().hasHydrated) {
      return
    }

    await get().hydrateAppState()
  },
  async ensureSettingsHydrated () {
    if (get().hasSettingsHydrated) {
      return
    }

    await get().ensureHydrated()
    set({ hasSettingsHydrated: true })
  },
  async refreshProviderState () {
    await get().hydrateAppState()
  },
  async setDefaultPicBed (type: string) {
    await appConfigAdapter.saveConfig({
      'picBed.current': type,
      'picBed.uploader': type
    })
    await get().hydrateAppState()
  },
  setSettingsSearchValue (value) {
    set((state) => ({
      settingsPage: {
        ...state.settingsPage,
        searchValue: value
      }
    }))
  },
  async saveSettingsConfig (path, value) {
    await get().ensureSettingsHydrated()
    const patch = applySettingsPatch(path, value)
    await appConfigAdapter.saveConfig(buildPersistedSettingsPatch(patch))
    updateSettingsState(set, patch)
  },
  async updateShortcutKeys (shortcutId, keys) {
    await get().ensureSettingsHydrated()
    const currentShortcuts = get().appConfig?.settings.shortcuts ?? defaultSettingsConfig.shortcuts
    const nextShortcuts = currentShortcuts.map((shortcut) => {
      if (shortcut.id !== shortcutId) {
        return shortcut
      }

      return {
        ...shortcut,
        key: keys.join('+')
      }
    })
    updateSettingsState(set, { shortcuts: nextShortcuts })
  },
  async setShortcutEnabled (shortcutId, enable) {
    await get().ensureSettingsHydrated()
    const currentShortcuts = get().appConfig?.settings.shortcuts ?? defaultSettingsConfig.shortcuts
    const nextShortcuts = currentShortcuts.map((shortcut) => {
      if (shortcut.id !== shortcutId) {
        return shortcut
      }

      return {
        ...shortcut,
        enable
      }
    })
    updateSettingsState(set, { shortcuts: nextShortcuts })
  },
  async saveUrlRewriteRules (rules) {
    await get().ensureSettingsHydrated()
    updateSettingsState(set, { urlRewriteRules: rules })
  },
  async checkSettingsUpdates () {
    return {
      currentVersion: get().settingsVersion.currentVersion,
      latestVersion: get().settingsVersion.latestVersion ?? get().settingsVersion.currentVersion,
      hasUpdate: false
    }
  },
  setProviderSearchValue (value) {
    set((state) => ({
      providerPage: {
        ...state.providerPage,
        searchValue: value
      }
    }))
  },
  ensureProviderExpanded (providerId) {
    set((state) => {
      if (state.providerPage.expandedProviderIds.includes(providerId)) {
        return {}
      }

      return {
        providerPage: {
          ...state.providerPage,
          expandedProviderIds: [...state.providerPage.expandedProviderIds, providerId]
        }
      }
    })
  },
  toggleProviderExpanded (providerId) {
    set((state) => {
      const isExpanded = state.providerPage.expandedProviderIds.includes(providerId)

      return {
        providerPage: {
          ...state.providerPage,
          expandedProviderIds: isExpanded
            ? state.providerPage.expandedProviderIds.filter((item) => item !== providerId)
            : [...state.providerPage.expandedProviderIds, providerId]
        }
      }
    })
  },
  async setDefaultProvider (providerId) {
    await get().setDefaultPicBed(providerId)
  },
  async setDefaultConfig (providerId, configId) {
    await get().selectDashboardProviderConfig(providerId, configId)
    return configId
  },
  async selectDashboardProviderConfig (providerId, configId) {
    const appConfig = get().appConfig
    const configName = appConfig?.uploader?.[providerId]?.configList.find((item) => item._id === configId)?._configName
    console.log('Selected configId:', configId, 'resolved configName:', configName)

    if (!configName) {
      throw new Error(i18n.t('TIPS_UPLOADER_CONFIG_NOT_FOUND'))
    }

    await providersAdapter.changeCurrentUploader(providerId, configName)
    await get().hydrateAppState()
  },
  async createConfig () {
    return null
  },
  async renameConfig () {
    return null
  },
  async copyConfig () {
    return null
  },
  async deleteConfig () {
    return null
  },
  async saveConfig () {
    return null
  },
  setPluginSearchValue (value) {
    set((state) => ({
      pluginPage: {
        ...state.pluginPage,
        searchValue: value
      }
    }))
  },
  async searchPlugins () {
    set((state) => ({
      pluginPage: {
        ...state.pluginPage,
        searchResults: [],
        isSearching: false
      }
    }))
  },
  async installPlugin () {},
  async setPluginEnabled () {},
  async updatePlugin () {},
  async uninstallPlugin () {},
  async savePluginConfig () {},
  async togglePluginTransformer () {
    return ''
  },
  async runPluginGuiMenuAction (fullName, label) {
    return {
      fullName,
      label,
      message: ''
    }
  },
  async fetchPluginReadme (fullName) {
    set((state) => ({
      pluginPage: {
        ...state.pluginPage,
        readmeByPlugin: {
          ...state.pluginPage.readmeByPlugin,
          [fullName]: {
            status: pluginReadmeStatus.Empty,
            content: '',
            errorMessage: null
          }
        }
      }
    }))
  },
  async importLocalPlugin (folderPath) {
    return {
      path: folderPath,
      installedPlugin: {
        name: '',
        fullName: '',
        author: '',
        description: '',
        logo: '',
        version: '',
        gui: false,
        homepage: '',
        enabled: false,
        hasInstall: true,
        guiMenu: [],
        config: {
          plugin: {
            name: '',
            fullName: '',
            config: []
          },
          transformer: {
            name: '',
            fullName: '',
            config: []
          }
        }
      }
    }
  },
  setPicGoCloudUserInfo (userInfo) {
    set((state) => ({
      picgoCloud: {
        ...state.picgoCloud,
        userInfo
      }
    }))
  },
  setPicGoCloudUserInfoStatus (userInfoStatus) {
    set((state) => ({
      picgoCloud: {
        ...state.picgoCloud,
        userInfoStatus
      }
    }))
  },
  setPicGoCloudUserInfoError (userInfoError) {
    set((state) => ({
      picgoCloud: {
        ...state.picgoCloud,
        userInfoError
      }
    }))
  },
  setPicGoCloudLoginStatus (loginStatus) {
    set((state) => ({
      picgoCloud: {
        ...state.picgoCloud,
        loginStatus
      }
    }))
  },
  setPicGoCloudLoginError (loginError) {
    set((state) => ({
      picgoCloud: {
        ...state.picgoCloud,
        loginError
      }
    }))
  },
  setPicGoCloudHasAgreedToTermsAndPrivacy (hasAgreedToTermsAndPrivacy) {
    set((state) => ({
      picgoCloud: {
        ...state.picgoCloud,
        hasAgreedToTermsAndPrivacy
      }
    }))
  }
}))

export const useStore = useStoreBase
export const useAppStore = useStoreBase
