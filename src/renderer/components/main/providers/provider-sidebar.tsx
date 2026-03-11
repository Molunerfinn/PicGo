import { LoaderCircleIcon, PuzzleIcon } from "lucide-react"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { providerStoreActions, useAppStore, useProviderStore } from "@/store"
import { ProviderSidebarSearch } from "./provider-sidebar-search"
import { ProviderSidebarUploaderSection } from "./provider-sidebar-uploader-section"
import {
  emptyProviderConfigMap,
  resolveErrorMessage,
  resolveProviderSelectionState,
  resolveSelectableConfigId,
} from "./utils"
import type {
  ProviderDraftConfigItem,
  ProviderUploaderConfigItem,
  ProviderUploaderSummary,
} from "./types"

interface ProviderSidebarProps {
  draftConfigMap: Record<string, ProviderDraftConfigItem | undefined>
  onCreateIntent: (uploaderId: string) => void
  onRenameIntent: (uploaderId: string, configId: string, configName: string) => void
  onCopyIntent: (uploaderId: string, configId: string, configName: string) => void
  onDeleteIntent: (uploaderId: string, configId: string) => void
}

interface FilteredUploaderItem {
  uploader: ProviderUploaderSummary
  persistedConfigs: ProviderUploaderConfigItem[]
  visibleConfigs: Array<ProviderUploaderConfigItem | ProviderDraftConfigItem>
  defaultConfigId: string | undefined
  isLoadingConfigs: boolean
}

export function ProviderSidebar({
  draftConfigMap,
  onCreateIntent,
  onRenameIntent,
  onCopyIntent,
  onDeleteIntent,
}: ProviderSidebarProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const search = useSearch({ from: "/main/providers" })

  const appConfig = useAppStore.use.appConfig()
  const providers = useAppStore.use.providers()
  const loadingMap = useProviderStore.use.isLoadingByProvider()
  const isLoadingUploaders = useProviderStore.use.isHydrating()
  const searchValue = useProviderStore.use.searchValue()
  const expandedUploaderIds = useProviderStore.use.expandedProviderIds()

  const queriedUploaderId = search.uploader ?? null
  const queriedConfigId = search.configId ?? null
  const configMap = appConfig?.uploader ?? emptyProviderConfigMap
  const uploaders = providers.filter((provider) => provider.visible)
  const { selectedUploaderId, selectedConfigId } = resolveProviderSelectionState({
    queriedUploaderId,
    queriedConfigId,
    appConfigUploaderId: appConfig?.picBed.uploader,
    visibleProviders: uploaders,
    configMap,
    draftConfigMap,
  })

  const normalizedSearch = searchValue.trim().toLowerCase()
  const hasSearch = normalizedSearch.length > 0

  const navigateToSelection = (
    uploaderId: string | undefined,
    configId: string | undefined
  ) => {
    navigate({
      to: "/main/providers",
      search: (prev) => ({
        ...prev,
        uploader: uploaderId,
        configId,
      }),
    })
  }

  const handleSelectUploader = (uploaderId: string) => {
    const nextConfigId = resolveSelectableConfigId(
      configMap[uploaderId],
      draftConfigMap[uploaderId],
      null
    )

    providerStoreActions.ensureExpanded(uploaderId)
    navigateToSelection(uploaderId, nextConfigId ?? undefined)
  }

  const handleSelectConfig = (uploaderId: string, configId: string) => {
    navigateToSelection(uploaderId, configId)
  }

  const handleSetDefaultUploader = async (uploaderId: string) => {
    try {
      await providerStoreActions.setDefaultProvider(uploaderId)
      toast.success(t("SUCCESS"))
    } catch (error) {
      toast.error(resolveErrorMessage(error, t("FAILED")))
    }
  }

  const filteredUploaders: FilteredUploaderItem[] = uploaders.flatMap((uploader) => {
    const configState = configMap[uploader.id]
    const persistedConfigs = configState?.configList ?? []
    const draftConfig = draftConfigMap[uploader.id]
    const allConfigs = draftConfig ? [...persistedConfigs, draftConfig] : persistedConfigs

    if (!hasSearch) {
      return [
        {
          uploader,
          persistedConfigs,
          visibleConfigs: allConfigs,
          defaultConfigId: configState?.defaultId,
          isLoadingConfigs: Boolean(loadingMap[uploader.id]),
        },
      ]
    }

    const matchedUploaderName = uploader.name.toLowerCase().includes(normalizedSearch)

    if (matchedUploaderName) {
      return [
        {
          uploader,
          persistedConfigs,
          visibleConfigs: allConfigs,
          defaultConfigId: configState?.defaultId,
          isLoadingConfigs: Boolean(loadingMap[uploader.id]),
        },
      ]
    }

    const matchedConfigs = allConfigs.filter((config) =>
      config._configName.toLowerCase().includes(normalizedSearch)
    )

    if (matchedConfigs.length === 0) {
      return []
    }

    return [
      {
        uploader,
        persistedConfigs,
        visibleConfigs: matchedConfigs,
        defaultConfigId: configState?.defaultId,
        isLoadingConfigs: Boolean(loadingMap[uploader.id]),
      },
    ]
  })

  return (
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border flex w-(--app-provider-sidebar-width) shrink-0 flex-col overflow-hidden rounded-xl border backdrop-blur-xl">
      <div className="border-sidebar-border/60 flex flex-col gap-3 border-b px-4 py-4">
        <h1 className="text-base font-semibold">{t("GALLERY_PROVIDERS")}</h1>
        <ProviderSidebarSearch />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="relative p-2">
          <div className="space-y-1" aria-busy={isLoadingUploaders}>
            {!isLoadingUploaders && filteredUploaders.length === 0 ? (
              <div className="text-muted-foreground px-3 py-10 text-center text-sm">
                {t("PROVIDER_SIDEBAR_EMPTY")}
              </div>
            ) : null}

            {filteredUploaders.map((item) => (
              <ProviderSidebarUploaderSection
                key={item.uploader.id}
                uploader={item.uploader}
                persistedConfigs={item.persistedConfigs}
                visibleConfigs={item.visibleConfigs}
                defaultConfigId={item.defaultConfigId}
                isLoadingConfigs={item.isLoadingConfigs}
                isActiveUploader={item.uploader.id === selectedUploaderId}
                isExpanded={hasSearch || expandedUploaderIds.includes(item.uploader.id)}
                hasSearch={hasSearch}
                selectedConfigId={selectedConfigId}
                onSelectUploader={handleSelectUploader}
                onSetDefaultUploader={handleSetDefaultUploader}
                onSelectConfig={handleSelectConfig}
                onCreateIntent={onCreateIntent}
                onRenameIntent={onRenameIntent}
                onCopyIntent={onCopyIntent}
                onDeleteIntent={onDeleteIntent}
              />
            ))}
          </div>

          {isLoadingUploaders ? (
            <div className="absolute inset-2 z-10 flex items-center justify-center rounded-lg bg-(--app-provider-sidebar-loading-overlay) backdrop-blur-(--app-provider-sidebar-loading-backdrop-blur)">
              <LoaderCircleIcon
                className="size-5 animate-spin text-(--app-provider-sidebar-loading-spinner)"
                aria-hidden
              />
            </div>
          ) : null}
        </div>
      </ScrollArea>

      <div className="border-sidebar-border/60 border-t px-4 py-3">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => navigate({ to: "/main/plugins" })}
        >
          <PuzzleIcon className="size-4" />
          <span>{t("PROVIDER_INSTALL_MORE_UPLOADERS")}</span>
        </Button>
      </div>
    </aside>
  )
}
