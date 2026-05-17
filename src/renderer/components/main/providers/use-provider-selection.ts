import { useSearch } from "@tanstack/react-router"

import { useAppStore, useProviderStore } from "@/store"
import {
  emptyProviderConfigMap,
  emptyProviderSchema,
  resolveProviderSelectionState,
} from "./utils"
import type {
  ProviderDraftConfigItem,
  ProviderPluginConfig,
  ProviderUploaderConfigItem,
  ProviderUploaderConfigList,
  ProviderUploaderSummary,
} from "./types"

export interface ProviderSelection {
  uploader: ProviderUploaderSummary | null
  selectedUploaderId: string | null
  selectedConfigId: string | null
  storedSchema: ProviderPluginConfig[]
  activeConfigState: ProviderUploaderConfigList | undefined
  selectedPersistedConfig: ProviderUploaderConfigItem | null
  selectedConfig: ProviderUploaderConfigItem | ProviderDraftConfigItem | null
  isDraftSelected: boolean
  isDefaultConfig: boolean
  isLoading: boolean
  canDelete: boolean
}

interface UseProviderSelectionParams {
  draftConfigMap: Record<string, ProviderDraftConfigItem | undefined>
}

// Resolve the (uploader, configId) the panel is showing, plus all derived
// flags. Pulls from URL search params + appStore + draftConfigMap.
export function useProviderSelection({
  draftConfigMap,
}: UseProviderSelectionParams): ProviderSelection {
  const search = useSearch({ from: "/main/providers" })
  const appConfig = useAppStore.use.appConfig()
  const providers = useAppStore.use.providers()
  const providerSchemas = useAppStore.use.providerSchemas()
  const loadingMap = useProviderStore.use.isLoadingByProvider()

  const configMap = appConfig?.uploader ?? emptyProviderConfigMap
  const visibleProviders = providers.filter((p) => p.visible !== false)

  const { selectedUploaderId, selectedConfigId } = resolveProviderSelectionState({
    queriedUploaderId: search.uploader ?? null,
    queriedConfigId: search.configId ?? null,
    appConfigUploaderId: appConfig?.picBed.uploader,
    visibleProviders,
    configMap,
    draftConfigMap,
  })

  const uploader =
    visibleProviders.find((p) => p.id === selectedUploaderId) ?? null
  const activeConfigState = selectedUploaderId ? configMap[selectedUploaderId] : undefined
  const storedSchema = selectedUploaderId
    ? providerSchemas[selectedUploaderId]?.config ?? emptyProviderSchema
    : emptyProviderSchema

  const activeDraftConfig = selectedUploaderId
    ? draftConfigMap[selectedUploaderId] ?? null
    : null
  const selectedPersistedConfig =
    activeConfigState?.configList.find((item) => item._id === selectedConfigId) ?? null

  const isDraftSelected =
    activeDraftConfig !== null && selectedConfigId === activeDraftConfig._id
  const selectedConfig = selectedPersistedConfig ?? (isDraftSelected ? activeDraftConfig : null)

  const isDefaultConfig =
    selectedPersistedConfig !== null &&
    activeConfigState?.defaultId === selectedPersistedConfig._id

  return {
    uploader,
    selectedUploaderId,
    selectedConfigId,
    storedSchema,
    activeConfigState,
    selectedPersistedConfig,
    selectedConfig,
    isDraftSelected,
    isDefaultConfig,
    isLoading:
      selectedUploaderId !== null && Boolean(loadingMap[selectedUploaderId]),
    canDelete: isDraftSelected
      ? true
      : (activeConfigState?.configList.length ?? 0) > 1,
  }
}
