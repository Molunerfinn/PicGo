import i18n from '@/i18n'
import { providersAdapter } from '@/adapters/providers'
import type { ProviderFormValues } from '@/components/main/providers/utils'
import { appActions } from '@/store/app-actions'
import { useAppStore } from '@/store/app-store'
import { useProviderStore } from './store'

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
  async setDefaultProvider (providerId: string) {
    await appActions.setDefaultPicBed(providerId)
  },
  async setDefaultConfig (providerId: string, configId: string) {
    await providerStoreActions.selectDashboardProviderConfig(providerId, configId)
    return configId
  },
  async selectDashboardProviderConfig (providerId: string, configId: string) {
    const appConfig = useAppStore.getState().appConfig
    const configName = appConfig?.uploader?.[providerId]?.configList.find(
      (item) => item._id === configId
    )?._configName

    if (!configName) {
      throw new Error(i18n.t('TIPS_UPLOADER_CONFIG_NOT_FOUND'))
    }

    await providersAdapter.changeCurrentUploader(providerId, configName)
    await appActions.hydrateAppState()
  },
  async createConfig (_providerId: string, _configName: string) {
    return null
  },
  async renameConfig (
    _providerId: string,
    _configId: string,
    _configName: string
  ) {
    return null
  },
  async copyConfig (
    _providerId: string,
    _configId: string,
    _configName: string
  ) {
    return null
  },
  async deleteConfig (_providerId: string, _configId: string) {
    return null
  },
  async saveConfig (
    _providerId: string,
    _configId: string,
    _formValues: ProviderFormValues
  ) {
    return null
  }
}
