import type { IConfig } from 'picgo'
import type {
  AppConfig,
  ProviderUploaderSummary
} from '@/components/main/providers/types'
import type {
  SettingsConfigState,
  SettingsConfigSaveTarget,
  SettingsShortKeyConfig,
  SettingsShortKeyMap,
  SettingsUrlRewriteConfig,
  SettingsUrlRewriteRule
} from '@/components/main/settings/utils'
import {
  defaultSettingsConfig,
  settingsAppearance
} from '@/components/main/settings/utils'
import {
  GALLERY_MASONRY_COLUMN_COUNT_MAX,
  GALLERY_MASONRY_COLUMN_COUNT_MIN
} from '@/utils/consts'
import { GalleryViewMode, type GalleryViewMode as GalleryViewModeType } from '@/components/main/gallery/utils'
import { IPasteStyle, IStartupMode } from '~/universal/types/enum'

function isRecord (value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isPlainObject (value: unknown): value is Record<string, unknown> {
  return isRecord(value) && !Array.isArray(value)
}

function isStringArray (value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isSettingsAppearance (
  value: unknown
): value is SettingsConfigState['appearance'] {
  return (
    typeof value === 'string' &&
    Object.values(settingsAppearance).some((item) => item === value)
  )
}

function isSettingsStartupMode (
  value: unknown
): value is SettingsConfigState['startupMode'] {
  return (
    typeof value === 'string' &&
    Object.values(IStartupMode).some((item) => item === value)
  )
}

function isPasteStyle (
  value: unknown
): value is SettingsConfigState['pasteStyle'] {
  return (
    typeof value === 'string' &&
    Object.values(IPasteStyle).some((item) => item === value)
  )
}

function normalizeString (value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback
}

function normalizeBoolean (value: unknown, fallback: boolean) {
  if (value === undefined) {
    return fallback
  }

  return value === true
}

function normalizeNumber (value: unknown, fallback: number) {
  const numericValue =
    typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10)

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return fallback
  }

  return numericValue
}

function normalizeLogLevels (value: unknown) {
  if (typeof value === 'string' && value.length > 0) {
    return [value]
  }

  if (!isStringArray(value) || value.length === 0) {
    return defaultSettingsConfig.logLevel
  }

  return value
}

function cloneShortKeyMap (shortKeyMap: SettingsShortKeyMap) {
  return Object.entries(shortKeyMap).reduce<SettingsShortKeyMap>((acc, [id, item]) => {
    acc[id] = { ...item }
    return acc
  }, {})
}

function normalizeSettingsShortKeyItem (
  shortcut: unknown,
  fallbackName: string
): SettingsShortKeyConfig {
  const rawShortcut = isRecord(shortcut) ? shortcut : {}

  return {
    enable: normalizeBoolean(rawShortcut.enable, true),
    key: normalizeString(rawShortcut.key, ''),
    name: normalizeString(rawShortcut.name, fallbackName),
    label: normalizeString(rawShortcut.label, fallbackName)
  }
}

function normalizeSettingsShortKey (
  value: unknown
): SettingsShortKeyMap {
  if (!isRecord(value)) {
    return cloneShortKeyMap(defaultSettingsConfig.shortKey)
  }

  if (Object.keys(value).length === 0) {
    return cloneShortKeyMap(defaultSettingsConfig.shortKey)
  }

  return Object.entries(value).reduce<SettingsShortKeyMap>((acc, [id, item]) => {
    const [, ...nameSegments] = id.split(':')
    const fallbackName = nameSegments.join(':') || id

    acc[id] = normalizeSettingsShortKeyItem(item, fallbackName)
    return acc
  }, {})
}

function normalizeSettingsUrlRewriteRules (
  value: unknown
): SettingsUrlRewriteRule[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item) => {
    const rawRule = isRecord(item) ? item : {}

    return {
      match: normalizeString(rawRule.match, ''),
      replace: normalizeString(rawRule.replace, ''),
      enable: normalizeBoolean(rawRule.enable, true),
      global: normalizeBoolean(rawRule.global, false),
      ignoreCase: normalizeBoolean(rawRule.ignoreCase, false)
    }
  })
}

function normalizeSettingsUrlRewrite (
  value: unknown
): SettingsUrlRewriteConfig {
  const rawUrlRewrite = isRecord(value) ? value : {}

  return {
    rules: normalizeSettingsUrlRewriteRules(rawUrlRewrite.rules)
  }
}

export function normalizeGalleryMasonryColumnCount (count: number) {
  return Math.min(
    GALLERY_MASONRY_COLUMN_COUNT_MAX,
    Math.max(GALLERY_MASONRY_COLUMN_COUNT_MIN, count)
  )
}

export function normalizeGalleryViewMode (value: string | undefined): GalleryViewModeType {
  if (value === GalleryViewMode.List) {
    return GalleryViewMode.List
  }

  return GalleryViewMode.Masonry
}

export function resolveDefaultPicBed (config: IConfig | null) {
  if (!config) {
    return 'smms'
  }

  return config.picBed.uploader || config.picBed.current || 'smms'
}

export function normalizePicBedList (
  config: IConfig | null | undefined,
  picBeds: IPicBedType[]
) {
  const rawList = config?.picBed
    ? (config.picBed as Partial<AppConfig['picBed']>).list
    : undefined

  if (Array.isArray(rawList) && rawList.length > 0) {
    return rawList
  }

  return picBeds.map((item) => ({
    type: item.type,
    name: item.name,
    visible: item.visible
  }))
}

export function normalizeSettingsConfig (
  config: IConfig | null | undefined
): SettingsConfigState {
  const rawSettings = isRecord(config?.settings) ? config.settings : {}
  const rawServer = isRecord(rawSettings.server) ? rawSettings.server : {}

  return {
    appearance: isSettingsAppearance(rawSettings.appearance)
      ? rawSettings.appearance
      : defaultSettingsConfig.appearance,
    pasteStyle: isPasteStyle(rawSettings.pasteStyle)
      ? rawSettings.pasteStyle
      : defaultSettingsConfig.pasteStyle,
    showUpdateTip: normalizeBoolean(
      rawSettings.showUpdateTip,
      defaultSettingsConfig.showUpdateTip
    ),
    autoStart: normalizeBoolean(rawSettings.autoStart, defaultSettingsConfig.autoStart),
    rename: normalizeBoolean(rawSettings.rename, defaultSettingsConfig.rename),
    autoRename: normalizeBoolean(rawSettings.autoRename, defaultSettingsConfig.autoRename),
    uploadNotification: normalizeBoolean(
      rawSettings.uploadNotification,
      defaultSettingsConfig.uploadNotification
    ),
    notificationSound: normalizeBoolean(
      rawSettings.notificationSound,
      defaultSettingsConfig.notificationSound
    ),
    miniWindowOnTop: normalizeBoolean(
      rawSettings.miniWindowOnTop,
      defaultSettingsConfig.miniWindowOnTop
    ),
    logLevel: normalizeLogLevels(rawSettings.logLevel),
    autoCopyUrl: normalizeBoolean(
      rawSettings.autoCopyUrl,
      defaultSettingsConfig.autoCopyUrl
    ),
    checkBetaUpdate: normalizeBoolean(
      rawSettings.checkBetaUpdate,
      defaultSettingsConfig.checkBetaUpdate
    ),
    useBuiltinClipboard: normalizeBoolean(
      rawSettings.useBuiltinClipboard,
      defaultSettingsConfig.useBuiltinClipboard
    ),
    language: normalizeString(rawSettings.language, defaultSettingsConfig.language),
    logFileSizeLimit: normalizeNumber(
      rawSettings.logFileSizeLimit,
      defaultSettingsConfig.logFileSizeLimit
    ),
    encodeOutputURL: normalizeBoolean(
      rawSettings.encodeOutputURL,
      defaultSettingsConfig.encodeOutputURL
    ),
    showDockIcon: normalizeBoolean(
      rawSettings.showDockIcon,
      defaultSettingsConfig.showDockIcon
    ),
    showMenubarIcon: normalizeBoolean(
      rawSettings.showMenubarIcon,
      defaultSettingsConfig.showMenubarIcon
    ),
    customLink: normalizeString(
      rawSettings.customLink,
      defaultSettingsConfig.customLink
    ),
    npmProxy: normalizeString(rawSettings.npmProxy, defaultSettingsConfig.npmProxy),
    npmRegistry: normalizeString(
      rawSettings.npmRegistry,
      defaultSettingsConfig.npmRegistry
    ),
    server: {
      host: normalizeString(rawServer.host, defaultSettingsConfig.server.host),
      port: normalizeNumber(rawServer.port, defaultSettingsConfig.server.port),
      enable: normalizeBoolean(rawServer.enable, defaultSettingsConfig.server.enable)
    },
    startupMode: isSettingsStartupMode(rawSettings.startupMode)
      ? rawSettings.startupMode
      : defaultSettingsConfig.startupMode,
    shortKey: normalizeSettingsShortKey(rawSettings.shortKey),
    urlRewrite: normalizeSettingsUrlRewrite(rawSettings.urlRewrite)
  }
}

export function normalizeAppConfig (
  config: IConfig | null | undefined,
  picBeds: IPicBedType[]
): AppConfig | null {
  if (!config) {
    return null
  }

  return {
    picBed: {
      uploader: config.picBed.uploader || '',
      current: config.picBed.current || '',
      transformer: config.picBed.transformer || '',
      proxy: config.picBed.proxy || '',
      list: normalizePicBedList(config, picBeds)
    },
    uploader: config.uploader ?? {},
    settings: normalizeSettingsConfig(config),
    picgoPlugins: config.picgoPlugins ?? {},
    plugins: config.plugins ?? {},
    transformer: config.transformer ?? {},
    needReload: Boolean(config.needReload)
  }
}

export function buildProviderSummaries (
  picBeds: IPicBedType[],
  appConfig: AppConfig | null
): ProviderUploaderSummary[] {
  const defaultUploader = appConfig?.picBed.uploader || appConfig?.picBed.current || ''

  return picBeds.map((item) => ({
    id: item.type,
    name: item.name,
    visible: item.visible,
    isDefaultUploader: item.type === defaultUploader
  }))
}

function normalizeSettingsStatePath (path: string) {
  return path.startsWith('settings.')
    ? path.slice('settings.'.length)
    : path
}

function buildNestedSettingsPatch (
  path: string[],
  value: unknown
): Record<string, unknown> | unknown {
  const [current, ...rest] = path

  if (!current) {
    return value
  }

  if (rest.length === 0) {
    return {
      [current]: value
    }
  }

  return {
    [current]: buildNestedSettingsPatch(rest, value)
  }
}

export function applySettingsPatch (
  path: SettingsConfigSaveTarget,
  value?: unknown
): Partial<SettingsConfigState> {
  if (typeof path === 'string') {
    const normalizedPath = normalizeSettingsStatePath(path)

    return buildNestedSettingsPatch(
      normalizedPath.split('.').filter(Boolean),
      value
    ) as Partial<SettingsConfigState>
  }

  return path
}

export function buildPersistedSettingsPatch (
  patch: Partial<SettingsConfigState>,
  prefix = 'settings'
): Record<string, unknown> {
  return Object.entries(patch).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (value === undefined) {
      return acc
    }

    const nextPath = `${prefix}.${key}`

    if (isPlainObject(value)) {
      return {
        ...acc,
        ...buildPersistedSettingsPatch(value as Partial<SettingsConfigState>, nextPath)
      }
    }

    acc[nextPath] = value
    return acc
  }, {})
}

function mergeDeep<T extends Record<string, unknown>> (
  current: T,
  patch: Partial<T>
): T {
  return Object.entries(patch).reduce<T>((acc, [key, value]) => {
    if (value === undefined) {
      return acc
    }

    const currentValue = acc[key]

    if (isPlainObject(currentValue) && isPlainObject(value)) {
      return {
        ...acc,
        [key]: mergeDeep(
          currentValue as Record<string, unknown>,
          value as Record<string, unknown>
        )
      }
    }

    return {
      ...acc,
      [key]: value
    }
  }, { ...current })
}

export function mergeSettingsConfigPatch (
  current: SettingsConfigState,
  patch: Partial<SettingsConfigState>
) {
  return mergeDeep(
    current as unknown as Record<string, unknown>,
    patch as unknown as Record<string, unknown>
  ) as unknown as SettingsConfigState
}
