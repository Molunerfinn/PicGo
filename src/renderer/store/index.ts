import { reactive, InjectionKey, readonly, App, UnwrapRef, ref } from 'vue'
import { saveConfig } from '@/utils/dataSender'
import type { IPicGoCloudUserInfo } from '#/types/cloud'

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
  picgoCloud: IPicGoCloudState;
}

export interface IStore {
  state: UnwrapRef<IState>
  setDefaultPicBed: (type: string) => void;
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
