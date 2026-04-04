import type { IPicGoCloudConfigSyncState } from '#/types/cloudConfigSync'
import { IPicGoCloudConfigSyncSessionStatus } from '#/types/cloudConfigSync'
import { useCloudStore } from './store'

export const cloudStoreActions = {
  applyConfigSyncState (state: IPicGoCloudConfigSyncState) {
    useCloudStore.setState((draft) => {
      draft.configSyncState = state
      draft.isConflictDialogOpen =
        state.sessionStatus === IPicGoCloudConfigSyncSessionStatus.CONFLICT
    })
  },
  setIsConfigSyncStateLoading (value: boolean) {
    useCloudStore.setState((state) => {
      state.isConfigSyncStateLoading = value
    })
  },
  setIsApplyResolutionLoading (value: boolean) {
    useCloudStore.setState((state) => {
      state.isApplyResolutionLoading = value
    })
  },
  setIsEncryptionMethodUpdating (value: boolean) {
    useCloudStore.setState((state) => {
      state.isEncryptionMethodUpdating = value
    })
  },
  setIsConflictDialogOpen (value: boolean) {
    useCloudStore.setState((state) => {
      state.isConflictDialogOpen = value
    })
  },
  setIsEnableE2EConfirmOpen (value: boolean) {
    useCloudStore.setState((state) => {
      state.isEnableE2EConfirmOpen = value
    })
  },
  setIsRestartPromptOpen (value: boolean) {
    useCloudStore.setState((state) => {
      state.isRestartPromptOpen = value
    })
  },
  setOptimisticSyncing () {
    useCloudStore.setState((state) => {
      state.configSyncState = {
        ...state.configSyncState,
        sessionStatus: IPicGoCloudConfigSyncSessionStatus.SYNCING,
        conflicts: undefined
      }
    })
  }
}
