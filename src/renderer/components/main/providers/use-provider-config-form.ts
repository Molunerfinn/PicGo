import { useCallback, useEffect, useMemo, useState } from "react"

import { pluginsAdapter } from "@/adapters/plugins"
import {
  usePluginConfigRefresh,
  type RefreshConfigSchemaTarget,
} from "@/components/common/use-plugin-config-refresh"
import type { SchemaFieldErrorMap } from "@/components/common/schema-form-fields"
import type {
  ProviderDraftConfigItem,
  ProviderPluginConfig,
  ProviderUploaderConfigItem,
} from "./types"
import {
  buildFormValues,
  isRequiredFieldValueMissing,
  type ProviderFormValues,
} from "./utils"

interface UseProviderConfigFormParams {
  selectedUploaderId: string | null
  selectedConfigId: string | null
  isDraftSelected: boolean
  selectedConfig: ProviderUploaderConfigItem | ProviderDraftConfigItem | null
  storedSchema: ProviderPluginConfig[]
  onDraftFieldChange: (uploaderId: string, name: string, value: unknown) => void
}

export interface ProviderConfigFormState {
  schema: ProviderPluginConfig[]
  values: ProviderFormValues
  fieldErrors: SchemaFieldErrorMap
  setFieldErrors: (errors: SchemaFieldErrorMap) => void
  handleValueChange: (name: string, value: unknown) => void
  isReady: boolean
}

// Owns the form lifecycle for the currently-selected (uploader, config):
//   - hydrates `values` from the persisted config when the selection changes
//   - kicks off a one-shot schema sync RPC so reactive `choices(answers)` /
//     `default(answers)` reflect the saved upstream values (fixes the
//     page-refresh bucket-cleared bug — main initially evaluates schema with
//     empty answers so downstream choices don't include saved values)
//   - wires `usePluginConfigRefresh` for user-driven cascades
//   - propagates field edits back to the parent's draft tracker (when on a
//     draft) and clears per-field error messages on valid input
//
// `isReady` is false while the initial sync is in flight; the parent uses
// this to gate the cascade hook (no spurious refresh while the schema is
// catching up to saved values).
export function useProviderConfigForm({
  selectedUploaderId,
  selectedConfigId,
  isDraftSelected,
  selectedConfig,
  storedSchema,
  onDraftFieldChange,
}: UseProviderConfigFormParams): ProviderConfigFormState {
  const [values, setValues] = useState<ProviderFormValues>({})
  const [fieldErrors, setFieldErrors] = useState<SchemaFieldErrorMap>({})
  const [liveSchema, setLiveSchema] = useState<ProviderPluginConfig[]>([])
  const [isHydrating, setIsHydrating] = useState(false)

  const schema = liveSchema.length > 0 ? liveSchema : storedSchema

  const target = useMemo<RefreshConfigSchemaTarget>(
    () => ({ target: "uploader", uploaderName: selectedUploaderId ?? "" }),
    [selectedUploaderId]
  )

  const fetchSchema = useCallback(
    async (
      refreshTarget: RefreshConfigSchemaTarget,
      draftValues: Record<string, unknown>
    ): Promise<ProviderPluginConfig[]> => {
      if (refreshTarget.target !== "uploader") return []
      return pluginsAdapter.refreshConfigSchema({
        target: "uploader",
        uploaderName: refreshTarget.uploaderName,
        draftValues,
      })
    },
    []
  )

  // Re-hydrate when the persisted config's _updatedAt changes (initial load,
  // selection switch, or save). Depending on the object reference would also
  // re-fire on unrelated zustand re-emissions for the same id; the timestamp
  // is the meaningful signal. Draft edits don't bump _updatedAt — they're
  // tracked in the parent's draft map instead.
  const persistedRev =
    selectedConfig && !isDraftSelected
      ? (selectedConfig as ProviderUploaderConfigItem)._updatedAt
      : null

  useEffect(() => {
    if (!selectedUploaderId || storedSchema.length === 0 || !selectedConfig) {
      setValues({})
      setFieldErrors({})
      setLiveSchema((prev) => (prev.length === 0 ? prev : []))
      setIsHydrating(false)
      return
    }

    const hydrated = buildFormValues(storedSchema, selectedConfig)
    setValues(hydrated)
    setFieldErrors({})
    setLiveSchema((prev) => (prev.length === 0 ? prev : []))
    setIsHydrating(true)

    let cancelled = false
    fetchSchema(target, hydrated)
      .then((nextSchema) => {
        if (cancelled) return
        setLiveSchema(nextSchema)
      })
      .catch((error) => {
        if (cancelled) return
        console.warn("[provider-config] initial schema sync failed", error)
      })
      .finally(() => {
        if (cancelled) return
        setIsHydrating(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedSchema, selectedConfigId, selectedUploaderId, persistedRev])

  usePluginConfigRefresh({
    enabled: Boolean(
      selectedUploaderId && schema.length > 0 && selectedConfig && !isHydrating
    ),
    target,
    currentSchema: schema,
    currentValues: values,
    fetchSchema,
    onSchemaUpdate: (nextSchema, nextValues) => {
      setLiveSchema(nextSchema)
      setValues(nextValues)
    },
  })

  const handleValueChange = useCallback(
    (name: string, value: unknown) => {
      setValues((prev) => ({ ...prev, [name]: value }))

      setFieldErrors((prev) => {
        if (!prev[name]) return prev
        const field = schema.find((f) => f.name === name)
        if (field?.required && isRequiredFieldValueMissing(value)) return prev
        const next = { ...prev }
        delete next[name]
        return next
      })

      if (selectedUploaderId && isDraftSelected) {
        onDraftFieldChange(selectedUploaderId, name, value)
      }
    },
    [schema, selectedUploaderId, isDraftSelected, onDraftFieldChange]
  )

  return {
    schema,
    values,
    fieldErrors,
    setFieldErrors,
    handleValueChange,
    isReady: !isHydrating,
  }
}
