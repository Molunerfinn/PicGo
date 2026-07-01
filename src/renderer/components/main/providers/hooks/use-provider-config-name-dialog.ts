import { useState } from "react"

import type { ValueOf } from "@/types/utils"
export const providerConfigNameActionMode = {
  Create: "create",
  Rename: "rename",
  Copy: "copy",
} as const

export type ProviderConfigNameActionMode =
  ValueOf<typeof providerConfigNameActionMode>

export interface ProviderConfigNameDialogState {
  mode: ProviderConfigNameActionMode
  uploaderId: string
  configId?: string
  name: string
}

interface ProviderConfigNameSubmitHandlers {
  onCreate: (uploaderId: string, configName: string) => Promise<void> | void
  onRename: (
    uploaderId: string,
    configId: string,
    configName: string
  ) => Promise<void> | void
  onCopy: (
    uploaderId: string,
    configId: string,
    configName: string
  ) => Promise<void> | void
  onEmptyName?: () => void
}

export function useProviderConfigNameDialog() {
  const [dialogState, setDialogState] = useState<ProviderConfigNameDialogState | null>(
    null
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const closeDialog = () => {
    if (isSubmitting) return
    setDialogState(null)
  }

  const openCreateDialog = (uploaderId: string, initialName = "New Config") => {
    setDialogState({
      mode: providerConfigNameActionMode.Create,
      uploaderId,
      name: initialName,
    })
  }

  const openRenameDialog = (
    uploaderId: string,
    configId: string,
    initialName: string
  ) => {
    setDialogState({
      mode: providerConfigNameActionMode.Rename,
      uploaderId,
      configId,
      name: initialName,
    })
  }

  const openCopyDialog = (
    uploaderId: string,
    configId: string,
    initialName: string
  ) => {
    setDialogState({
      mode: providerConfigNameActionMode.Copy,
      uploaderId,
      configId,
      name: initialName,
    })
  }

  const setDialogName = (name: string) => {
    setDialogState((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        name,
      }
    })
  }

  const submitDialog = async (handlers: ProviderConfigNameSubmitHandlers) => {
    if (!dialogState) return false

    const nextName = dialogState.name.trim()

    if (!nextName) {
      handlers.onEmptyName?.()
      return false
    }

    try {
      setIsSubmitting(true)

      if (dialogState.mode === providerConfigNameActionMode.Create) {
        await handlers.onCreate(dialogState.uploaderId, nextName)
      }

      if (
        dialogState.mode === providerConfigNameActionMode.Rename &&
        dialogState.configId
      ) {
        await handlers.onRename(dialogState.uploaderId, dialogState.configId, nextName)
      }

      if (dialogState.mode === providerConfigNameActionMode.Copy && dialogState.configId) {
        await handlers.onCopy(dialogState.uploaderId, dialogState.configId, nextName)
      }

      setDialogState(null)
      return true
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    dialogState,
    isSubmitting,
    openCreateDialog,
    openRenameDialog,
    openCopyDialog,
    closeDialog,
    setDialogName,
    submitDialog,
  }
}
