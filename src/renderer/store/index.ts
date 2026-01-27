import { reactive, InjectionKey, readonly, App, UnwrapRef, ref, type DeepReadonly } from 'vue'
import { getConfig, getPicBeds, saveConfig } from '@/utils/dataSender'
import type { IPicGoCloudUserInfo } from '#/types/cloud'
import type { IConfig } from 'picgo'

export enum IPicGoCloudRequestStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  ERROR = 'ERROR'
}

export enum IPicGoCloudLoginStatus {
  IDLE = 'IDLE',
  IN_PROGRESS = 'IN_PROGRESS'
}

export interface IPicGoCloudState {
  /**
   * PicGo Cloud auth tri-state:
   * - undefined: not loaded yet (first entry triggers auto load)
   * - null: loaded, but not logged in
   * - { user }: logged in
   */
  userInfo: IPicGoCloudUserInfo | null | undefined;
  userInfoStatus: IPicGoCloudRequestStatus;
  userInfoError: string | null;
  loginStatus: IPicGoCloudLoginStatus;
  loginError: string | null;
  /**
   * Whether user has explicitly checked the acknowledgement before starting login
   * in the current app session.
   */
  hasAgreedToTermsAndPrivacy: boolean;
}

export interface IState {
  defaultPicBed: string;
  appConfig: IConfig | null;
  picBeds: IPicBedType[];
  picgoCloud: IPicGoCloudState;
}

export interface IStore {
  state: DeepReadonly<UnwrapRef<IState>>
  setDefaultPicBed: (type: string) => void;
  refreshAppConfig: () => Promise<void>;
  refreshPicBeds: () => Promise<void>;
  setPicGoCloudUserInfo: (userInfo: IPicGoCloudUserInfo | null | undefined) => void;
  setPicGoCloudUserInfoStatus: (status: IPicGoCloudRequestStatus) => void;
  setPicGoCloudUserInfoError: (error: string | null) => void;
  setPicGoCloudLoginStatus: (status: IPicGoCloudLoginStatus) => void;
  setPicGoCloudLoginError: (error: string | null) => void;
  setPicGoCloudHasAgreedToTermsAndPrivacy: (hasAgreed: boolean) => void;
  updateForceUpdateTime: () => void;
}

export const storeKey: InjectionKey<IStore> = Symbol('store')

// state
const state: IState = reactive({
  defaultPicBed: 'smms',
  appConfig: null,
  picBeds: [],
  picgoCloud: {
    userInfo: undefined,
    userInfoStatus: IPicGoCloudRequestStatus.IDLE,
    userInfoError: null,
    loginStatus: IPicGoCloudLoginStatus.IDLE,
    loginError: null,
    hasAgreedToTermsAndPrivacy: false
  }
})

const forceUpdateTime = ref<number>(Date.now())

// methods
const setDefaultPicBed = (type: string) => {
  saveConfig({
    'picBed.current': type,
    'picBed.uploader': type
  })
  state.defaultPicBed = type
}

const setAppConfig = (config: IConfig | null) => {
  state.appConfig = config
  if (config) {
    const picBed = config.picBed
    state.defaultPicBed = picBed.uploader || picBed.current || 'smms'
  }
}

const refreshAppConfig = async (): Promise<void> => {
  const config = await getConfig<IConfig>()
  setAppConfig(config ?? null)
}

const refreshPicBeds = async (): Promise<void> => {
  const picBeds = await getPicBeds()
  state.picBeds = picBeds
}

const setPicGoCloudUserInfo = (userInfo: IPicGoCloudUserInfo | null | undefined) => {
  state.picgoCloud.userInfo = userInfo
}

const setPicGoCloudUserInfoStatus = (status: IPicGoCloudRequestStatus) => {
  state.picgoCloud.userInfoStatus = status
}

const setPicGoCloudUserInfoError = (error: string | null) => {
  state.picgoCloud.userInfoError = error
}

const setPicGoCloudLoginStatus = (status: IPicGoCloudLoginStatus) => {
  state.picgoCloud.loginStatus = status
}

const setPicGoCloudLoginError = (error: string | null) => {
  state.picgoCloud.loginError = error
}

const setPicGoCloudHasAgreedToTermsAndPrivacy = (hasAgreed: boolean) => {
  state.picgoCloud.hasAgreedToTermsAndPrivacy = hasAgreed
}

const updateForceUpdateTime = () => {
  forceUpdateTime.value = Date.now()
}

export const store = {
  install (app: App) {
    app.provide(storeKey, {
      state: readonly(state),
      setDefaultPicBed,
      refreshAppConfig,
      refreshPicBeds,
      setPicGoCloudUserInfo,
      setPicGoCloudUserInfoStatus,
      setPicGoCloudUserInfoError,
      setPicGoCloudLoginStatus,
      setPicGoCloudLoginError,
      setPicGoCloudHasAgreedToTermsAndPrivacy,
      updateForceUpdateTime
    })
    app.provide('forceUpdateTime', forceUpdateTime)
  }
}
