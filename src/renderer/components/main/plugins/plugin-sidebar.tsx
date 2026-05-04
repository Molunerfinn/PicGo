import {
  BanIcon,
  BlocksIcon,
  DownloadIcon,
  FolderInputIcon,
  LoaderCircleIcon,
  SearchIcon,
  SettingsIcon,
  SpellCheckIcon,
  XIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TooltipIconButton } from "@/components/common/tooltip-icon-button"
import { cn } from "@/lib/utils"
import { pluginStoreActions, usePluginStore } from "@/store"
import { type PluginInstalledItem } from "./types"
import { pluginDefaultLogoUrl } from "./utils"

export interface PluginSidebarListItem {
  fullName: string
  name: string
  description: string
  author: string
  version: string
  logo: string
  homepage: string
  hasInstall: boolean
  installedPlugin: PluginInstalledItem | null
}

interface PluginSidebarProps {
  items: PluginSidebarListItem[]
  selectedPluginFullName: string | null
  onSelectPlugin: (fullName: string) => void
  onInstallPlugin: (fullName: string) => void
  onOpenAwesomeList: () => void
  onImportLocalPlugin: () => void
  onOpenPluginMenu: (plugin: PluginInstalledItem) => void
}

export function PluginSidebar({
  items,
  selectedPluginFullName,
  onSelectPlugin,
  onInstallPlugin,
  onOpenAwesomeList,
  onImportLocalPlugin,
  onOpenPluginMenu,
}: PluginSidebarProps) {
  const { t } = useTranslation()
  const searchValue = usePluginStore.use.searchValue()
  const exactMatch = usePluginStore.use.exactMatch()
  const isSearching = usePluginStore.use.isSearching()
  const isImportingLocal = usePluginStore.use.isImportingLocal()
  const loadingMap = usePluginStore.use.isMutatingByPlugin()
  const normalizedSearch = searchValue.trim().toLowerCase()
  const hasSearch = normalizedSearch.length > 0
  const scrollAreaKey = `${hasSearch ? "search" : "installed"}:${items.length}`

  return (
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border flex w-(--app-plugin-sidebar-width) shrink-0 flex-col overflow-hidden rounded-xl border backdrop-blur-xl">
      <div className="border-sidebar-border/60 flex flex-col gap-3 border-b px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-base font-semibold">{t("SIDEBAR_PLUGINS")}</h1>
          <div className="flex items-center gap-1">
            <TooltipIconButton
              tooltip={t("PLUGIN_SEARCH_EXACT_MATCH")}
              icon={<SpellCheckIcon className="size-4" />}
              pressed={exactMatch}
              onClick={pluginStoreActions.toggleExactMatch}
            />

            <TooltipIconButton
              tooltip={t("PLUGIN_LIST")}
              icon={<BlocksIcon className="size-4" />}
              onClick={onOpenAwesomeList}
            />

            <TooltipIconButton
              tooltip={t("PLUGIN_IMPORT_LOCAL")}
              icon={<FolderInputIcon className="size-4" />}
              isLoading={isImportingLocal}
              onClick={onImportLocalPlugin}
            />
          </div>
        </div>

        <InputGroup className="bg-background/70">
          <InputGroupAddon>
            <SearchIcon className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            value={searchValue}
            onChange={(event) => pluginStoreActions.setSearchValue(event.target.value)}
            placeholder={t("PLUGIN_SEARCH_PLACEHOLDER")}
            aria-label={t("SEARCH")}
          />
          {hasSearch ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                variant="ghost"
                className="text-muted-foreground transition-all duration-300 hover:bg-(--app-plugin-sidebar-item-hover-bg) hover:text-(--app-plugin-sidebar-item-active-color)"
                onClick={() => pluginStoreActions.setSearchValue("")}
                title={t("ALBUM_CLEAR_SELECTION")}
                aria-label={t("ALBUM_CLEAR_SELECTION")}
              >
                <XIcon className="size-3.5" />
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>

        {hasSearch && isSearching ? (
          <div className="text-muted-foreground flex items-center justify-center gap-2 px-1 text-xs">
            <LoaderCircleIcon className="size-3.5 animate-spin" />
            <span>{t("SEARCH")}</span>
          </div>
        ) : null}
      </div>

      <ScrollArea key={scrollAreaKey} className="min-h-0 flex-1">
        <div className="space-y-1 p-2">
          {!isSearching && items.length === 0 ? (
            <div className="text-muted-foreground px-3 py-10 text-center text-sm">
              {t("PLUGIN_EMPTY")}
            </div>
          ) : null}

          {items.map((item) => {
            const isSelected = selectedPluginFullName === item.fullName
            const isMutating = Boolean(loadingMap[item.fullName])
            const installedPlugin = item.installedPlugin
            const isDisabled = Boolean(installedPlugin && !installedPlugin.enabled)

            return (
              <div
                key={item.fullName}
                className={cn(
                  "group border-sidebar-border/50 rounded-lg border px-3 py-2.5",
                  isSelected
                    ? "bg-(--app-plugin-sidebar-item-active-bg) border-(--app-plugin-sidebar-item-active-color)/40"
                    : "hover:bg-(--app-plugin-sidebar-item-hover-bg)",
                  isDisabled ? "opacity-80" : null
                )}
              >
                <div
                  className="flex min-w-0 cursor-pointer items-center gap-2.5"
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectPlugin(item.fullName)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      onSelectPlugin(item.fullName)
                    }
                  }}
                >
                  <div className="bg-muted border-border/60 flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md border">
                    <img
                      src={item.logo.trim() || pluginDefaultLogoUrl}
                      alt={`${item.name} logo`}
                      className="size-full object-cover"
                      onError={(event) => {
                        event.currentTarget.onerror = null
                        event.currentTarget.src = pluginDefaultLogoUrl
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[15px] font-medium leading-5">
                        {item.name}
                      </span>
                    </div>
                    <p className="text-muted-foreground truncate text-xs leading-4">
                      {item.description || item.fullName}
                    </p>
                    <div className="flex min-w-0 items-center gap-1">
                      <p className="text-muted-foreground min-w-0 flex-1 truncate text-[11px] leading-4">
                        v{item.version} · {item.author}
                      </p>

                      {item.hasInstall && installedPlugin ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground hover:text-(--app-plugin-sidebar-item-active-color)"
                          title={t("PROVIDER_CONFIG_ACTIONS")}
                          aria-label={t("PROVIDER_CONFIG_ACTIONS")}
                          onClick={(event) => {
                            event.stopPropagation()
                            onOpenPluginMenu(installedPlugin)
                          }}
                        >
                          {isMutating ? (
                            <LoaderCircleIcon className="size-4 animate-spin" />
                          ) : isDisabled ? (
                            <BanIcon className="size-4" />
                          ) : (
                            <SettingsIcon className="size-4" />
                          )}
                        </Button>
                      ) : (
                        <TooltipIconButton
                          tooltip={t("PLUGIN_INSTALL")}
                          icon={<DownloadIcon className="size-4" />}
                          isLoading={isMutating}
                          onClick={(event) => {
                            event.stopPropagation()
                            onInstallPlugin(item.fullName)
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </aside>
  )
}
