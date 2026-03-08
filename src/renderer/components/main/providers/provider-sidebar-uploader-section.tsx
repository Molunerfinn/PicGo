import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CloudIcon,
  CopyIcon,
  LoaderCircleIcon,
  MoreHorizontalIcon,
  PencilLineIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import {
  ProviderActiveUploaderBadge,
  ProviderDefaultConfigBadge,
} from "./provider-status-badges"
import type {
  ProviderDraftConfigItem,
  ProviderUploaderConfigItem,
  ProviderUploaderSummary,
} from "./types"

type SidebarConfigItem = ProviderUploaderConfigItem | ProviderDraftConfigItem

interface ProviderSidebarConfigItemRowProps {
  uploader: ProviderUploaderSummary
  config: SidebarConfigItem
  defaultConfigId: string | undefined
  isActiveUploader: boolean
  selectedConfigId: string | null
  canDeletePersistedConfig: boolean
  onSelectConfig: (uploaderId: string, configId: string) => void
  onRenameIntent: (uploaderId: string, configId: string, configName: string) => void
  onCopyIntent: (uploaderId: string, configId: string, configName: string) => void
  onDeleteIntent: (uploaderId: string, configId: string) => void
}

interface ProviderSidebarUploaderSectionProps {
  uploader: ProviderUploaderSummary
  persistedConfigs: ProviderUploaderConfigItem[]
  visibleConfigs: SidebarConfigItem[]
  defaultConfigId: string | undefined
  isLoadingConfigs: boolean
  isActiveUploader: boolean
  isExpanded: boolean
  hasSearch: boolean
  selectedConfigId: string | null
  onSelectUploader: (uploaderId: string) => void
  onSetDefaultUploader: (uploaderId: string) => Promise<void>
  onToggleUploader: (uploaderId: string) => void
  onSelectConfig: (uploaderId: string, configId: string) => void
  onCreateIntent: (uploaderId: string) => void
  onRenameIntent: (uploaderId: string, configId: string, configName: string) => void
  onCopyIntent: (uploaderId: string, configId: string, configName: string) => void
  onDeleteIntent: (uploaderId: string, configId: string) => void
}

function isDraftConfig(config: SidebarConfigItem): config is ProviderDraftConfigItem {
  return "_isDraft" in config && config._isDraft === true
}

function ProviderSidebarConfigItemRow({
  uploader,
  config,
  defaultConfigId,
  isActiveUploader,
  selectedConfigId,
  canDeletePersistedConfig,
  onSelectConfig,
  onRenameIntent,
  onCopyIntent,
  onDeleteIntent,
}: ProviderSidebarConfigItemRowProps) {
  const { t } = useTranslation()

  const isDraft = isDraftConfig(config)
  const isSelected = isActiveUploader && selectedConfigId === config._id
  const isDefault = !isDraft && defaultConfigId === config._id

  return (
    <div
      className={cn(
        "group flex items-center justify-between rounded-md px-2 py-1.5 transition-all duration-300",
        isSelected
          ? "bg-(--app-provider-sidebar-item-active-bg) text-(--app-provider-sidebar-item-active-color) hover:bg-(--app-provider-sidebar-item-active-bg) hover:text-(--app-provider-sidebar-item-active-color)"
          : "hover:bg-(--app-provider-sidebar-item-hover-bg) hover:text-(--app-provider-sidebar-item-active-color)",
        isDraft && "border border-dashed border-sidebar-border/60"
      )}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
        onClick={() => onSelectConfig(uploader.id, config._id)}
        title={config._configName}
        aria-label={config._configName}
        aria-current={isSelected ? "page" : undefined}
        data-active={isSelected ? "true" : "false"}
      >
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            isDefault
              ? "bg-primary"
              : isDraft
                ? "bg-(--app-provider-draft-indicator-color)"
                : "bg-muted-foreground/40"
          )}
        />
        <span className="truncate text-sm">{config._configName}</span>

        {isDefault ? (
          <ProviderDefaultConfigBadge
            uploaderName={uploader.name}
            className="ml-auto h-4 px-1.5 text-[10px]"
          />
        ) : null}

        {isDraft ? (
          <Badge variant="outline" className="ml-auto h-4 border-dashed px-1.5 text-[10px]">
            {t("PROVIDER_DRAFT_CONFIG")}
          </Badge>
        ) : null}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-(--app-provider-sidebar-item-active-color)"
            onClick={(event) => event.stopPropagation()}
            title={t("PROVIDER_CONFIG_ACTIONS")}
            aria-label={t("PROVIDER_CONFIG_ACTIONS")}
          >
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onSelect={() => onRenameIntent(uploader.id, config._id, config._configName)}
          >
            <PencilLineIcon className="size-4" />
            <span>{t("CONFIG_RENAME")}</span>
          </DropdownMenuItem>

          {!isDraft ? (
            <DropdownMenuItem
              onSelect={() => onCopyIntent(uploader.id, config._id, config._configName)}
            >
              <CopyIcon className="size-4" />
              <span>{t("COPY")}</span>
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            disabled={!isDraft && !canDeletePersistedConfig}
            onSelect={() => onDeleteIntent(uploader.id, config._id)}
          >
            <Trash2Icon className="size-4" />
            <span>{t("DELETE")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function ProviderSidebarUploaderSection({
  uploader,
  persistedConfigs,
  visibleConfigs,
  defaultConfigId,
  isLoadingConfigs,
  isActiveUploader,
  isExpanded,
  hasSearch,
  selectedConfigId,
  onSelectUploader,
  onSetDefaultUploader,
  onToggleUploader,
  onSelectConfig,
  onCreateIntent,
  onRenameIntent,
  onCopyIntent,
  onDeleteIntent,
}: ProviderSidebarUploaderSectionProps) {
  const { t } = useTranslation()

  const canDeletePersistedConfig = persistedConfigs.length > 1

  return (
    <div className="rounded-lg">
      <div className="flex items-center gap-1 px-1">
        <button
          type="button"
          onClick={() => onSelectUploader(uploader.id)}
          className={cn(
            "flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left transition-all duration-300 hover:bg-(--app-provider-sidebar-item-hover-bg)",
            isActiveUploader
              ? "bg-(--app-provider-sidebar-item-active-bg) text-(--app-provider-sidebar-item-active-color) hover:bg-(--app-provider-sidebar-item-active-bg) hover:text-(--app-provider-sidebar-item-active-color)"
              : "text-muted-foreground hover:text-(--app-provider-sidebar-item-active-color)"
          )}
          title={uploader.name}
          aria-label={uploader.name}
          aria-current={isActiveUploader ? "page" : undefined}
          data-active={isActiveUploader ? "true" : "false"}
        >
          <CloudIcon
            className={cn(
              "size-4 transition-colors",
              uploader.isDefaultUploader
                ? "fill-(--app-provider-uploader-default-icon-color) text-(--app-provider-uploader-default-icon-color)"
                : isActiveUploader
                  ? "fill-(--app-provider-uploader-selected-icon-color) text-(--app-provider-uploader-selected-icon-color)"
                  : "text-muted-foreground"
            )}
          />
          <span className="truncate text-sm font-medium">{uploader.name}</span>

          {uploader.isDefaultUploader ? (
            <ProviderActiveUploaderBadge
              uploaderName={uploader.name}
              className="ml-auto h-4 px-1.5 text-[10px]"
            />
          ) : null}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-(--app-provider-sidebar-item-active-color)"
              title={t("PROVIDER_UPLOADER_ACTIONS", {
                uploaderName: uploader.name,
              })}
              aria-label={t("PROVIDER_UPLOADER_ACTIONS", {
                uploaderName: uploader.name,
              })}
            >
              <MoreHorizontalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              disabled={uploader.isDefaultUploader}
              onSelect={() => onSetDefaultUploader(uploader.id)}
            >
              <CheckIcon className="size-4" />
              <span>{t("SETTINGS_SET_DEFAULT_PICBED")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground hover:text-(--app-provider-sidebar-item-active-color)"
          onClick={() => onToggleUploader(uploader.id)}
          title={isExpanded ? t("PROVIDER_SIDEBAR_COLLAPSE") : t("PROVIDER_SIDEBAR_EXPAND")}
          aria-label={
            isExpanded ? t("PROVIDER_SIDEBAR_COLLAPSE") : t("PROVIDER_SIDEBAR_EXPAND")
          }
        >
          {isExpanded ? (
            <ChevronDownIcon className="size-4" />
          ) : (
            <ChevronRightIcon className="size-4" />
          )}
        </Button>
      </div>

      {isExpanded ? (
        <div className="mt-1 ml-4 space-y-1 border-l border-sidebar-border/60 pl-3 pb-2">
          {isLoadingConfigs ? (
            <div className="px-2 py-2">
              <LoaderCircleIcon className="text-muted-foreground mx-auto size-4 animate-spin" />
            </div>
          ) : null}

          {!isLoadingConfigs
            ? visibleConfigs.map((config) => (
              <ProviderSidebarConfigItemRow
                key={config._id}
                uploader={uploader}
                config={config}
                defaultConfigId={defaultConfigId}
                isActiveUploader={isActiveUploader}
                selectedConfigId={selectedConfigId}
                canDeletePersistedConfig={canDeletePersistedConfig}
                onSelectConfig={onSelectConfig}
                onRenameIntent={onRenameIntent}
                onCopyIntent={onCopyIntent}
                onDeleteIntent={onDeleteIntent}
              />
            ))
            : null}

          {!hasSearch ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground w-full justify-start transition-all duration-300 hover:bg-(--app-provider-sidebar-item-hover-bg) hover:text-(--app-provider-sidebar-item-active-color)"
              onClick={() => onCreateIntent(uploader.id)}
            >
              <PlusIcon className="size-4" />
              <span>{t("PROVIDER_CREATE_CONFIG")}</span>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
