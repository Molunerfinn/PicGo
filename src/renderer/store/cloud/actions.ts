import { useCloudStore } from './store'

export const cloudStoreActions = {
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
  }
}
