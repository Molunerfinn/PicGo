import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { createSelectors } from '@/store/create-selectors'

export interface CloudStoreState {
  isApplyResolutionLoading: boolean
  isEncryptionMethodUpdating: boolean
  isConflictDialogOpen: boolean
  isEnableE2EConfirmOpen: boolean
  isRestartPromptOpen: boolean
}

const initialCloudStoreState: CloudStoreState = {
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
