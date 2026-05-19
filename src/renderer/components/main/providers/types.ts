import type { ValueOf } from "@/types/utils"
import type { SettingsConfigState } from "@/components/main/settings/utils"

export const providerFieldType = {
  Input: "input",
  Password: "password",
  List: "list",
  Checkbox: "checkbox",
  Confirm: "confirm",
  Editor: "editor",
} as const

export type ProviderFieldType =
  ValueOf<typeof providerFieldType>

export interface ProviderPluginChoiceObject {
  name?: string
  value: unknown
  checked?: boolean
}

export type ProviderPluginChoice = string | ProviderPluginChoiceObject

export interface ProviderPluginConfig {
  name: string
  type: ProviderFieldType
  required: boolean
  default?: unknown
  alias?: string
  message?: string
  prefix?: string
  tips?: string
  confirmText?: string
  cancelText?: string
  choices?: ProviderPluginChoice[]
  /**
   * Names of other fields whose value changes should re-evaluate this
   * field's `choices` / `default`. Populated by PicGo-Core plugins;
   * consumed by the GUI refresh hook.
   */
  dependsOn?: string[]
}

export interface ProviderUploaderConfigItem {
  _id: string
  _configName: string
  _createdAt: number
  _updatedAt: number
  [key: string]: unknown
}

export interface ProviderDraftConfigItem extends ProviderUploaderConfigItem {
  _isDraft: true
}

export interface ProviderUploaderConfigList {
  defaultId: string
  configList: ProviderUploaderConfigItem[]
}

export interface ProviderPicBedItem {
  type: string
  name: string
  visible: boolean
}

export interface AppConfig {
  picBed: {
    uploader: string
    current: string
    transformer: string
    proxy?: string
    list: ProviderPicBedItem[]
  }
  uploader: Record<string, ProviderUploaderConfigList>
  settings: SettingsConfigState
  picgoPlugins: Record<string, boolean>
  plugins: Record<string, Record<string, unknown>>
  transformer: Record<string, Record<string, unknown>>
  needReload: boolean
}

/**
 * @deprecated Prefer AppConfig.
 */
export type ProviderAppConfig = AppConfig

export interface ProviderUploaderSummary {
  id: string
  name: string
  visible: boolean
  isDefaultUploader: boolean
}

export interface ProviderUploaderSchema {
  id: string
  name: string
  config: ProviderPluginConfig[]
}

export interface ProviderAppStateSnapshot {
  appConfig: AppConfig
  providers: ProviderUploaderSummary[]
  providerSchemas: Record<string, ProviderUploaderSchema>
}

export interface ProviderConnectionTestResult {
  success: boolean
  missingRequiredFields: string[]
}

export const providerConnectionStatus = {
  Idle: "idle",
  Testing: "testing",
  Success: "success",
  Error: "error",
} as const

export type ProviderConnectionStatus =
  ValueOf<typeof providerConnectionStatus>
