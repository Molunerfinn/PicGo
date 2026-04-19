import type {
  UploaderSwitcherProviderItem,
  UploaderSwitcherValue,
} from "./uploader-switcher"
import type {
  AppConfig,
  ProviderUploaderSummary,
} from "../providers/types"

function buildProviderConfigs(
  appConfig: AppConfig,
  providerId: string
): UploaderSwitcherProviderItem["configs"] {
  return (appConfig.uploader[providerId]?.configList ?? []).map((config) => ({
    id: config._id,
    name: config._configName,
  }))
}

export function buildVisibleProviderOptions(
  providers: ProviderUploaderSummary[],
  appConfig: AppConfig | null
): UploaderSwitcherProviderItem[] {
  if (appConfig) {
    const providerSummaryMap = new Map(
      providers.map((provider) => [provider.id, provider] as const)
    )

    return appConfig.picBed.list
      .filter((provider) => provider.visible !== false)
      .map((provider) => {
        const summary = providerSummaryMap.get(provider.type)

        return {
          id: provider.type,
          name: summary?.name ?? provider.name,
          configs: buildProviderConfigs(appConfig, provider.type),
        }
      })
  }

  return providers
    .filter((provider) => provider.visible !== false)
    .map((provider) => ({
      id: provider.id,
      name: provider.name,
      configs: [],
    }))
}

export function resolveCurrentSwitcherValue(
  providerOptions: UploaderSwitcherProviderItem[],
  appConfig: AppConfig | null
): UploaderSwitcherValue | null {
  if (providerOptions.length === 0) {
    return null
  }

  const defaultProviderId = appConfig?.picBed.uploader
  const preferredProvider = providerOptions.find(
    (provider) => provider.id === defaultProviderId
  )
  const activeProvider = preferredProvider ?? providerOptions[0]

  if (!activeProvider) {
    return null
  }

  const activeConfigState = appConfig?.uploader[activeProvider.id]
  const defaultConfigId = activeConfigState?.defaultId
  const preferredConfig = activeProvider.configs.find(
    (config) => config.id === defaultConfigId
  )
  const activeConfig = preferredConfig ?? activeProvider.configs[0]

  if (!activeConfig) {
    return null
  }

  return {
    providerId: activeProvider.id,
    providerName: activeProvider.name,
    configId: activeConfig.id,
    configName: activeConfig.name,
  }
}
