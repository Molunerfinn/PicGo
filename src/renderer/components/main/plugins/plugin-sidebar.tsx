import {
  BanIcon,
  BlocksIcon,
  DownloadIcon,
  FolderInputIcon,
  LoaderCircleIcon,
  SearchIcon,
  SettingsIcon,
  XIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  pluginGearActionKind,
  type PluginGearAction,
  type PluginInstalledItem,
} from "./types"
import { buildPluginGearActions, pluginDefaultLogoUrl } from "./utils"

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
  searchValue: string
  isImportingLocal: boolean
  currentTransformer: string
  loadingMap: Record<string, boolean>
  onSearchValueChange: (value: string) => void
  onSelectPlugin: (fullName: string) => void
  onInstallPlugin: (fullName: string) => void
  onOpenAwesomeList: () => void
  onImportLocalPlugin: () => void
  onGearAction: (plugin: PluginInstalledItem, action: PluginGearAction) => void
}

export function PluginSidebar({
  items,
  selectedPluginFullName,
  searchValue,
  isImportingLocal,
  currentTransformer,
  loadingMap,
  onSearchValueChange,
  onSelectPlugin,
  onInstallPlugin,
  onOpenAwesomeList,
  onImportLocalPlugin,
  onGearAction,
}: PluginSidebarProps) {
  const { t } = useTranslation()
  const normalizedSearch = searchValue.trim().toLowerCase()
  const hasSearch = normalizedSearch.length > 0

  return (
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border flex w-(--app-plugin-sidebar-width) shrink-0 flex-col overflow-hidden rounded-xl border backdrop-blur-xl">
      <div className="border-sidebar-border/60 flex flex-col gap-3 border-b px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-base font-semibold">{t("SIDEBAR_PLUGINS")}</h1>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground hover:text-(--app-plugin-sidebar-item-active-color)"
                  onClick={onOpenAwesomeList}
                >
                  <BlocksIcon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("PLUGIN_LIST")}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground hover:text-(--app-plugin-sidebar-item-active-color)"
                  onClick={onImportLocalPlugin}
                  disabled={isImportingLocal}
                >
                  {isImportingLocal ? (
                    <LoaderCircleIcon className="size-4 animate-spin" />
                  ) : (
                    <FolderInputIcon className="size-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("PLUGIN_IMPORT_LOCAL")}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <InputGroup className="bg-background/70">
          <InputGroupAddon>
            <SearchIcon className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            value={searchValue}
            onChange={(event) => onSearchValueChange(event.target.value)}
            placeholder={t("PLUGIN_SEARCH_PLACEHOLDER")}
            aria-label={t("SEARCH")}
          />
          {hasSearch ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                variant="ghost"
                className="text-muted-foreground transition-all duration-300 hover:bg-(--app-plugin-sidebar-item-hover-bg) hover:text-(--app-plugin-sidebar-item-active-color)"
                onClick={() => onSearchValueChange("")}
                title={t("GALLERY_CLEAR_SELECTION")}
                aria-label={t("GALLERY_CLEAR_SELECTION")}
              >
                <XIcon className="size-3.5" />
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-1 p-2">
          {items.length === 0 ? (
            <div className="text-muted-foreground px-3 py-10 text-center text-sm">
              {t("PLUGIN_EMPTY")}
            </div>
          ) : null}

          {items.map((item) => {
            const isSelected = selectedPluginFullName === item.fullName
            const isMutating = Boolean(loadingMap[item.fullName])
            const installedPlugin = item.installedPlugin
            const isDisabled = Boolean(installedPlugin && !installedPlugin.enabled)
            const gearActions = installedPlugin
              ? buildPluginGearActions(installedPlugin, currentTransformer)
              : []

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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              className="text-muted-foreground hover:text-(--app-plugin-sidebar-item-active-color)"
                              title={t("PROVIDER_CONFIG_ACTIONS")}
                              aria-label={t("PROVIDER_CONFIG_ACTIONS")}
                              onClick={(event) => {
                                event.stopPropagation()
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
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-60">
                            {gearActions.map((action, index) => {
                              const needsSeparator =
                                index > 0 &&
                                action.kind === pluginGearActionKind.GuiMenu &&
                                gearActions[index - 1]?.kind !==
                                  pluginGearActionKind.GuiMenu

                              const actionLabel =
                                action.kind === pluginGearActionKind.Enable
                                  ? t("ENABLE_PLUGIN")
                                  : action.kind === pluginGearActionKind.Disable
                                    ? t("DISABLE_PLUGIN")
                                    : action.kind === pluginGearActionKind.Uninstall
                                      ? t("UNINSTALL_PLUGIN")
                                      : action.kind === pluginGearActionKind.Update
                                        ? t("UPDATE_PLUGIN")
                                        : action.label

                              return (
                                <div key={action.id}>
                                  {needsSeparator ? <DropdownMenuSeparator /> : null}
                                  <DropdownMenuItem
                                    disabled={action.disabled || isMutating}
                                    onSelect={() => onGearAction(installedPlugin, action)}
                                  >
                                    <span>{actionLabel}</span>
                                  </DropdownMenuItem>
                                </div>
                              )
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              className="text-muted-foreground hover:text-(--app-plugin-sidebar-item-active-color)"
                              onClick={(event) => {
                                event.stopPropagation()
                                onInstallPlugin(item.fullName)
                              }}
                              disabled={isMutating}
                              aria-label={t("PLUGIN_INSTALL")}
                            >
                              {isMutating ? (
                                <LoaderCircleIcon className="size-4 animate-spin" />
                              ) : (
                                <DownloadIcon className="size-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("PLUGIN_INSTALL")}</TooltipContent>
                        </Tooltip>
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
