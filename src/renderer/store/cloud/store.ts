import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { IPicGoCloudConfigSyncState } from '#/types/cloudConfigSync'
import { IPicGoCloudConfigSyncSessionStatus } from '#/types/cloudConfigSync'
import { createSelectors } from '@/store/create-selectors'

export interface CloudStoreState {
  configSyncState: IPicGoCloudConfigSyncState
  isConfigSyncStateLoading: boolean
  isApplyResolutionLoading: boolean
  isEncryptionMethodUpdating: boolean
  isConflictDialogOpen: boolean
  isEnableE2EConfirmOpen: boolean
  isRestartPromptOpen: boolean
}

const initialCloudStoreState: CloudStoreState = {
  configSyncState: {
    sessionStatus: IPicGoCloudConfigSyncSessionStatus.IDLE,
    encryptionMethod: undefined
  },
  isConfigSyncStateLoading: false,
  isApplyResolutionLoading: false,
  isEncryptionMethodUpdating: false,
  isConflictDialogOpen: false,
  isEnableE2EConfirmOpen: false,
  isRestartPromptOpen: false
}

export const useCloudStoreBase = create<CloudStoreState>()(
  immer(() => initialCloudStoreState)
)

export const useCloudStore = createSelectors(useCloudStoreBase)
