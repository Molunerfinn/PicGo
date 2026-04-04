import type { IPicGoCloudUserInfo } from '#/types/cloud'
import type {
  IPicGoCloudConfigSyncResolution,
  IPicGoCloudConfigSyncRunResult,
  IPicGoCloudConfigSyncState,
  IPicGoCloudEncryptionMethod
} from '#/types/cloudConfigSync'
import { IRPCActionType } from '#/types/enum'
import { invokeRPC, openURL } from '@/utils/dataSender'

export const PICGO_CLOUD_URL = 'https://cloud.picgo.app'
export const PICGO_CLOUD_TERMS_URL = 'https://picgo.github.io/PicGo-Doc/guide/cloud.html#terms-of-service'
export const PICGO_CLOUD_PRIVACY_URL = 'https://picgo.github.io/PicGo-Doc/guide/cloud.html#privacy-policy'
export const PICGO_CLOUD_ENCRYPTION_DOC_URL = 'https://picgo.github.io/PicGo-Doc/guide/cloud.html#encryption'

export const cloudAdapter = {
  async getUserInfo () {
    return await invokeRPC<IPicGoCloudUserInfo | null>(IRPCActionType.PICGO_CLOUD_GET_USER_INFO)
  },
  async login () {
    return await invokeRPC<IPicGoCloudUserInfo>(IRPCActionType.PICGO_CLOUD_LOGIN)
  },
  async logout () {
    return await invokeRPC<boolean>(IRPCActionType.PICGO_CLOUD_LOGOUT)
  },
  async disposeLoginFlow () {
    return await invokeRPC<boolean>(IRPCActionType.PICGO_CLOUD_DISPOSE_LOGIN_FLOW)
  },
  async getConfigSyncState () {
    return await invokeRPC<IPicGoCloudConfigSyncState>(IRPCActionType.PICGO_CLOUD_CONFIG_SYNC_GET_STATE)
  },
  async startConfigSync () {
    return await invokeRPC<IPicGoCloudConfigSyncRunResult>(IRPCActionType.PICGO_CLOUD_CONFIG_SYNC_START)
  },
  async abortConfigSync () {
    return await invokeRPC<IPicGoCloudConfigSyncState>(IRPCActionType.PICGO_CLOUD_CONFIG_SYNC_ABORT)
  },
  async applyConfigSyncResolution (resolution: IPicGoCloudConfigSyncResolution) {
    return await invokeRPC<IPicGoCloudConfigSyncRunResult>(
      IRPCActionType.PICGO_CLOUD_CONFIG_SYNC_APPLY_RESOLUTION,
      resolution
    )
  },
  async setEncryptionMethod (mode: IPicGoCloudEncryptionMethod) {
    return await invokeRPC<IPicGoCloudEncryptionMethod>(
      IRPCActionType.PICGO_CLOUD_CONFIG_SYNC_SET_E2E_PREFERENCE,
      mode
    )
  },
  async reloadApp () {
    return await invokeRPC<void>(IRPCActionType.RELOAD_APP)
  },
  openCloud () {
    openURL(PICGO_CLOUD_URL)
  },
  openTerms () {
    openURL(PICGO_CLOUD_TERMS_URL)
  },
  openPrivacy () {
    openURL(PICGO_CLOUD_PRIVACY_URL)
  },
  openEncryptionDocs () {
    openURL(PICGO_CLOUD_ENCRYPTION_DOC_URL)
  }
}
