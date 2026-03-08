import type {
  ProviderDraftConfigItem,
  ProviderPluginChoice,
  ProviderPluginChoiceObject,
  ProviderPluginConfig,
  ProviderUploaderSummary,
  ProviderUploaderConfigList,
  ProviderUploaderConfigItem,
  ProviderUploaderSchema,
} from "./types"

export type ProviderFormValues = Record<string, unknown>
export type ProviderConfigMap = Record<string, ProviderUploaderConfigList>

export interface ProviderSelectionQuery {
  uploader: string | undefined
  configId: string | undefined
}

export interface ProviderSelectionState {
  defaultUploaderId: string | null
  selectedUploaderId: string | null
  selectedConfigId: string | null
}

interface ResolveProviderSelectionStateParams {
  queriedUploaderId: string | null
  queriedConfigId: string | null
  appConfigUploaderId: string | undefined
  visibleProviders: ProviderUploaderSummary[]
  configMap: ProviderConfigMap
  draftConfigMap?: Record<string, ProviderDraftConfigItem | undefined>
}

export const emptyProviderSchema: ProviderUploaderSchema["config"] = []
export const emptyProviderConfigMap: ProviderConfigMap = {}

const formatterByLocale = new Map<string, Intl.DateTimeFormat>()

function getDateTimeFormatter(locale: string | undefined) {
  const cacheKey = locale ?? "default"
  const cachedFormatter = formatterByLocale.get(cacheKey)

  if (cachedFormatter) {
    return cachedFormatter
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })

  formatterByLocale.set(cacheKey, formatter)
  return formatter
}

function isChoiceObject(
  choice: ProviderPluginChoice
): choice is ProviderPluginChoiceObject {
  return typeof choice !== "string"
}

export function normalizePluginChoices(choices: ProviderPluginChoice[] | undefined) {
  return (choices ?? []).map((choice) => {
    if (isChoiceObject(choice)) {
      return {
        label: choice.name ?? choice.value,
        value: choice.value,
        checked: Boolean(choice.checked),
      }
    }

    return {
      label: choice,
      value: choice,
      checked: false,
    }
  })
}

export function resolveFieldDefault(field: ProviderPluginConfig): unknown {
  if (field.default !== undefined) {
    return field.default
  }

  if (field.type === "checkbox") {
    return normalizePluginChoices(field.choices)
      .filter((choice) => choice.checked)
      .map((choice) => choice.value)
  }

  if (field.type === "confirm") {
    return false
  }

  if (field.type === "list") {
    return normalizePluginChoices(field.choices)[0]?.value ?? ""
  }

  return ""
}

export function buildFormValues(
  schema: ProviderPluginConfig[],
  config?: ProviderUploaderConfigItem | null
): ProviderFormValues {
  const model: ProviderFormValues = {}

  schema.forEach((field) => {
    const defaultValue = resolveFieldDefault(field)
    const configValue = config?.[field.name]
    model[field.name] = configValue !== undefined ? configValue : defaultValue
  })

  return model
}

export function buildConfigPatch(
  schema: ProviderPluginConfig[],
  formValues: ProviderFormValues
): Record<string, unknown> {
  const patch: Record<string, unknown> = {}

  schema.forEach((field) => {
    patch[field.name] = formValues[field.name]
  })

  return patch
}

export function formatConfigUpdatedAt(
  timestamp: number | undefined,
  locale?: string
) {
  if (!timestamp) return "--"
  return getDateTimeFormatter(locale).format(new Date(timestamp))
}

export function isRequiredFieldValueMissing(value: unknown) {
  if (Array.isArray(value)) {
    return value.length === 0
  }

  if (typeof value === "boolean") {
    return false
  }

  return String(value ?? "").trim().length === 0
}

export function validateRequiredFields(
  schema: ProviderPluginConfig[],
  values: ProviderFormValues
) {
  return schema
    .filter((field) => field.required)
    .filter((field) => isRequiredFieldValueMissing(values[field.name]))
    .map((field) => field.name)
}

export function isProviderSelectionEqual(
  currentQuery: ProviderSelectionQuery,
  itemQuery: ProviderSelectionQuery
) {
  return (
    currentQuery.uploader === itemQuery.uploader &&
    currentQuery.configId === itemQuery.configId
  )
}

export function resolveErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}

export function createDraftConfigId(uploaderId: string) {
  return `draft-${uploaderId}-${Date.now()}`
}

export function resolveDefaultUploaderId(
  appConfigUploaderId: string | undefined,
  visibleProviders: ProviderUploaderSummary[]
) {
  const selectedByAppConfig =
    appConfigUploaderId &&
    visibleProviders.some((provider) => provider.id === appConfigUploaderId)
      ? appConfigUploaderId
      : null

  if (selectedByAppConfig) {
    return selectedByAppConfig
  }

  return (
    visibleProviders.find((provider) => provider.isDefaultUploader)?.id ??
    visibleProviders[0]?.id ??
    null
  )
}

export function resolveSelectableConfigId(
  configState: ProviderUploaderConfigList | undefined,
  draftConfig: ProviderDraftConfigItem | undefined,
  preferredConfigId: string | null | undefined
) {
  const draftConfigId = draftConfig?._id ?? null

  if (preferredConfigId) {
    if (preferredConfigId === draftConfigId) {
      return preferredConfigId
    }

    const existsPersisted =
      configState?.configList.some((item) => item._id === preferredConfigId) ?? false

    if (existsPersisted) {
      return preferredConfigId
    }
  }

  if (draftConfigId) {
    return draftConfigId
  }

  if (!configState) {
    return null
  }

  return configState.defaultId || configState.configList[0]?._id || null
}

export function resolveProviderSelectionState({
  queriedUploaderId,
  queriedConfigId,
  appConfigUploaderId,
  visibleProviders,
  configMap,
  draftConfigMap,
}: ResolveProviderSelectionStateParams): ProviderSelectionState {
  const defaultUploaderId = resolveDefaultUploaderId(
    appConfigUploaderId,
    visibleProviders
  )

  const selectedUploaderId =
    queriedUploaderId &&
    visibleProviders.some((provider) => provider.id === queriedUploaderId)
      ? queriedUploaderId
      : defaultUploaderId

  const selectedConfigId = resolveSelectableConfigId(
    selectedUploaderId ? configMap[selectedUploaderId] : undefined,
    selectedUploaderId ? draftConfigMap?.[selectedUploaderId] : undefined,
    queriedConfigId
  )

  return {
    defaultUploaderId,
    selectedUploaderId,
    selectedConfigId,
  }
}
