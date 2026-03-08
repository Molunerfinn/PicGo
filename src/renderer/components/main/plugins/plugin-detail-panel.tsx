import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { AppMainCard } from "@/components/common/app-main-card"
import {
  type SchemaFieldErrorMap,
  type SchemaFormValues,
} from "@/components/common/schema-form-fields"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { buildFormValues, validateRequiredFields } from "@/components/main/providers/utils"
import type { AppConfig, ProviderPluginConfig } from "@/components/main/providers/types"
import { PluginDetailConfigTabContent } from "./plugin-detail-config-tab-content"
import { PluginDetailHeader } from "./plugin-detail-header"
import { PluginDetailReadmeTabContent } from "./plugin-detail-readme-tab-content"
import { PluginDetailTransformerTabContent } from "./plugin-detail-transformer-tab-content"
import {
  pluginDetailTab,
  type PluginDetailSelectedItem,
  type PluginDetailTab,
  type PluginInstalledItem,
  type PluginReadmeState,
} from "./types"
import { resolveConfigValues } from "./utils"

interface PluginDetailPanelProps {
  appConfig: AppConfig | null
  selectedItem: PluginDetailSelectedItem | null
  plugin: PluginInstalledItem | null
  activeTab: PluginDetailTab
  availableTabs: PluginDetailTab[]
  readmeState: PluginReadmeState | null
  isMutating: boolean
  onTabChange: (tab: PluginDetailTab) => void
  onInstallPlugin: (fullName: string) => Promise<void>
  onSaveConfig: (
    fullName: string,
    tab: "config" | "transformer",
    values: Record<string, unknown>
  ) => Promise<void>
  onSetPluginEnabled: (fullName: string, enabled: boolean) => Promise<void>
  onUpdatePlugin: (fullName: string) => Promise<void>
  onUninstallPlugin: (fullName: string) => Promise<void>
}

function resolveFieldLabel(schema: ProviderPluginConfig[], fieldName: string) {
  const targetField = schema.find((field) => field.name === fieldName)
  return targetField?.alias || targetField?.name || fieldName
}

function mergeSchemaValues(
  schema: ProviderPluginConfig[],
  appValues: Record<string, unknown>
) {
  const nextValues = buildFormValues(schema)

  schema.forEach((field) => {
    if (appValues[field.name] !== undefined) {
      nextValues[field.name] = appValues[field.name]
    }
  })

  return nextValues
}

export function PluginDetailPanel({
  appConfig,
  selectedItem,
  plugin,
  activeTab,
  availableTabs,
  readmeState,
  isMutating,
  onTabChange,
  onInstallPlugin,
  onSaveConfig,
  onSetPluginEnabled,
  onUpdatePlugin,
  onUninstallPlugin,
}: PluginDetailPanelProps) {
  const { t } = useTranslation()
  const [configValues, setConfigValues] = useState<SchemaFormValues>({})
  const [transformerValues, setTransformerValues] = useState<SchemaFormValues>({})
  const [configErrors, setConfigErrors] = useState<SchemaFieldErrorMap>({})
  const [transformerErrors, setTransformerErrors] = useState<SchemaFieldErrorMap>({})
  const [isSaving, setIsSaving] = useState(false)

  // Rebuild form values whenever app config or selected plugin changes.
  useEffect(() => {
    if (!plugin) {
      setConfigValues({})
      setTransformerValues({})
      setConfigErrors({})
      setTransformerErrors({})
      return
    }

    const pluginValues = resolveConfigValues(appConfig, plugin, pluginDetailTab.Config)
    const transformerValuesFromState = resolveConfigValues(
      appConfig,
      plugin,
      pluginDetailTab.Transformer
    )

    setConfigValues(mergeSchemaValues(plugin.config.plugin.config, pluginValues))
    setTransformerValues(
      mergeSchemaValues(plugin.config.transformer.config, transformerValuesFromState)
    )
    setConfigErrors({})
    setTransformerErrors({})
  }, [appConfig, plugin])

  const handleTabChange = (value: string) => {
    const nextTab = value as PluginDetailTab

    if (!availableTabs.includes(nextTab)) {
      return
    }

    onTabChange(nextTab)
  }

  const handleSaveConfigTab = async () => {
    if (!plugin) {
      return
    }

    const missingRequiredFields = validateRequiredFields(
      plugin.config.plugin.config,
      configValues
    )

    if (missingRequiredFields.length > 0) {
      const nextErrors: SchemaFieldErrorMap = {}
      missingRequiredFields.forEach((fieldName) => {
        nextErrors[fieldName] = t("FIELD_IS_REQUIRED", {
          field: resolveFieldLabel(plugin.config.plugin.config, fieldName),
        })
      })
      setConfigErrors(nextErrors)
      return
    }

    setConfigErrors({})
    setIsSaving(true)
    try {
      await onSaveConfig(plugin.fullName, "config", configValues)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveTransformerTab = async () => {
    if (!plugin) {
      return
    }

    const missingRequiredFields = validateRequiredFields(
      plugin.config.transformer.config,
      transformerValues
    )

    if (missingRequiredFields.length > 0) {
      const nextErrors: SchemaFieldErrorMap = {}
      missingRequiredFields.forEach((fieldName) => {
        nextErrors[fieldName] = t("FIELD_IS_REQUIRED", {
          field: resolveFieldLabel(plugin.config.transformer.config, fieldName),
        })
      })
      setTransformerErrors(nextErrors)
      return
    }

    setTransformerErrors({})
    setIsSaving(true)
    try {
      await onSaveConfig(plugin.fullName, "transformer", transformerValues)
    } finally {
      setIsSaving(false)
    }
  }

  const tabLabelMap: Record<PluginDetailTab, string> = {
    [pluginDetailTab.Readme]: t("PLUGIN_DETAIL"),
    [pluginDetailTab.Config]: "Config",
    [pluginDetailTab.Transformer]: "Transformer",
  }

  if (!selectedItem) {
    return (
      <AppMainCard asChild className="overflow-hidden">
        <main>
          <PluginDetailHeader
            selectedItem={selectedItem}
            plugin={plugin}
            isMutating={isMutating}
            onInstallPlugin={onInstallPlugin}
            onSetPluginEnabled={onSetPluginEnabled}
            onUpdatePlugin={onUpdatePlugin}
            onUninstallPlugin={onUninstallPlugin}
          />

          <ScrollArea className="min-h-0 flex-1">
            <div className="mx-auto flex w-full max-w-(--app-plugin-content-max-width) px-6 py-6">
              <div className="w-full rounded-lg border border-dashed border-border px-6 py-12 text-center">
                <div className="text-foreground text-base font-medium">{t("PLUGIN_EMPTY")}</div>
                <p className="text-muted-foreground mt-2 text-sm">
                  {t("PLUGIN_EMPTY_DESCRIPTION")}
                </p>
              </div>
            </div>
          </ScrollArea>
        </main>
      </AppMainCard>
    )
  }

  return (
    <AppMainCard asChild className="overflow-hidden">
      <main>
        <PluginDetailHeader
          selectedItem={selectedItem}
          plugin={plugin}
          isMutating={isMutating}
          onInstallPlugin={onInstallPlugin}
          onSetPluginEnabled={onSetPluginEnabled}
          onUpdatePlugin={onUpdatePlugin}
          onUninstallPlugin={onUninstallPlugin}
        />

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="min-h-0 flex-1 gap-0"
        >
          <div className="border-border/60 border-b px-6">
            <div className="flex items-center gap-3">
              <TabsList variant="line" className="gap-5 p-0">
                {availableTabs.map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="h-full! cursor-pointer rounded-none! border-x-0! border-t-0! border-b-2! border-b-transparent! bg-transparent px-0 text-sm font-medium text-muted-foreground shadow-none after:hidden data-[state=active]:-mb-px data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-(--app-plugin-tab-active-color)! data-[state=active]:text-(--app-plugin-tab-active-color)"
                  >
                    {tabLabelMap[tab]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="mx-auto w-full max-w-(--app-plugin-content-max-width) px-6 py-6">
              <TabsContent value={pluginDetailTab.Readme} className="mt-0">
                <PluginDetailReadmeTabContent
                  selectedItem={selectedItem}
                  readmeState={readmeState}
                />
              </TabsContent>

              <TabsContent value={pluginDetailTab.Config} className="mt-0">
                <PluginDetailConfigTabContent
                  plugin={plugin}
                  values={configValues}
                  fieldErrors={configErrors}
                  isSaving={isSaving}
                  isMutating={isMutating}
                  onValueChange={(fieldName, value) => {
                    setConfigValues((prev) => ({
                      ...prev,
                      [fieldName]: value,
                    }))
                  }}
                  onSave={() => {
                    handleSaveConfigTab().catch(() => undefined)
                  }}
                />
              </TabsContent>

              <TabsContent value={pluginDetailTab.Transformer} className="mt-0">
                <PluginDetailTransformerTabContent
                  plugin={plugin}
                  values={transformerValues}
                  fieldErrors={transformerErrors}
                  isSaving={isSaving}
                  isMutating={isMutating}
                  onValueChange={(fieldName, value) => {
                    setTransformerValues((prev) => ({
                      ...prev,
                      [fieldName]: value,
                    }))
                  }}
                  onSave={() => {
                    handleSaveTransformerTab().catch(() => undefined)
                  }}
                />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </main>
    </AppMainCard>
  )
}
