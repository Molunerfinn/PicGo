import type { ValueOf } from "@/types/utils"
import type {
  ProviderPluginConfig,
  ProviderUploaderConfigList,
} from "@/components/main/providers/types"

export const pluginConfigSectionType = {
  Config: "config",
  Transformer: "transformer",
} as const

export type PluginConfigSectionType = ValueOf<typeof pluginConfigSectionType>

export interface PluginConfigSection {
  name: string
  fullName?: string
  config: ProviderPluginConfig[]
}

export interface PluginGuiMenuItem {
  label: string
}

export interface PluginUploaderBridgeConfig {
  id: string
  name: string
  schema: ProviderPluginConfig[]
  configState: ProviderUploaderConfigList
}

export interface PluginInstalledItem {
  name: string
  fullName: string
  author: string
  description: string
  logo: string
  version: string
  gui: boolean
  homepage: string
  enabled: boolean
  hasInstall: true
  guiMenu: PluginGuiMenuItem[]
  config: {
    plugin: PluginConfigSection
    transformer: PluginConfigSection
  }
  uploader?: PluginUploaderBridgeConfig
}

export interface PluginSearchResultItem {
  name: string
  fullName: string
  author: string
  description: string
  logo: string
  version: string
  homepage: string
  gui: boolean
  hasInstall: boolean
}

export interface PluginDetailSelectedItem {
  name: string
  fullName: string
  description: string
  author: string
  version: string
  logo: string
  homepage: string
  hasInstall: boolean
}

export const pluginDetailTab = {
  Readme: "readme",
  Config: "config",
  Transformer: "transformer",
} as const

export type PluginDetailTab = ValueOf<typeof pluginDetailTab>

export const pluginReadmeStatus = {
  Idle: "idle",
  Loading: "loading",
  Ready: "ready",
  Empty: "empty",
  Error: "error",
} as const

export type PluginReadmeStatus = ValueOf<typeof pluginReadmeStatus>

export interface PluginReadmeState {
  status: PluginReadmeStatus
  content: string
  errorMessage: string | null
}

export const pluginDeprecationStatus = {
  Idle: "idle",
  Loading: "loading",
  Ready: "ready",
  Error: "error",
} as const

export type PluginDeprecationStatus = ValueOf<typeof pluginDeprecationStatus>

export interface PluginDeprecationState {
  status: PluginDeprecationStatus
  isDeprecated: boolean
  message: string
}

export const pluginGearActionKind = {
  Enable: "enable",
  Disable: "disable",
  Update: "update",
  Uninstall: "uninstall",
  JumpConfig: "jump-config",
  JumpTransformer: "jump-transformer",
  ToggleTransformer: "toggle-transformer",
  GuiMenu: "gui-menu",
} as const

export type PluginGearActionKind = ValueOf<typeof pluginGearActionKind>

export interface PluginGearAction {
  id: string
  label: string
  kind: PluginGearActionKind
  disabled?: boolean
  guiMenuLabel?: string
}

export interface PluginSnapshot {
  installedPlugins: PluginInstalledItem[]
  picgoPlugins: Record<string, boolean>
  pluginConfigs: Record<string, Record<string, unknown>>
  transformerConfigs: Record<string, Record<string, unknown>>
  currentTransformer: string
  needReload: boolean
}

export interface PluginImportResult {
  path: string
  installedPlugin: PluginInstalledItem
}
