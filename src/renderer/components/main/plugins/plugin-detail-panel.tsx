import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { AppMainCard } from "@/components/common/app-main-card"
import { filterValuesBySchema } from "@/components/common/merge-plugin-schema"
import { pluginStoreActions } from "@/store"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { validateRequiredFields } from "@/components/main/providers/utils"
import type { AppConfig, ProviderPluginConfig } from "@/components/main/providers/types"
import { PluginDetailConfigTabContent } from "./plugin-detail-config-tab-content"
import { PluginDetailHeader } from "./plugin-detail-header"
import { PluginDetailReadmeTabContent } from "./plugin-detail-readme-tab-content"
import { PluginDetailTransformerTabContent } from "./plugin-detail-transformer-tab-content"
import {
  pluginDetailTab,
  pluginReadmeStatus,
  type PluginDetailSelectedItem,
  type PluginDetailTab,
  type PluginInstalledItem,
  type PluginReadmeState,
} from "./types"
import { resolveConfigValues } from "./utils"
import { usePluginConfigSection } from "./use-plugin-config-section"

interface PluginDetailPanelProps {
  appConfig: AppConfig | null
  selectedItem: PluginDetailSelectedItem | null
  plugin: PluginInstalledItem | null
  activeTab: PluginDetailTab
  availableTabs: PluginDetailTab[]
  readmeState: PluginReadmeState | null
  isMutating: boolean
  onTabChange: (tab: PluginDetailTab) => void
}

function resolveFieldLabel(schema: ProviderPluginConfig[], fieldName: string) {
  const field = schema.find((f) => f.name === fieldName)
  return field?.alias || field?.name || fieldName
}

const EMPTY_SCHEMA: ProviderPluginConfig[] = []
const EMPTY_VALUES: Record<string, unknown> = {}

export function PluginDetailPanel({
  appConfig,
  selectedItem,
  plugin,
  activeTab,
  availableTabs,
  readmeState,
  isMutating,
  onTabChange,
}: PluginDetailPanelProps) {
  const { t } = useTranslation()
  const [isSaving, setIsSaving] = useState(false)

  const pluginFullName = plugin?.fullName ?? null
  const initialConfigSchema = plugin?.config.plugin.config ?? EMPTY_SCHEMA
  const initialTransformerSchema = plugin?.config.transformer.config ?? EMPTY_SCHEMA

  // Stable reference for stored values — the hook keys hydration on identity,
  // so we want the same `{}` reference render-to-render when nothing is set.
  const storedConfigValues = useMemo(() => {
    if (!plugin) return EMPTY_VALUES
    return resolveConfigValues(appConfig, plugin, pluginDetailTab.Config) as Record<
      string,
      unknown
    >
  }, [appConfig, plugin])

  const storedTransformerValues = useMemo(() => {
    if (!plugin) return EMPTY_VALUES
    return resolveConfigValues(appConfig, plugin, pluginDetailTab.Transformer) as Record<
      string,
      unknown
    >
  }, [appConfig, plugin])

  const configSection = usePluginConfigSection({
    enabled: Boolean(plugin && activeTab === pluginDetailTab.Config),
    pluginFullName,
    target: { target: "plugin", pluginFullName: pluginFullName ?? "" },
    initialSchema: initialConfigSchema,
    storedValues: storedConfigValues,
  })

  const transformerSection = usePluginConfigSection({
    enabled: Boolean(plugin && activeTab === pluginDetailTab.Transformer),
    pluginFullName,
    target: { target: "transformer", pluginFullName: pluginFullName ?? "" },
    initialSchema: initialTransformerSchema,
    storedValues: storedTransformerValues,
  })

  const handleTabChange = (value: string) => {
    const nextTab = value as PluginDetailTab
    if (!availableTabs.includes(nextTab)) return
    onTabChange(nextTab)
  }

  const handleSaveConfigTab = async () => {
    if (!plugin) return

    const missing = validateRequiredFields(configSection.schema, configSection.values)
    if (missing.length > 0) {
      const errors: Record<string, string> = {}
      missing.forEach((name) => {
        errors[name] = t("FIELD_IS_REQUIRED", {
          field: resolveFieldLabel(configSection.schema, name),
        })
      })
      configSection.setFieldErrors(errors)
      return
    }

    configSection.setFieldErrors({})
    setIsSaving(true)
    try {
      await pluginStoreActions.savePluginConfig(
        plugin.fullName,
        "config",
        filterValuesBySchema(configSection.schema, configSection.values)
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveTransformerTab = async () => {
    if (!plugin) return

    const missing = validateRequiredFields(
      transformerSection.schema,
      transformerSection.values
    )
    if (missing.length > 0) {
      const errors: Record<string, string> = {}
      missing.forEach((name) => {
        errors[name] = t("FIELD_IS_REQUIRED", {
          field: resolveFieldLabel(transformerSection.schema, name),
        })
      })
      transformerSection.setFieldErrors(errors)
      return
    }

    transformerSection.setFieldErrors({})
    setIsSaving(true)
    try {
      await pluginStoreActions.savePluginConfig(
        plugin.fullName,
        "transformer",
        filterValuesBySchema(transformerSection.schema, transformerSection.values)
      )
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
    if (readmeState?.status === pluginReadmeStatus.Loading) {
      return (
        <AppMainCard asChild className="overflow-hidden">
          <main>
            <PluginDetailHeader
              selectedItem={selectedItem}
              plugin={plugin}
              isMutating={isMutating}
            />
            <ScrollArea className="min-h-0 flex-1">
              <div className="mx-auto w-full max-w-(--app-plugin-content-max-width) px-6 py-6">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="size-24 rounded-xl" />
                    <div className="min-w-0 flex-1 space-y-3">
                      <Skeleton className="h-8 w-52" />
                      <Skeleton className="h-5 w-80" />
                      <Skeleton className="h-4 w-36" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-72 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
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
                  schema={configSection.schema}
                  values={configSection.values}
                  fieldErrors={configSection.fieldErrors}
                  isSaving={isSaving}
                  isMutating={isMutating}
                  onValueChange={configSection.handleValueChange}
                  onSave={handleSaveConfigTab}
                />
              </TabsContent>

              <TabsContent value={pluginDetailTab.Transformer} className="mt-0">
                <PluginDetailTransformerTabContent
                  plugin={plugin}
                  schema={transformerSection.schema}
                  values={transformerSection.values}
                  fieldErrors={transformerSection.fieldErrors}
                  isSaving={isSaving}
                  isMutating={isMutating}
                  onValueChange={transformerSection.handleValueChange}
                  onSave={handleSaveTransformerTab}
                />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </main>
    </AppMainCard>
  )
}
