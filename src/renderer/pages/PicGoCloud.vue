<template>
  <div id="picgo-cloud-page">
    <div class="view-title">
      {{ $T('PICGO_CLOUD_TITLE') }}
    </div>
    <el-row>
      <el-col
        :span="20"
        :offset="2"
      >
        <div
          v-loading="isUserInfoLoading"
          element-loading-background="rgba(0, 0, 0, 0.6)"
          class="mt-[16px] rounded-[8px] border border-[rgba(255,255,255,0.06)] bg-[rgba(130,130,130,0.12)] p-[16px]"
        >
          <el-alert
            v-if="errorMessage"
            class="!mb-[12px]"
            type="error"
            show-icon
            :title="$T('PICGO_CLOUD_ERROR_TITLE')"
            :description="errorMessage"
          />

          <template v-if="isLoginInProgress">
            <div class="text-[12px] text-[#bbb] leading-[18px] mb-[12px]">
              {{ $T('PICGO_CLOUD_LOGIN_IN_PROGRESS') }}
            </div>
          </template>

          <template v-if="userInfo">
            <div class="text-[12px] text-[#bbb] leading-[18px] mb-[12px]">
              {{ $T('PICGO_CLOUD_LOGGED_IN_AS', { user: userInfo.user }) }}
            </div>
            <div class="flex gap-[8px]">
              <el-button type="primary">
                {{ $T('PICGO_CLOUD_CONFIG_SYNC') }}
              </el-button>
              <el-button
                type="danger"
                @click="handleLogout"
              >
                {{ $T('PICGO_CLOUD_LOGOUT') }}
              </el-button>
            </div>
          </template>

          <template v-else>
            <div class="text-[12px] text-[#bbb] leading-[18px] mb-[12px]">
              {{ $T('PICGO_CLOUD_NOT_LOGGED_IN') }}
            </div>
            <div class="flex gap-[8px]">
              <el-button
                type="primary"
                :loading="isLoginInProgress"
                :disabled="isLoginInProgress || !hasAgreedToTermsAndPrivacy"
                @click="handleLogin"
              >
                {{ $T('PICGO_CLOUD_LOGIN') }}
              </el-button>
              <el-button
                v-if="isLoginInProgress"
                @click="handleDisposeLoginFlow"
              >
                {{ $T('PICGO_CLOUD_CANCEL_LOGIN') }}
              </el-button>
            </div>

            <el-checkbox
              v-model="hasAgreedToTermsAndPrivacy"
              :disabled="isLoginInProgress"
              class="mt-[8px]"
            >
              <span class="text-[12px] text-[#bbb] leading-[18px]">
                {{ $T('PICGO_CLOUD_AGREE_PREFIX') }}
                <el-link
                  type="primary"
                  :underline="false"
                  @click.stop.prevent="handleOpenTerms"
                >
                  {{ $T('PICGO_CLOUD_TERMS_OF_SERVICE') }}
                </el-link>
                {{ $T('PICGO_CLOUD_AGREE_AND') }}
                <el-link
                  type="primary"
                  :underline="false"
                  @click.stop.prevent="handleOpenPrivacy"
                >
                  {{ $T('PICGO_CLOUD_PRIVACY_POLICY') }}
                </el-link>
              </span>
            </el-checkbox>

            <div
              v-if="shouldShowRetry"
              class="mt-[12px]"
            >
              <el-button
                type="text"
                @click="handleRetry"
              >
                {{ $T('PICGO_CLOUD_RETRY') }}
              </el-button>
            </div>
          </template>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeMount } from 'vue'
import { T as $T } from '@/i18n/index'
import { useStore } from '@/hooks/useStore'
import type { IPicGoCloudUserInfo } from '#/types/cloud'
import { IPicGoCloudLoginStatus, IPicGoCloudRequestStatus } from '@/store'
import { invokeRPC } from '@/utils/dataSender'
import { IRPCActionType } from '~/universal/types/enum'
import { openURL } from '@/utils/common'

const store = useStore()

const userInfo = computed(() => store?.state.picgoCloud.userInfo)
const userInfoStatus = computed(() => store?.state.picgoCloud.userInfoStatus ?? IPicGoCloudRequestStatus.IDLE)
const userInfoError = computed(() => store?.state.picgoCloud.userInfoError)
const loginStatus = computed(() => store?.state.picgoCloud.loginStatus ?? IPicGoCloudLoginStatus.IDLE)
const loginError = computed(() => store?.state.picgoCloud.loginError)
const hasAgreedToTermsAndPrivacy = computed({
  get: () => store?.state.picgoCloud.hasAgreedToTermsAndPrivacy ?? false,
  set: (value: boolean) => {
    store?.setPicGoCloudHasAgreedToTermsAndPrivacy(value)
  }
})

const TERMS_URL = 'https://picgo.app/terms/'
const PRIVACY_URL = 'https://picgo.app/privacy/'

const isUserInfoLoading = computed(() => userInfoStatus.value === IPicGoCloudRequestStatus.LOADING)
const isLoginInProgress = computed(() => loginStatus.value === IPicGoCloudLoginStatus.IN_PROGRESS)

const shouldShowRetry = computed(() => userInfoStatus.value === IPicGoCloudRequestStatus.ERROR)
const errorMessage = computed(() => loginError.value || userInfoError.value)

const handleOpenTerms = () => {
  openURL(TERMS_URL)
}

const handleOpenPrivacy = () => {
  openURL(PRIVACY_URL)
}

onBeforeMount(() => {
  // First entry: only fetch when store is empty (undefined). Subsequent page entries read store.
  if (!store) return
  if (store.state.picgoCloud.userInfo !== undefined) return
  void loadUserInfo()
})

const loadUserInfo = async () => {
  if (!store) return

  store.setPicGoCloudUserInfoStatus(IPicGoCloudRequestStatus.LOADING)
  store.setPicGoCloudUserInfoError(null)

  const res = await invokeRPC<IPicGoCloudUserInfo | null>(IRPCActionType.PICGO_CLOUD_GET_USER_INFO)
  if (!res.success) {
    store.setPicGoCloudUserInfoStatus(IPicGoCloudRequestStatus.ERROR)
    store.setPicGoCloudUserInfoError(res.error)
    return
  }
  store.setPicGoCloudUserInfo(res.data)
  store.setPicGoCloudUserInfoStatus(IPicGoCloudRequestStatus.IDLE)
}

const handleRetry = async () => {
  await loadUserInfo()
}

const handleLogin = async () => {
  if (!store) return
  if (!hasAgreedToTermsAndPrivacy.value) return
  store.setPicGoCloudLoginStatus(IPicGoCloudLoginStatus.IN_PROGRESS)
  store.setPicGoCloudLoginError(null)

  const res = await invokeRPC<IPicGoCloudUserInfo>(IRPCActionType.PICGO_CLOUD_LOGIN)
  if (!res.success) {
    store.setPicGoCloudLoginError(res.error)
    store.setPicGoCloudLoginStatus(IPicGoCloudLoginStatus.IDLE)
    return
  }

  store.setPicGoCloudUserInfo(res.data)
  store.setPicGoCloudUserInfoStatus(IPicGoCloudRequestStatus.IDLE)
  store.setPicGoCloudUserInfoError(null)
  store.setPicGoCloudLoginStatus(IPicGoCloudLoginStatus.IDLE)
}

const handleDisposeLoginFlow = async () => {
  if (!store) return
  const res = await invokeRPC<boolean>(IRPCActionType.PICGO_CLOUD_DISPOSE_LOGIN_FLOW)
  if (!res.success) {
    store.setPicGoCloudLoginError(res.error)
  }
  store.setPicGoCloudLoginStatus(IPicGoCloudLoginStatus.IDLE)
}

const handleLogout = async () => {
  if (!store) return
  const res = await invokeRPC<boolean>(IRPCActionType.PICGO_CLOUD_LOGOUT)
  if (!res.success) {
    store.setPicGoCloudLoginError(res.error)
    return
  }
  store.setPicGoCloudUserInfo(null)
  store.setPicGoCloudLoginError(null)
}

</script>

<script lang="ts">
export default {
  name: 'PicGoCloudPage'
}
</script>
