import { useCallback, useEffect, useMemo, useState } from "react"

import { pluginsAdapter } from "@/adapters/plugins"
import {
  usePluginConfigRefresh,
  type RefreshConfigSchemaTarget,
} from "@/components/common/use-plugin-config-refresh"
import type {
  SchemaFieldErrorMap,
  SchemaFormValues,
} from "@/components/common/schema-form-fields"
import { buildFormValues, isRequiredFieldValueMissing } from "@/components/main/providers/utils"
import type { ProviderPluginConfig } from "@/components/main/providers/types"

export type PluginConfigSectionTarget =
  | { target: "plugin"; pluginFullName: string }
  | { target: "transformer"; pluginFullName: string }

interface UsePluginConfigSectionParams {
  enabled: boolean
  pluginFullName: string | null
  target: PluginConfigSectionTarget
  // Schema as evaluated by main on startup (synthAnswers={}); the hook
  // syncs it against the saved values on hydration.
  initialSchema: ProviderPluginConfig[]
  // Values previously saved for this section (`appConfig.plugins[fullName]`
  // for the Config tab, `appConfig.transformer[name]` for the Transformer
  // tab). Reference identity drives the hydration trigger — changes here
  // mean the persisted config changed (save, refresh, tab switch).
  storedValues: Record<string, unknown>
}

export interface PluginConfigSectionState {
  schema: ProviderPluginConfig[]
  values: SchemaFormValues
  fieldErrors: SchemaFieldErrorMap
  setFieldErrors: (errors: SchemaFieldErrorMap) => void
  handleValueChange: (name: string, value: unknown) => void
  isReady: boolean
}

// Mirror of useProviderConfigForm for plugin / transformer config tabs.
// Hydrates the form from `storedValues`, kicks off a one-shot schema sync
// against those values so reactive choices/defaults reflect the saved
// upstream values (otherwise selecting mode=advanced and saving would
// leave verbosity.choices stuck on basic-state and the saved value would
// not appear in the Select). The cascade hook is disabled while syncing
// so it doesn't snapshot the hydrating values as a spurious baseline.
export function usePluginConfigSection({
  enabled,
  pluginFullName,
  target,
  initialSchema,
  storedValues,
}: UsePluginConfigSectionParams): PluginConfigSectionState {
  const [values, setValues] = useState<SchemaFormValues>({})
  const [fieldErrors, setFieldErrors] = useState<SchemaFieldErrorMap>({})
  const [liveSchema, setLiveSchema] = useState<ProviderPluginConfig[]>([])
  const [isHydrating, setIsHydrating] = useState(false)

  const schema = liveSchema.length > 0 ? liveSchema : initialSchema

  const refreshTarget = useMemo<RefreshConfigSchemaTarget>(
    () => target,
    // Object identity changes per render; depend on its discriminator + key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [target.target, target.pluginFullName]
  )

  const fetchSchema = useCallback(
    async (
      next: RefreshConfigSchemaTarget,
      draftValues: Record<string, unknown>
    ): Promise<ProviderPluginConfig[]> => {
      if (next.target === "plugin") {
        return pluginsAdapter.refreshConfigSchema({
          target: "plugin",
          pluginFullName: next.pluginFullName,
          draftValues,
        })
      }
      if (next.target === "transformer") {
        return pluginsAdapter.refreshConfigSchema({
          target: "transformer",
          pluginFullName: next.pluginFullName,
          draftValues,
        })
      }
      return []
    },
    []
  )

  useEffect(() => {
    if (!pluginFullName || initialSchema.length === 0) {
      setValues({})
      setFieldErrors({})
      setLiveSchema((prev) => (prev.length === 0 ? prev : []))
      setIsHydrating(false)
      return
    }

    const hydrated = buildFormValues(
      initialSchema,
      { _id: "", _configName: "", _createdAt: 0, _updatedAt: 0, ...storedValues } as never
    )
    setValues(hydrated)
    setFieldErrors({})
    setLiveSchema((prev) => (prev.length === 0 ? prev : []))
    setIsHydrating(true)

    let cancelled = false
    fetchSchema(refreshTarget, hydrated)
      .then((nextSchema) => {
        if (cancelled) return
        if (nextSchema.length > 0) {
          setLiveSchema(nextSchema)
        }
      })
      .catch((error) => {
        if (cancelled) return
        console.warn("[plugin-config] initial schema sync failed", error)
      })
      .finally(() => {
        if (cancelled) return
        setIsHydrating(false)
      })

    return () => {
      cancelled = true
    }
  }, [initialSchema, storedValues, pluginFullName, refreshTarget, fetchSchema])

  usePluginConfigRefresh({
    enabled: enabled && !isHydrating && schema.length > 0 && Boolean(pluginFullName),
    target: refreshTarget,
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
    },
    [schema]
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
