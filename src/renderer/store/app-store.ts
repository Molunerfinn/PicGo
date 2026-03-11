import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { IPicGoCloudUserInfo } from '#/types/cloud'
import pkg from 'root/package.json'
import type { PluginInstalledItem } from '@/components/main/plugins/types'
import type { SettingsVersionState } from '@/components/main/settings/utils'
import { defaultSettingsVersion } from '@/components/main/settings/utils'
import type {
  AppConfig,
  ProviderUploaderSchema,
  ProviderUploaderSummary
} from '@/components/main/providers/types'
import { createSelectors } from './create-selectors'

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
  settingsVersion: SettingsVersionState
  hasHydrated: boolean
  hasSettingsHydrated: boolean
  picgoCloud: PicGoCloudUserInfoState
}

export const initialAppStoreState: AppStoreState = {
  defaultPicBed: 'smms',
  appConfig: null,
  picBeds: [],
  providers: [],
  providerSchemas: {},
  pluginsInstalled: [],
  settingsVersion: {
    ...defaultSettingsVersion,
    currentVersion: pkg.version
  },
  hasHydrated: false,
  hasSettingsHydrated: false,
  picgoCloud: {
    userInfo: undefined,
    userInfoStatus: picGoCloudRequestStatus.Idle,
    userInfoError: null,
    loginStatus: picGoCloudLoginStatus.Idle,
    loginError: null,
    hasAgreedToTermsAndPrivacy: false
  }
}

export const useAppStoreBase = create<AppStoreState>()(
  immer(() => initialAppStoreState)
)

export const useAppStore = createSelectors(useAppStoreBase)
export const useStore = useAppStore
