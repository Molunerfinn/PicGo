import { useEffect, useState, type Dispatch, type SetStateAction } from "react"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { LoaderCircleIcon, PlusIcon, SaveIcon, Trash2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { AppMainCard } from "@/components/common/app-main-card"
import { MainCardHeader } from "@/components/common/main-card-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { useAppStore } from "@/store"
import {
  ProviderActiveUploaderBadge,
  ProviderDefaultConfigBadge,
} from "./provider-status-badges"
import { ProviderFormFields, type ProviderFieldErrorMap } from "./provider-form-fields"
import type {
  ProviderDraftConfigItem,
  ProviderPluginConfig,
  ProviderUploaderConfigItem,
} from "./types"
import {
  buildFormValues,
  emptyProviderConfigMap,
  emptyProviderSchema,
  formatConfigUpdatedAt,
  isRequiredFieldValueMissing,
  resolveErrorMessage,
  resolveProviderSelectionState,
  validateRequiredFields,
  type ProviderFormValues,
} from "./utils"

interface ProviderConfigPanelProps {
  draftConfigMap: Record<string, ProviderDraftConfigItem | undefined>
  setDraftConfigMap: Dispatch<
    SetStateAction<Record<string, ProviderDraftConfigItem | undefined>>
  >
  onCreateConfigIntent: (uploaderId: string) => void
  onDeleteConfigIntent: (uploaderId: string, configId: string) => void
}

export function ProviderConfigPanel({
  draftConfigMap,
  setDraftConfigMap,
  onCreateConfigIntent,
  onDeleteConfigIntent,
}: ProviderConfigPanelProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const search = useSearch({ from: "/main/providers" })

  const appConfig = useAppStore((state) => state.appConfig)
  const providers = useAppStore((state) => state.providers)
  const providerSchemas = useAppStore((state) => state.providerSchemas)
  const loadingMap = useAppStore((state) => state.providerPage.isLoadingByProvider)
  const setDefaultConfig = useAppStore((state) => state.setDefaultConfig)
  const createConfig = useAppStore((state) => state.createConfig)
  const saveConfig = useAppStore((state) => state.saveConfig)

  const [formValues, setFormValues] = useState<ProviderFormValues>({})
  const [fieldErrors, setFieldErrors] = useState<ProviderFieldErrorMap>({})
  const [isSaving, setIsSaving] = useState(false)

  const queriedUploaderId = search.uploader ?? null
  const queriedConfigId = search.configId ?? null
  const configMap = appConfig?.uploader ?? emptyProviderConfigMap
  const visibleProviders = providers.filter((provider) => provider.visible)
  const { selectedUploaderId, selectedConfigId } = resolveProviderSelectionState({
    queriedUploaderId,
    queriedConfigId,
    appConfigUploaderId: appConfig?.picBed.uploader,
    visibleProviders,
    configMap,
    draftConfigMap,
  })
  const uploader =
    visibleProviders.find((provider) => provider.id === selectedUploaderId) ?? null
  const activeConfigState = selectedUploaderId ? configMap[selectedUploaderId] : undefined
  const schema: ProviderPluginConfig[] = selectedUploaderId
    ? providerSchemas[selectedUploaderId]?.config ?? emptyProviderSchema
    : emptyProviderSchema
  const activeDraftConfig = selectedUploaderId
    ? draftConfigMap[selectedUploaderId] ?? null
    : null
  const selectedPersistedConfig: ProviderUploaderConfigItem | null =
    activeConfigState?.configList.find((item) => item._id === selectedConfigId) ?? null
  const selectedConfig =
    selectedPersistedConfig ??
    (activeDraftConfig && selectedConfigId === activeDraftConfig._id
      ? activeDraftConfig
      : null)
  const isDraftSelected =
    Boolean(activeDraftConfig) && selectedConfigId === activeDraftConfig?._id
  const isLoading =
    selectedUploaderId !== null && Boolean(loadingMap[selectedUploaderId])
  const canDelete = isDraftSelected
    ? true
    : (activeConfigState?.configList.length ?? 0) > 1
  const isDefaultConfig =
    Boolean(selectedPersistedConfig) &&
    activeConfigState?.defaultId === selectedPersistedConfig?._id

  // Rebuild editable form values whenever URL-selected uploader/config changes.
  useEffect(() => {
    if (!selectedUploaderId) {
      setFormValues({})
      setFieldErrors({})
      return
    }

    setFormValues(buildFormValues(schema, selectedConfig))
    setFieldErrors({})
  }, [schema, selectedConfig, selectedUploaderId])

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

  const handleSetDefaultConfig = async () => {
    if (!selectedUploaderId || !selectedPersistedConfig) {
      return
    }

    try {
      const selectedId = await setDefaultConfig(
        selectedUploaderId,
        selectedPersistedConfig._id
      )

      navigateToSelection(selectedUploaderId, selectedId ?? undefined)
      toast.success(t("SUCCESS"))
    } catch (error) {
      toast.error(resolveErrorMessage(error, t("FAILED")))
    }
  }

  const resolveFieldLabel = (fieldName: string) => {
    const targetField = schema.find((field) => field.name === fieldName)
    return targetField?.alias || targetField?.name || fieldName
  }

  const handleSave = async () => {
    if (!selectedUploaderId || !selectedConfig) {
      return
    }

    const missingRequiredFields = validateRequiredFields(schema, formValues)

    if (missingRequiredFields.length > 0) {
      const nextFieldErrors: ProviderFieldErrorMap = {}

      missingRequiredFields.forEach((fieldName) => {
        nextFieldErrors[fieldName] = t("FIELD_IS_REQUIRED", {
          field: resolveFieldLabel(fieldName),
        })
      })

      setFieldErrors(nextFieldErrors)
      toast.error(t("FAILED"))
      return
    }

    setFieldErrors({})

    try {
      setIsSaving(true)

      if (isDraftSelected) {
        const createdConfigId = await createConfig(
          selectedUploaderId,
          selectedConfig._configName
        )

        if (createdConfigId) {
          await saveConfig(selectedUploaderId, createdConfigId, formValues)
        }

        setDraftConfigMap((prev) => ({
          ...prev,
          [selectedUploaderId]: undefined,
        }))

        navigateToSelection(selectedUploaderId, createdConfigId ?? undefined)
        toast.success(t("SUCCESS"))
        return
      }

      const selectedId = await saveConfig(
        selectedUploaderId,
        selectedConfig._id,
        formValues
      )

      navigateToSelection(selectedUploaderId, selectedId ?? undefined)
      toast.success(t("SUCCESS"))
    } catch (error) {
      toast.error(resolveErrorMessage(error, t("FAILED")))
    } finally {
      setIsSaving(false)
    }
  }

  const handleValueChange = (name: string, value: unknown) => {
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }))

    setFieldErrors((prev) => {
      const currentError = prev[name]

      if (!currentError) {
        return prev
      }

      const targetField = schema.find((field) => field.name === name)

      if (targetField?.required && isRequiredFieldValueMissing(value)) {
        return prev
      }

      const next = { ...prev }
      delete next[name]
      return next
    })

    if (!selectedUploaderId || !isDraftSelected) {
      return
    }

    setDraftConfigMap((prev) => {
      const draftConfig = prev[selectedUploaderId]

      if (!draftConfig || draftConfig._id !== selectedConfigId) {
        return prev
      }

      return {
        ...prev,
        [selectedUploaderId]: {
          ...draftConfig,
          _updatedAt: Date.now(),
          [name]: value,
        },
      }
    })
  }

  const handleCreateConfig = () => {
    if (!selectedUploaderId) {
      return
    }

    onCreateConfigIntent(selectedUploaderId)
  }

  const handleDeleteIntent = () => {
    if (!selectedUploaderId || !selectedConfig) {
      return
    }

    onDeleteConfigIntent(selectedUploaderId, selectedConfig._id)
  }

  return (
    <AppMainCard asChild className="overflow-hidden">
      <main>
        <MainCardHeader
          className="px-6"
          leading={
            <>
              <span className="font-medium">
                {uploader?.name ?? t("GALLERY_PROVIDERS")}
              </span>
              {uploader?.isDefaultUploader ? (
                <ProviderActiveUploaderBadge uploaderName={uploader.name} />
              ) : null}
              {selectedConfig ? (
                <>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-muted-foreground truncate">
                    {selectedConfig._configName}
                  </span>
                  {isDefaultConfig ? (
                    <ProviderDefaultConfigBadge uploaderName={uploader?.name} />
                  ) : null}
                  {isDraftSelected ? (
                    <Badge variant="outline" className="border-dashed">
                      {t("PROVIDER_DRAFT_CONFIG")}
                    </Badge>
                  ) : null}
                </>
              ) : null}
            </>
          }
          trailingClassName="gap-2"
          trailing={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleSetDefaultConfig}
                disabled={
                  !selectedConfig ||
                  isDefaultConfig ||
                  isLoading ||
                  isDraftSelected
                }
              >
                {t("SETTINGS_SET_DEFAULT_CONFIG")}
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={!selectedConfig || isSaving || isLoading}
              >
                {isSaving ? (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                ) : (
                  <SaveIcon className="size-4" />
                )}
                <span>{t("CONFIRM")}</span>
              </Button>
            </>
          }
        />

        <ScrollArea className="min-h-0 flex-1">
          <div className="mx-auto w-full max-w-(--app-provider-content-max-width) px-6 py-6">
            {!uploader && (
              <div className="text-muted-foreground rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm">
                {t("PROVIDER_NO_UPLOADER_SELECTED")}
              </div>
            )}

            {uploader && isLoading && (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            )}

            {uploader && !isLoading && !selectedConfig && (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
                <div className="text-lg font-semibold">{t("PROVIDER_NO_CONFIG_YET")}</div>
                <p className="text-muted-foreground mt-2 max-w-sm text-sm">
                  {t("PROVIDER_NO_CONFIG_DESCRIPTION", {
                    uploaderName: uploader.name,
                  })}
                </p>
                <Button type="button" className="mt-6" onClick={handleCreateConfig}>
                  <PlusIcon className="size-4" />
                  <span>{t("PROVIDER_CREATE_CONFIG")}</span>
                </Button>
              </div>
            )}

            {uploader && !isLoading && selectedConfig && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{t("PROVIDER_CONFIGURATION")}</h2>
                  <span className="text-muted-foreground text-xs">
                    {t("PROVIDER_UPDATED_AT_LABEL")}: {
                      formatConfigUpdatedAt(
                        selectedConfig._updatedAt,
                        i18n.resolvedLanguage
                      )
                    }
                  </span>
                </div>

                <ProviderFormFields
                  schema={schema}
                  values={formValues}
                  fieldErrors={fieldErrors}
                  onValueChange={handleValueChange}
                />

                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-destructive font-medium">{t("DELETE")}</div>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {t("PROVIDER_DELETE_CONFIG_HINT")}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDeleteIntent}
                      disabled={!canDelete}
                    >
                      <Trash2Icon className="size-4" />
                      <span>{t("DELETE")}</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </main>
    </AppMainCard>
  )
}
