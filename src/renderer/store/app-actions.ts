import type { IPicGoCloudUserInfo } from '#/types/cloud'
import { appConfigAdapter } from '@/adapters/app-config'
import {
  buildProviderSummaries,
  normalizeAppConfig,
  normalizePicBedList,
  resolveDefaultPicBed
} from '@/store/utils'
import type {
  PicGoCloudLoginStatus,
  PicGoCloudRequestStatus
} from './app-store'
import { useAppStore } from './app-store'

export const appActions = {
  async refreshAppConfig () {
    const config = await appConfigAdapter.getAppConfig()
    const picBeds = useAppStore.getState().picBeds
    const normalizedConfig = normalizeAppConfig(config ?? null, picBeds)

    useAppStore.setState((state) => {
      state.appConfig = normalizedConfig
      state.defaultPicBed = resolveDefaultPicBed(config ?? null)
      state.providers = buildProviderSummaries(picBeds, normalizedConfig)
    })
  },
  async refreshPicBeds () {
    const picBeds = await appConfigAdapter.getPicBeds()

    useAppStore.setState((state) => {
      state.picBeds = picBeds

      if (state.appConfig) {
        state.appConfig.picBed.list = normalizePicBedList(state.appConfig, picBeds)
      }

      state.providers = buildProviderSummaries(picBeds, state.appConfig)
    })
  },
  async hydrateAppState () {
    const [config, picBeds] = await Promise.all([
      appConfigAdapter.getAppConfig(),
      appConfigAdapter.getPicBeds()
    ])
    const normalizedConfig = normalizeAppConfig(config ?? null, picBeds)
    useAppStore.setState((state) => {
      state.appConfig = normalizedConfig
      state.defaultPicBed = resolveDefaultPicBed(config ?? null)
      state.picBeds = picBeds
      state.providers = buildProviderSummaries(picBeds, normalizedConfig)
      state.hasHydrated = true
    })
  },
  async ensureHydrated () {
    if (useAppStore.getState().hasHydrated) {
      return
    }

    await appActions.hydrateAppState()
  },
  async ensureSettingsHydrated () {
    if (useAppStore.getState().hasSettingsHydrated) {
      return
    }

    await appActions.ensureHydrated()

    useAppStore.setState((state) => {
      state.hasSettingsHydrated = true
    })
  },
  async setDefaultPicBed (type: string) {
    await appConfigAdapter.saveConfig({
      'picBed.current': type,
      'picBed.uploader': type
    })
    await appActions.hydrateAppState()
  },
  setPicGoCloudUserInfo (userInfo: IPicGoCloudUserInfo | null | undefined) {
    useAppStore.setState((state) => {
      state.picgoCloud.userInfo = userInfo
    })
  },
  setPicGoCloudUserInfoStatus (status: PicGoCloudRequestStatus) {
    useAppStore.setState((state) => {
      state.picgoCloud.userInfoStatus = status
    })
  },
  setPicGoCloudUserInfoError (error: string | null) {
    useAppStore.setState((state) => {
      state.picgoCloud.userInfoError = error
    })
  },
  setPicGoCloudLoginStatus (status: PicGoCloudLoginStatus) {
    useAppStore.setState((state) => {
      state.picgoCloud.loginStatus = status
    })
  },
  setPicGoCloudLoginError (error: string | null) {
    useAppStore.setState((state) => {
      state.picgoCloud.loginError = error
    })
  },
  setPicGoCloudHasAgreedToTermsAndPrivacy (hasAgreed: boolean) {
    useAppStore.setState((state) => {
      state.picgoCloud.hasAgreedToTermsAndPrivacy = hasAgreed
    })
  }
}
