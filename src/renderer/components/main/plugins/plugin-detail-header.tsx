import {
  DownloadIcon,
  RefreshCwIcon,
  Trash2Icon,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { TooltipIconButton } from "@/components/common/tooltip-icon-button"
import { pluginStoreActions, usePluginStore } from "@/store"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { openURL } from "@/utils/dataSender"
import {
  pluginDeprecationStatus,
  type PluginDetailSelectedItem,
  type PluginInstalledItem,
} from "./types"
import {
  buildPluginDeprecationKey,
  normalizePluginDisplayName,
  pluginDefaultLogoUrl,
  resolvePluginHomepageUrl,
} from "./utils"

interface PluginDetailHeaderProps {
  selectedItem: PluginDetailSelectedItem | null
  plugin: PluginInstalledItem | null
  isMutating: boolean
}

export function PluginDetailHeader({
  selectedItem,
  plugin,
  isMutating,
}: PluginDetailHeaderProps) {
  const { t } = useTranslation()
  const deprecationByPlugin = usePluginStore.use.deprecationByPlugin()

  if (!selectedItem) {
    return (
      <div className="border-border/60 border-b px-6 py-6">
        <div className="font-medium">{t("PLUGIN_SETTINGS")}</div>
      </div>
    )
  }

  const pluginDisplayName = normalizePluginDisplayName(selectedItem.fullName)
  const pluginAuthor = selectedItem.author.trim() || "Unknown"
  const pluginDescription = selectedItem.description.trim()
  const pluginLogo = selectedItem.logo.trim() || pluginDefaultLogoUrl
  const pluginHomepageUrl = resolvePluginHomepageUrl(selectedItem.fullName, [
    plugin?.homepage,
    selectedItem.homepage,
  ])
  const deprecationState = deprecationByPlugin[
    buildPluginDeprecationKey(selectedItem.fullName, selectedItem.version)
  ]
  const isDeprecated = Boolean(
    deprecationState?.status === pluginDeprecationStatus.Ready &&
    deprecationState.isDeprecated
  )

  const handleOpenPluginHomepage = async () => {
    openURL(pluginHomepageUrl)
  }

  const handleSetPluginEnabled = async (enabled: boolean) => {
    if (!plugin) {
      return
    }

    await pluginStoreActions.setPluginEnabled(plugin.fullName, enabled)
  }

  const handleUpdatePlugin = async () => {
    if (!plugin) {
      return
    }

    await pluginStoreActions.updatePlugin(plugin.fullName)
  }

  const handleUninstallPlugin = async () => {
    if (!plugin) {
      return
    }

    await pluginStoreActions.uninstallPlugin(plugin.fullName)
  }

  const handleInstallPlugin = async () => {
    await pluginStoreActions.installPlugin(selectedItem.fullName)
  }

  return (
    <div className="border-border/60 border-b px-6 py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-stretch gap-4">
          <div className="bg-muted border-border/60 flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border">
            <img
              src={pluginLogo}
              alt={`${pluginDisplayName} logo`}
              className="size-full object-cover"
              onError={(event) => {
                event.currentTarget.onerror = null
                event.currentTarget.src = pluginDefaultLogoUrl
              }}
            />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="truncate cursor-pointer text-left text-lg font-semibold transition-colors hover:text-(--app-plugin-tab-active-color) hover:underline"
                onClick={async () => {
                  await handleOpenPluginHomepage()
                }}
                title={pluginHomepageUrl}
              >
                {pluginDisplayName}
              </button>
              {selectedItem.hasInstall ? (
                <Badge variant="outline" className="text-[10px]">
                  {t("PLUGIN_INSTALLED")}
                </Badge>
              ) : null}
              {isDeprecated ? (
                <Badge variant="destructive" className="text-[10px]">
                  {t("PLUGIN_DEPRECATED_BADGE")}
                </Badge>
              ) : null}
            </div>
            {pluginDescription ? (
              <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                {pluginDescription}
              </p>
            ) : null}
            <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-sm">
              <span>v{selectedItem.version}</span>
              <span aria-hidden>·</span>
              <span>{pluginAuthor}</span>
            </div>
          </div>
        </div>

        {plugin ? (
          <div className="flex items-center gap-1">
            <TooltipIconButton
              tooltip={t("UNINSTALL_PLUGIN")}
              icon={<Trash2Icon className="size-4" />}
              size="icon-sm"
              disabled={isMutating}
              onClick={async () => {
                await handleUninstallPlugin()
              }}
            />

            <TooltipIconButton
              tooltip={t("UPDATE_PLUGIN")}
              icon={<RefreshCwIcon className="size-4" />}
              size="icon-sm"
              isLoading={isMutating}
              onClick={async () => {
                await handleUpdatePlugin()
              }}
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-background border-border flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1">
                  <span className="text-muted-foreground cursor-pointer text-xs">
                    {plugin.enabled ? t("ENABLE") : t("DISABLE")}
                  </span>
                  <Switch
                    checked={plugin.enabled}
                    disabled={isMutating}
                    onCheckedChange={async (checked) => {
                      await handleSetPluginEnabled(checked)
                    }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {plugin.enabled ? t("DISABLE_PLUGIN") : t("ENABLE_PLUGIN")}
              </TooltipContent>
            </Tooltip>
          </div>
        ) : selectedItem.hasInstall ? null : (
          <div className="flex items-center gap-1">
            <TooltipIconButton
              tooltip={t("PLUGIN_INSTALL")}
              icon={<DownloadIcon className="size-4" />}
              size="icon-sm"
              isLoading={isMutating}
              onClick={async () => {
                await handleInstallPlugin()
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
