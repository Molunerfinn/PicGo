import { useEffect, useState, type Dispatch, type SetStateAction } from "react"
import { useNavigate } from "@tanstack/react-router"
import { LoaderCircleIcon, PlusIcon, SaveIcon, Trash2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { AppMainCard } from "@/components/common/app-main-card"
import { MainCardHeader } from "@/components/common/main-card-header"
import { filterValuesBySchema } from "@/components/common/merge-plugin-schema"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { providerStoreActions } from "@/store"
import {
  ProviderActiveUploaderBadge,
  ProviderDefaultConfigBadge,
} from "./provider-status-badges"
import { ProviderFormFields } from "./provider-form-fields"
import type { ProviderDraftConfigItem } from "./types"
import {
  formatConfigUpdatedAt,
  resolveErrorMessage,
  validateRequiredFields,
} from "./utils"
import { useProviderSelection } from "./use-provider-selection"
import { useProviderConfigForm } from "./use-provider-config-form"

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
  const { t } = useTranslation()
  const navigate = useNavigate()

  const {
    uploader,
    selectedUploaderId,
    selectedConfigId,
    storedSchema,
    selectedPersistedConfig,
    selectedConfig,
    isDraftSelected,
    isDefaultConfig,
    isLoading,
    canDelete,
  } = useProviderSelection({ draftConfigMap })

  const {
    schema,
    values: formValues,
    fieldErrors,
    setFieldErrors,
    handleValueChange,
  } = useProviderConfigForm({
    selectedUploaderId,
    selectedConfigId,
    isDraftSelected,
    selectedConfig,
    storedSchema,
    onDraftFieldChange: (uploaderId, name, value) => {
      setDraftConfigMap((prev) => {
        const draftConfig = prev[uploaderId]
        if (!draftConfig || draftConfig._id !== selectedConfigId) return prev
        return {
          ...prev,
          [uploaderId]: {
            ...draftConfig,
            _updatedAt: Date.now(),
            [name]: value,
          },
        }
      })
    },
  })

  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!selectedUploaderId) return
    let isDisposed = false

    providerStoreActions
      .ensureSchema(selectedUploaderId)
      .catch((error) => {
        if (isDisposed) return
        toast.error(resolveErrorMessage(error, t("FAILED")))
      })

    return () => {
      isDisposed = true
    }
  }, [selectedUploaderId, t])

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
    if (!selectedUploaderId || !selectedPersistedConfig) return

    try {
      const selectedId = await providerStoreActions.setDefaultConfig(
        selectedUploaderId,
        selectedPersistedConfig._id
      )
      navigateToSelection(selectedUploaderId, selectedId ?? undefined)
      toast.success(t("SUCCESS"))
    } catch (error) {
      toast.error(resolveErrorMessage(error, t("FAILED")))
    }
  }

  const handleSave = async () => {
    if (!selectedUploaderId || !selectedConfig) return

    const missingRequiredFields = validateRequiredFields(schema, formValues)

    if (missingRequiredFields.length > 0) {
      const nextFieldErrors: Record<string, string> = {}
      missingRequiredFields.forEach((fieldName) => {
        const field = schema.find((f) => f.name === fieldName)
        nextFieldErrors[fieldName] = t("FIELD_IS_REQUIRED", {
          field: field?.alias || field?.name || fieldName,
        })
      })
      setFieldErrors(nextFieldErrors)
      toast.error(t("FAILED"))
      return
    }

    setFieldErrors({})
    setIsSaving(true)

    try {
      const filteredValues = filterValuesBySchema(schema, formValues)

      if (isDraftSelected) {
        const createdConfigId = await providerStoreActions.createConfig(
          selectedUploaderId,
          selectedConfig._configName
        )
        if (createdConfigId) {
          await providerStoreActions.saveConfig(
            selectedUploaderId,
            createdConfigId,
            filteredValues
          )
        }
        setDraftConfigMap((prev) => ({
          ...prev,
          [selectedUploaderId]: undefined,
        }))
        navigateToSelection(selectedUploaderId, createdConfigId ?? undefined)
      } else {
        const selectedId = await providerStoreActions.saveConfig(
          selectedUploaderId,
          selectedConfig._id,
          filteredValues
        )
        navigateToSelection(selectedUploaderId, selectedId ?? undefined)
      }

      toast.success(t("SUCCESS"))
    } catch (error) {
      toast.error(resolveErrorMessage(error, t("FAILED")))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AppMainCard asChild className="overflow-hidden">
      <main>
        <MainCardHeader
          className="px-6"
          leading={
            <>
              <span className="font-medium">
                {uploader?.name ?? t("ALBUM_PROVIDERS")}
              </span>
              {uploader?.isDefaultUploader && (
                <ProviderActiveUploaderBadge uploaderName={uploader.name} />
              )}
              {selectedConfig && (
                <>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-muted-foreground truncate">
                    {selectedConfig._configName}
                  </span>
                  {isDefaultConfig && (
                    <ProviderDefaultConfigBadge uploaderName={uploader?.name} />
                  )}
                  {isDraftSelected && (
                    <Badge variant="outline" className="border-dashed">
                      {t("PROVIDER_DRAFT_CONFIG")}
                    </Badge>
                  )}
                </>
              )}
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
                <Button
                  type="button"
                  className="mt-6"
                  onClick={() => onCreateConfigIntent(selectedUploaderId!)}
                >
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
                    {t("PROVIDER_UPDATED_AT_LABEL")}:{" "}
                    {formatConfigUpdatedAt(selectedConfig._updatedAt)}
                  </span>
                </div>

                <ProviderFormFields
                  key={`${selectedUploaderId}:${selectedConfig._id}`}
                  schema={schema}
                  values={formValues}
                  fieldErrors={fieldErrors}
                  allowPasswordReveal={isDraftSelected}
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
                      onClick={() =>
                        onDeleteConfigIntent(selectedUploaderId!, selectedConfig._id)
                      }
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
