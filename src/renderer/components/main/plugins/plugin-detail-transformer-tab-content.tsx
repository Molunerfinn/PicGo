import { LoaderCircleIcon, SaveIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  SchemaFormFields,
  type SchemaFieldErrorMap,
  type SchemaFormValues,
} from "@/components/common/schema-form-fields"
import { Button } from "@/components/ui/button"
import type { ProviderPluginConfig } from "@/components/main/providers/types"
import type { PluginInstalledItem } from "./types"

interface PluginDetailTransformerTabContentProps {
  plugin: PluginInstalledItem | null
  schema: ProviderPluginConfig[]
  values: SchemaFormValues
  fieldErrors: SchemaFieldErrorMap
  isSaving: boolean
  isMutating: boolean
  onValueChange: (fieldName: string, value: unknown) => void
  onSave: () => void
}

export function PluginDetailTransformerTabContent({
  plugin,
  schema,
  values,
  fieldErrors,
  isSaving,
  isMutating,
  onValueChange,
  onSave,
}: PluginDetailTransformerTabContentProps) {
  const { t } = useTranslation()

  if (!plugin) {
    return null
  }

  if (schema.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm">
        {t("PLUGIN_NO_TRANSFORMER_SCHEMA")}
      </div>
    )
  }

  return (
    <div>
      <SchemaFormFields
        schema={schema}
        values={values}
        fieldErrors={fieldErrors}
        onValueChange={onValueChange}
      />
      <div className="mt-6 flex justify-end">
        <Button type="button" size="sm" onClick={onSave} disabled={isSaving || isMutating}>
          {isSaving ? (
            <LoaderCircleIcon className="size-4 animate-spin" />
          ) : (
            <SaveIcon className="size-4" />
          )}
          <span>{t("CONFIRM")}</span>
        </Button>
      </div>
    </div>
  )
}
