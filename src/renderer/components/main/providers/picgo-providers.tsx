import { useEffect, useState } from "react"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useAppStore } from "@/store"
import { ProviderConfigNameDialog } from "./provider-config-name-dialog"
import { ProviderConfigPanel } from "./provider-config-panel"
import { ProviderDeleteConfigDialog } from "./provider-delete-config-dialog"
import { ProviderSidebar } from "./provider-sidebar"
import { useProviderConfigNameDialog } from "./hooks/use-provider-config-name-dialog"
import {
  buildFormValues,
  createDraftConfigId,
  emptyProviderConfigMap,
  isProviderSelectionEqual,
  resolveErrorMessage,
  resolveProviderSelectionState,
  type ProviderSelectionQuery,
} from "./utils"
import type {
  ProviderDraftConfigItem,
  ProviderUploaderConfigList,
} from "./types"

interface DeleteTarget {
  uploaderId: string
  configId: string
}

export function PicGoProviders() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const search = useSearch({ from: "/main/providers" })

  const appConfig = useAppStore((state) => state.appConfig)
  const providers = useAppStore((state) => state.providers)
  const providerSchemas = useAppStore((state) => state.providerSchemas)
  const providerPage = useAppStore((state) => state.providerPage)
  const hasHydrated = useAppStore((state) => state.hasHydrated)
  const ensureHydrated = useAppStore((state) => state.ensureHydrated)
  const ensureProviderExpanded = useAppStore(
    (state) => state.ensureProviderExpanded
  )
  const renameConfig = useAppStore((state) => state.renameConfig)
  const copyConfig = useAppStore((state) => state.copyConfig)
  const deleteConfig = useAppStore((state) => state.deleteConfig)

  const [draftConfigMap, setDraftConfigMap] = useState<
    Record<string, ProviderDraftConfigItem | undefined>
  >({})
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  const {
    dialogState,
    isSubmitting: isConfigNameSubmitting,
    openCreateDialog,
    openRenameDialog,
    openCopyDialog,
    closeDialog,
    setDialogName,
    submitDialog,
  } = useProviderConfigNameDialog()

  const queriedUploaderId = search.uploader ?? null
  const queriedConfigId = search.configId ?? null

  const configMap = appConfig?.uploader ?? emptyProviderConfigMap
  const isLoadingUploaders = providerPage.isHydrating
  const visibleProviders = providers.filter((provider) => provider.visible)

  const { selectedUploaderId, selectedConfigId } = resolveProviderSelectionState({
    queriedUploaderId,
    queriedConfigId,
    appConfigUploaderId: appConfig?.picBed.uploader,
    visibleProviders,
    configMap,
    draftConfigMap,
  })

  const navigateToSelection = (
    itemQuery: ProviderSelectionQuery,
    options?: {
      replace?: boolean
    }
  ) => {
    navigate({
      to: "/main/providers",
      search: (prev) => ({
        ...prev,
        uploader: itemQuery.uploader,
        configId: itemQuery.configId,
      }),
      replace: options?.replace,
    })
  }

  // Hydrate provider state once so Providers and Dashboard always share one source.
  useEffect(() => {
    let isDisposed = false

    async function bootstrap() {
      try {
        await ensureHydrated()
      } catch (error) {
        if (!isDisposed) {
          toast.error(resolveErrorMessage(error, t("FAILED")))
        }
      }
    }

    bootstrap()

    return () => {
      isDisposed = true
    }
  }, [ensureHydrated, t])

  // Canonicalize URL selection after hydration so URL remains the single source of truth.
  useEffect(() => {
    if (!hasHydrated || isLoadingUploaders) {
      return
    }

    if (selectedUploaderId && !configMap[selectedUploaderId]) {
      return
    }

    const currentQuery: ProviderSelectionQuery = {
      uploader: queriedUploaderId ?? undefined,
      configId: queriedConfigId ?? undefined,
    }
    const canonicalQuery: ProviderSelectionQuery = {
      uploader: selectedUploaderId ?? undefined,
      configId: selectedConfigId ?? undefined,
    }

    if (isProviderSelectionEqual(currentQuery, canonicalQuery)) {
      return
    }

    navigate({
      to: "/main/providers",
      search: (prev) => ({
        ...prev,
        uploader: canonicalQuery.uploader,
        configId: canonicalQuery.configId,
      }),
      replace: true,
    })
  }, [
    configMap,
    hasHydrated,
    isLoadingUploaders,
    navigate,
    queriedConfigId,
    queriedUploaderId,
    selectedConfigId,
    selectedUploaderId,
  ])

  // Keep the active uploader expanded so users can always see the selected config.
  useEffect(() => {
    if (!selectedUploaderId) {
      return
    }

    ensureProviderExpanded(selectedUploaderId)
  }, [ensureProviderExpanded, selectedUploaderId])

  const handleCreateConfigDraft = async (uploaderId: string, configName: string) => {
    try {
      const resolvedSchema = providerSchemas[uploaderId]?.config

      if (!resolvedSchema) {
        toast.error(t("FAILED"))
        return
      }

      const now = Date.now()
      const draftId = createDraftConfigId(uploaderId)
      const draftValues = buildFormValues(resolvedSchema)

      const draftConfig: ProviderDraftConfigItem = {
        _id: draftId,
        _configName: configName,
        _createdAt: now,
        _updatedAt: now,
        _isDraft: true,
        ...draftValues,
      }

      setDraftConfigMap((prev) => ({
        ...prev,
        [uploaderId]: draftConfig,
      }))

      ensureProviderExpanded(uploaderId)
      navigateToSelection({
        uploader: uploaderId,
        configId: draftId,
      })
      toast.success(t("SUCCESS"))
    } catch (error) {
      toast.error(resolveErrorMessage(error, t("FAILED")))
    }
  }

  const handleRenameConfig = async (
    uploaderId: string,
    configId: string,
    configName: string
  ) => {
    const draftConfig = draftConfigMap[uploaderId]

    if (draftConfig && draftConfig._id === configId) {
      setDraftConfigMap((prev) => ({
        ...prev,
        [uploaderId]: {
          ...draftConfig,
          _configName: configName,
          _updatedAt: Date.now(),
        },
      }))
      toast.success(t("SUCCESS"))
      return
    }

    try {
      await renameConfig(uploaderId, configId, configName)
      toast.success(t("SUCCESS"))
    } catch (error) {
      toast.error(resolveErrorMessage(error, t("FAILED")))
    }
  }

  const handleCopyConfig = async (
    uploaderId: string,
    configId: string,
    configName: string
  ) => {
    try {
      const selectedId = await copyConfig(uploaderId, configId, configName)

      navigateToSelection({
        uploader: uploaderId,
        configId: selectedId ?? undefined,
      })
      toast.success(t("SUCCESS"))
    } catch (error) {
      toast.error(resolveErrorMessage(error, t("FAILED")))
    }
  }

  const handleDeleteConfig = async () => {
    if (!deleteTarget) {
      return
    }

    const { uploaderId, configId } = deleteTarget
    const draftConfig = draftConfigMap[uploaderId]

    if (draftConfig && draftConfig._id === configId) {
      const configState: ProviderUploaderConfigList | undefined = configMap[uploaderId]
      const fallbackConfigId =
        configState?.defaultId || configState?.configList[0]?._id || null

      setDraftConfigMap((prev) => ({
        ...prev,
        [uploaderId]: undefined,
      }))

      navigateToSelection({
        uploader: uploaderId,
        configId: fallbackConfigId ?? undefined,
      })
      setDeleteTarget(null)
      toast.success(t("SUCCESS"))
      return
    }

    try {
      const selectedId = await deleteConfig(uploaderId, configId)

      navigateToSelection({
        uploader: uploaderId,
        configId: selectedId ?? undefined,
      })
      toast.success(t("SUCCESS"))
    } catch (error) {
      const message = resolveErrorMessage(error, t("FAILED"))

      if (message.includes("last config")) {
        toast.error(t("TIPS_UPLOADER_CONFIG_CANNOT_DELETE_LAST"))
      } else {
        toast.error(message)
      }
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleSubmitConfigNameDialog = async () => {
    await submitDialog({
      onCreate: handleCreateConfigDraft,
      onRename: handleRenameConfig,
      onCopy: handleCopyConfig,
      onEmptyName: () => {
        toast.warning(t("TIPS_UPLOADER_CONFIG_NAME_EMPTY"))
      },
    })
  }

  return (
    <>
      <ProviderSidebar
        draftConfigMap={draftConfigMap}
        onCreateIntent={(uploaderId) => openCreateDialog(uploaderId)}
        onRenameIntent={openRenameDialog}
        onCopyIntent={(uploaderId, configId, configName) =>
          openCopyDialog(uploaderId, configId, `${configName} - Copy`)
        }
        onDeleteIntent={(uploaderId, configId) => {
          setDeleteTarget({
            uploaderId,
            configId,
          })
        }}
      />

      <ProviderConfigPanel
        draftConfigMap={draftConfigMap}
        setDraftConfigMap={setDraftConfigMap}
        onCreateConfigIntent={(uploaderId) => openCreateDialog(uploaderId)}
        onDeleteConfigIntent={(uploaderId, configId) => {
          setDeleteTarget({
            uploaderId,
            configId,
          })
        }}
      />

      <ProviderConfigNameDialog
        state={dialogState}
        isSubmitting={isConfigNameSubmitting}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog()
          }
        }}
        onNameChange={setDialogName}
        onSubmit={handleSubmitConfigNameDialog}
      />

      <ProviderDeleteConfigDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
        onConfirm={handleDeleteConfig}
      />
    </>
  )
}
