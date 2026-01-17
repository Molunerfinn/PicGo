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
            <div class="flex items-center gap-[12px] mb-[12px]">
              <div class="text-[16px] font-medium text-[#ddd] leading-[22px]">
                {{ $T('PICGO_CLOUD_LOGGED_IN_AS', { user: userInfo.user }) }}
              </div>
              <el-button
                type="danger"
                size="small"
                @click="handleLogout"
              >
                {{ $T('PICGO_CLOUD_LOGOUT') }}
              </el-button>
            </div>

            <div class="flex items-center gap-[12px] flex-wrap">
              <el-button
                type="primary"
                :loading="isConfigSyncRunning"
                :disabled="isConfigSyncBusy"
                @click="handleConfigSyncStart"
              >
                {{ $T('PICGO_CLOUD_CONFIG_SYNC') }}
              </el-button>

              <div class="flex items-center gap-[8px] text-[#bbb]">
                <span class="text-[12px] text-[#bbb] leading-[18px] shrink-0 whitespace-nowrap">
                  {{ $T('PICGO_CLOUD_ENCRYPTION_MODE_LABEL') }}
                </span>
                <el-select
                  v-model="encryptionMode"
                  size="small"
                  class="w-[180px] shrink-0"
                  :disabled="isEncryptionModeDisabled"
                >
                  <el-option
                    :label="$T('PICGO_CLOUD_ENCRYPTION_MODE_AUTO')"
                    :value="IPicGoCloudEncryptionMode.AUTO"
                  />
                  <el-option
                    :label="$T('PICGO_CLOUD_ENCRYPTION_MODE_SERVER')"
                    :value="IPicGoCloudEncryptionMode.SERVER_SIDE"
                  />
                  <el-option
                    :label="$T('PICGO_CLOUD_ENCRYPTION_MODE_E2E')"
                    :value="IPicGoCloudEncryptionMode.E2E"
                  />
                </el-select>
                <el-tooltip
                  effect="dark"
                  placement="top"
                  :enterable="true"
                >
                  <template #content>
                    <div class="text-[12px] leading-[18px] max-w-[320px]">
                      <div>{{ $T('PICGO_CLOUD_ENCRYPTION_MODE_TIP_AUTO') }}</div>
                      <div>{{ $T('PICGO_CLOUD_ENCRYPTION_MODE_TIP_SERVER') }}</div>
                      <div>{{ $T('PICGO_CLOUD_ENCRYPTION_MODE_TIP_E2E') }}</div>
                      <div class="mt-[6px]">
                        <el-link
                          type="primary"
                          :underline="false"
                          @click.stop.prevent="handleOpenDocs"
                        >
                          {{ $T('PICGO_CLOUD_ENCRYPTION_MODE_TIP_DOC') }}
                        </el-link>
                      </div>
                    </div>
                  </template>
                  <el-icon class="cursor-pointer text-[#999] hover:text-blue">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
              </div>
            </div>
            <div class="mt-[8px] text-[12px] text-[#999] leading-[18px]">
              {{ $T('PICGO_CLOUD_LAST_SYNC_TIME', { time: lastSyncedAtText || $T('PICGO_CLOUD_LAST_SYNC_TIME_NONE') }) }}
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
          </template>
        </div>
      </el-col>
    </el-row>

    <ConfigSyncConflictDialog
      v-model="isConflictDialogVisible"
      :conflicts="configSyncConflicts"
      :confirm-loading="isApplyResolutionLoading"
      @abort="handleAbortConfigSync"
      @confirm="handleConfirmConfigSyncResolution"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeMount, onBeforeUnmount, ref, watch } from 'vue'
import { T as $T } from '@/i18n/index'
import { useStore } from '@/hooks/useStore'
import type { IPicGoCloudUserInfo } from '#/types/cloud'
import { IPicGoCloudLoginStatus, IPicGoCloudRequestStatus } from '@/store'
import { invokeRPC } from '@/utils/dataSender'
import { IRPCActionType } from '~/universal/types/enum'
import { openURL } from '@/utils/common'
import { ElMessage, ElMessageBox } from 'element-plus'
import ConfigSyncConflictDialog from '@/components/picgoCloud/ConfigSyncConflictDialog.vue'
import dayjs from 'dayjs'
import { QuestionFilled } from '@element-plus/icons-vue'
import {
  IPicGoCloudConfigSyncSessionStatus,
  IPicGoCloudConfigSyncToastType,
  IPicGoCloudEncryptionMode,
  type IPicGoCloudConfigSyncRunResult,
  type IPicGoCloudConfigSyncState,
  type IPicGoCloudConfigSyncResolution
} from '#/types/cloudConfigSync'

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
const DOC_URL = 'https://picgo.github.io/PicGo-Doc/'

const isUserInfoLoading = computed(() => userInfoStatus.value === IPicGoCloudRequestStatus.LOADING)
const isLoginInProgress = computed(() => loginStatus.value === IPicGoCloudLoginStatus.IN_PROGRESS)

const errorMessage = computed(() => loginError.value || userInfoError.value)

const configSyncState = ref<IPicGoCloudConfigSyncState>({
  sessionStatus: IPicGoCloudConfigSyncSessionStatus.IDLE,
  enableE2E: undefined
})
const isConfigSyncStateLoading = ref(false)
const isE2EPreferenceUpdating = ref(false)
const isApplyResolutionLoading = ref(false)
const isConflictDialogVisible = ref(false)

const configSyncSessionStatus = computed(() => configSyncState.value.sessionStatus)
const isConfigSyncRunning = computed(() => configSyncSessionStatus.value === IPicGoCloudConfigSyncSessionStatus.SYNCING)
const isConfigSyncBusy = computed(() => configSyncSessionStatus.value !== IPicGoCloudConfigSyncSessionStatus.IDLE)
const configSyncConflicts = computed(() => configSyncState.value.conflicts ?? [])
const lastSyncedAtText = computed<string | undefined>(() => {
  const raw = configSyncState.value.lastSyncedAt
  if (!raw) return undefined
  const date = dayjs(raw)
  if (!date.isValid()) return undefined
  return date.format('YYYY-MM-DD HH:mm:ss')
})

const isEncryptionModeDisabled = computed(() => {
  if (isConfigSyncBusy.value) return true
  return isConfigSyncStateLoading.value || isE2EPreferenceUpdating.value
})

const encryptionMode = computed<IPicGoCloudEncryptionMode>({
  get: () => {
    if (configSyncState.value.enableE2E === true) return IPicGoCloudEncryptionMode.E2E
    if (configSyncState.value.enableE2E === false) return IPicGoCloudEncryptionMode.SERVER_SIDE
    return IPicGoCloudEncryptionMode.AUTO
  },
  set: (value: IPicGoCloudEncryptionMode) => {
    void handleSetEncryptionMode(value)
  }
})

const handleOpenTerms = () => {
  openURL(TERMS_URL)
}

const handleOpenPrivacy = () => {
  openURL(PRIVACY_URL)
}

const handleOpenDocs = () => {
  // TODO: change dog url
  openURL(DOC_URL)
}

onBeforeMount(() => {
  // First entry: only fetch when store is empty (undefined). Subsequent page entries read store.
  if (!store) return
  if (store.state.picgoCloud.userInfo !== undefined) {
    if (store.state.picgoCloud.userInfo) {
      void loadConfigSyncState()
    }
    return
  }
  void loadUserInfoAndMaybeHydrateCloudState()
})

const loadUserInfoAndMaybeHydrateCloudState = async () => {
  await loadUserInfo()
  if (store?.state.picgoCloud.userInfo) {
    await loadConfigSyncState()
  }
}

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

const applyConfigSyncState = (state: IPicGoCloudConfigSyncState) => {
  configSyncState.value = state

  if (state.notifyRemoteE2EOnce) {
    ElMessage.info($T('PICGO_CLOUD_REMOTE_E2E_AUTO_ENABLED'))
  }

  if (state.sessionStatus === IPicGoCloudConfigSyncSessionStatus.CONFLICT) {
    isConflictDialogVisible.value = true
  }
}

const loadConfigSyncState = async () => {
  isConfigSyncStateLoading.value = true
  const res = await invokeRPC<IPicGoCloudConfigSyncState>(IRPCActionType.PICGO_CLOUD_CONFIG_SYNC_GET_STATE)
  isConfigSyncStateLoading.value = false

  if (!res.success) {
    ElMessage.error(res.error)
    return
  }

  applyConfigSyncState(res.data)
}

const showConfigSyncToast = (toastType: IPicGoCloudConfigSyncToastType, message: string) => {
  if (toastType === IPicGoCloudConfigSyncToastType.SUCCESS) {
    ElMessage.success(message)
    return
  }
  if (toastType === IPicGoCloudConfigSyncToastType.WARNING) {
    ElMessage.warning(message)
    return
  }
  if (toastType === IPicGoCloudConfigSyncToastType.ERROR) {
    ElMessage.error(message)
    return
  }
  ElMessage.info(message)
}

const promptRestartIfNeeded = async () => {
  try {
    await ElMessageBox.confirm(
      $T('PICGO_CLOUD_CONFIG_SYNC_RESTART_PROMPT_MESSAGE'),
      $T('PICGO_CLOUD_CONFIG_SYNC_RESTART_PROMPT_TITLE'),
      {
        type: 'warning',
        confirmButtonText: $T('PICGO_CLOUD_CONFIG_SYNC_RESTART_NOW'),
        cancelButtonText: $T('PICGO_CLOUD_CONFIG_SYNC_RESTART_LATER'),
        closeOnClickModal: false,
        closeOnPressEscape: false
      }
    )
  } catch {
    return
  }

  const res = await invokeRPC<void>(IRPCActionType.RELOAD_APP)
  if (!res.success) {
    ElMessage.error(res.error)
  }
}

const handleConfigSyncStart = async () => {
  if (isConfigSyncBusy.value) return

  // Optimistically switch to SYNCING for immediate loading feedback.
  // The main process still owns the source-of-truth session state.
  configSyncState.value = {
    ...configSyncState.value,
    sessionStatus: IPicGoCloudConfigSyncSessionStatus.SYNCING,
    conflicts: undefined
  }
  ElMessage.info($T('PICGO_CLOUD_CONFIG_SYNC_STARTING'))

  const res = await invokeRPC<IPicGoCloudConfigSyncRunResult>(IRPCActionType.PICGO_CLOUD_CONFIG_SYNC_START)
  if (!res.success) {
    ElMessage.error(res.error)
    await loadConfigSyncState()
    return
  }

  const runRes = res.data
  applyConfigSyncState(runRes.state)
  showConfigSyncToast(runRes.toastType, runRes.message)

  if (runRes.authInvalidated && store) {
    store.setPicGoCloudUserInfo(null)
    store.setPicGoCloudUserInfoError(null)
    store.setPicGoCloudUserInfoStatus(IPicGoCloudRequestStatus.IDLE)
  }

  if (runRes.shouldShowRestartPrompt) {
    await promptRestartIfNeeded()
  }
}

const handleAbortConfigSync = async () => {
  const res = await invokeRPC<IPicGoCloudConfigSyncState>(IRPCActionType.PICGO_CLOUD_CONFIG_SYNC_ABORT)
  if (!res.success) {
    ElMessage.error(res.error)
    return
  }
  applyConfigSyncState(res.data)
  isConflictDialogVisible.value = false
  ElMessage.warning($T('PICGO_CLOUD_CONFIG_SYNC_ABORTED'))
}

const handleConfirmConfigSyncResolution = async (resolution: IPicGoCloudConfigSyncResolution) => {
  isApplyResolutionLoading.value = true
  const res = await invokeRPC<IPicGoCloudConfigSyncRunResult>(IRPCActionType.PICGO_CLOUD_CONFIG_SYNC_APPLY_RESOLUTION, resolution)
  isApplyResolutionLoading.value = false

  if (!res.success) {
    ElMessage.error(res.error)
    return
  }

  const runRes = res.data
  applyConfigSyncState(runRes.state)
  showConfigSyncToast(runRes.toastType, runRes.message)

  if (runRes.authInvalidated && store) {
    isConflictDialogVisible.value = false
    store.setPicGoCloudUserInfo(null)
    store.setPicGoCloudUserInfoError(null)
    store.setPicGoCloudUserInfoStatus(IPicGoCloudRequestStatus.IDLE)
    return
  }

  if (runRes.shouldShowRestartPrompt) {
    isConflictDialogVisible.value = false
    await promptRestartIfNeeded()
  }
}

const handleSetEncryptionMode = async (nextMode: IPicGoCloudEncryptionMode) => {
  if (isE2EPreferenceUpdating.value) return
  if (isConfigSyncBusy.value) return

  const currentMode = encryptionMode.value
  if (nextMode === currentMode) return

  const previousEnableE2E = configSyncState.value.enableE2E

  // Only turning on E2E needs a warning confirmation.
  // If the user cancels, we persist "server-side encryption" (`enableE2E=false`) per product requirement,
  // rather than leaving it at AUTO.
  let modeToPersist = nextMode
  if (nextMode === IPicGoCloudEncryptionMode.E2E) {
    try {
      await ElMessageBox.confirm(
        $T('PICGO_CLOUD_E2E_ENABLE_WARNING_MESSAGE'),
        $T('PICGO_CLOUD_E2E_ENABLE_WARNING_TITLE'),
        {
          type: 'warning',
          confirmButtonText: $T('CONFIRM'),
          cancelButtonText: $T('CANCEL'),
          closeOnClickModal: false,
          closeOnPressEscape: false
        }
      )
    } catch {
      modeToPersist = IPicGoCloudEncryptionMode.SERVER_SIDE
    }
  }

  // Optimistically update local UI state so the dropdown reflects the user's selection immediately.
  configSyncState.value = {
    ...configSyncState.value,
    enableE2E: modeToPersist === IPicGoCloudEncryptionMode.AUTO
      ? undefined
      : modeToPersist === IPicGoCloudEncryptionMode.E2E
  }

  isE2EPreferenceUpdating.value = true
  const res = await invokeRPC<boolean | undefined>(IRPCActionType.PICGO_CLOUD_CONFIG_SYNC_SET_E2E_PREFERENCE, modeToPersist)
  isE2EPreferenceUpdating.value = false

  if (!res.success) {
    // Restore previous selection on failure.
    configSyncState.value = {
      ...configSyncState.value,
      enableE2E: previousEnableE2E
    }
    ElMessage.error(res.error)
    return
  }

  configSyncState.value = {
    ...configSyncState.value,
    enableE2E: res.data
  }
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
  await loadConfigSyncState()
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

  // Clear config-sync related UI state after logout.
  configSyncState.value = {
    sessionStatus: IPicGoCloudConfigSyncSessionStatus.IDLE,
    enableE2E: undefined
  }
  isConflictDialogVisible.value = false
}

const pollTimer = ref<number | null>(null)

const stopPolling = () => {
  if (pollTimer.value === null) return
  window.clearInterval(pollTimer.value)
  pollTimer.value = null
}

watch(isConfigSyncRunning, (running) => {
  if (!running) {
    stopPolling()
    return
  }
  if (pollTimer.value !== null) return
  pollTimer.value = window.setInterval(() => {
    void loadConfigSyncState()
  }, 1500)
})

onBeforeUnmount(() => {
  stopPolling()
})

</script>

<script lang="ts">
export default {
  name: 'PicGoCloudPage'
}
</script>
