import i18n from '@/i18n'
import {
  providersAdapter,
  type ProviderSchemaResult
} from '@/adapters/providers'
import type {
  ProviderPluginConfig,
  ProviderUploaderConfigItem,
  ProviderUploaderSchema
} from '@/components/main/providers/types'
import { appActions } from '@/store/app-actions'
import { useAppStore } from '@/store/app-store'
import { useProviderStore } from './store'
import type { ProviderFormValues } from '@/components/main/providers/utils'

function resolveProviderFieldType (
  value: string | undefined
): ProviderPluginConfig['type'] {
  if (
    value === 'password' ||
    value === 'list' ||
    value === 'checkbox' ||
    value === 'confirm'
  ) {
    return value
  }

  return 'input'
}

function normalizeProviderSchema (
  providerId: string,
  schemaResult: ProviderSchemaResult
): ProviderUploaderSchema {
  return {
    id: providerId,
    name: schemaResult.name,
    config: schemaResult.config.map((field) => ({
      name: field.name,
      type: resolveProviderFieldType(field.type),
      required: field.required === true,
      default: field.default,
      alias: typeof field.alias === 'string' ? field.alias : undefined,
      message: typeof field.message === 'string' ? field.message : undefined,
      prefix: typeof field.prefix === 'string' ? field.prefix : undefined,
      tips: typeof field.tips === 'string' ? field.tips : undefined,
      confirmText:
        typeof field.confirmText === 'string' ? field.confirmText : undefined,
      cancelText:
        typeof field.cancelText === 'string' ? field.cancelText : undefined,
      choices: Array.isArray(field.choices)
        ? field.choices.map((choice) => {
          if (typeof choice === 'string') {
            return choice
          }

          return {
            name: choice.name,
            value: choice.value,
            checked:
              typeof (choice as { checked?: unknown }).checked === 'boolean'
                ? (choice as { checked?: boolean }).checked
                : undefined
          }
        })
        : undefined
    }))
  }
}

function getConfigState (providerId: string) {
  return useAppStore.getState().appConfig?.uploader?.[providerId]
}

function getConfigItemById (
  providerId: string,
  configId: string
): ProviderUploaderConfigItem | null {
  return getConfigState(providerId)?.configList.find((item) => item._id === configId) ?? null
}

function getConfigNameById (providerId: string, configId: string) {
  const configItem = getConfigItemById(providerId, configId)

  if (!configItem) {
    throw new Error(i18n.t('TIPS_UPLOADER_CONFIG_NOT_FOUND'))
  }

  return configItem._configName
}

async function runWithProviderLoading<T> (
  providerId: string,
  task: () => Promise<T>
) {
  providerStoreActions.setLoadingByProvider(providerId, true)

  try {
    return await task()
  } finally {
    providerStoreActions.setLoadingByProvider(providerId, false)
  }
}

export const providerStoreActions = {
  setSearchValue (value: string) {
    useProviderStore.setState((state) => {
      state.searchValue = value
    })
  },
  ensureExpanded (providerId: string) {
    useProviderStore.setState((state) => {
      if (state.expandedProviderIds.includes(providerId)) {
        return
      }

      state.expandedProviderIds.push(providerId)
    })
  },
  toggleExpanded (providerId: string) {
    useProviderStore.setState((state) => {
      state.expandedProviderIds = state.expandedProviderIds.includes(providerId)
        ? state.expandedProviderIds.filter((item: string) => item !== providerId)
        : [...state.expandedProviderIds, providerId]
    })
  },
  setHydrating (isHydrating: boolean) {
    useProviderStore.setState((state) => {
      state.isHydrating = isHydrating
    })
  },
  setLoadingByProvider (providerId: string, isLoading: boolean) {
    useProviderStore.setState((state) => {
      state.isLoadingByProvider[providerId] = isLoading
    })
  },
  async refreshState () {
    await appActions.hydrateAppState()
  },
  async ensureSchema (providerId: string) {
    const currentSchema = useAppStore.getState().providerSchemas[providerId]

    if (currentSchema) {
      return currentSchema
    }

    return runWithProviderLoading(providerId, async () => {
      const schemaResult = await providersAdapter.getProviderSchema(providerId)
      const normalizedSchema = normalizeProviderSchema(providerId, schemaResult)

      useAppStore.setState((state) => {
        state.providerSchemas[providerId] = normalizedSchema
      })

      return normalizedSchema
    })
  },
  async setDefaultProvider (providerId: string) {
    await appActions.setDefaultPicBed(providerId)
  },
  async setDefaultConfig (providerId: string, configId: string) {
    return runWithProviderLoading(providerId, async () => {
      const configName = getConfigNameById(providerId, configId)
      const selectedId = await providersAdapter.selectProviderConfig(
        providerId,
        configName
      )

      await appActions.hydrateAppState()
      return selectedId
    })
  },
  async selectDashboardProviderConfig (providerId: string, configId?: string) {
    return runWithProviderLoading(providerId, async () => {
      const configName = configId ? getConfigNameById(providerId, configId) : undefined

      await providersAdapter.changeCurrentUploader(providerId, configName)
      await appActions.hydrateAppState()
    })
  },
  async createConfig (providerId: string, configName: string) {
    return runWithProviderLoading(providerId, async () => {
      await providersAdapter.saveProviderConfig(providerId, '', {
        _configName: configName
      })
      await appActions.hydrateAppState()

      const createdConfig = getConfigState(providerId)?.configList.find(
        (item) => item._configName === configName
      )

      if (!createdConfig) {
        throw new Error(i18n.t('TIPS_UPLOADER_CONFIG_NOT_FOUND'))
      }

      return createdConfig._id
    })
  },
  async renameConfig (
    providerId: string,
    configId: string,
    configName: string
  ) {
    return runWithProviderLoading(providerId, async () => {
      await providersAdapter.saveProviderConfig(providerId, configId, {
        _configName: configName
      })
      await appActions.hydrateAppState()
    })
  },
  async copyConfig (
    providerId: string,
    configId: string,
    configName: string
  ) {
    return runWithProviderLoading(providerId, async () => {
      const sourceConfigName = getConfigNameById(providerId, configId)
      const result = await providersAdapter.copyProviderConfig(
        providerId,
        sourceConfigName,
        configName
      )

      await appActions.hydrateAppState()
      const copiedConfig = result.configList.find(
        (item) => item._configName === configName
      )

      if (!copiedConfig) {
        throw new Error(i18n.t('TIPS_UPLOADER_CONFIG_NOT_FOUND'))
      }

      return copiedConfig._id
    })
  },
  async deleteConfig (providerId: string, configId: string) {
    return runWithProviderLoading(providerId, async () => {
      const configName = getConfigNameById(providerId, configId)
      const result = await providersAdapter.deleteProviderConfig(
        providerId,
        configName
      )

      await appActions.hydrateAppState()

      return result.defaultId || result.configList[0]?._id || null
    })
  },
  async saveConfig (
    providerId: string,
    configId: string,
    formValues: ProviderFormValues
  ) {
    return runWithProviderLoading(providerId, async () => {
      const configName = getConfigNameById(providerId, configId)

      await providersAdapter.saveProviderConfig(providerId, configId, {
        ...formValues,
        _configName: configName
      })
      await appActions.hydrateAppState()
      return configId
    })
  }
}
