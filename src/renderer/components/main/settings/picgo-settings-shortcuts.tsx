import { ChevronRightIcon } from "lucide-react"
import { useEffect, useState, type KeyboardEvent as ReactKeyboardEvent } from "react"
import { useNavigate } from "@tanstack/react-router"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { settingsAdapter } from "@/adapters/settings"
import { AppMainCard } from "@/components/common/app-main-card"
import { MainCardHeader } from "@/components/common/main-card-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  appActions,
  settingsStoreActions,
  useAppStore,
  useSettingsStore,
} from "@/store"
import {
  buildShortcutFromKeyboardEvent,
} from "./shortcut-key-binding"
import { ShortcutEditDialog } from "./shortcut-edit-dialog"
import { ShortcutKbdList } from "./shortcut-kbd-list"
import { SettingsSidebar } from "./settings-sidebar"
import {
  allSettingsSections,
  buildSettingsSearchItems,
  buildSettingsShortcutItems,
  buildShortcutValue,
  defaultSettingsConfig,
  filterSettingsSectionsBySearch,
  parseShortcutKeys,
  settingsSectionId,
  type SettingsShortcutItem,
} from "./utils"

function resolveErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}

function resolveSourceName(shortcut: SettingsShortcutItem) {
  if (shortcut.from.startsWith("picgo-plugin-")) {
    return shortcut.from.replace("picgo-plugin-", "")
  }

  return "PicGo"
}

function isBuiltinShortcut(shortcut: SettingsShortcutItem) {
  return shortcut.from === "picgo"
}

function resolveShortcutLabel(
  shortcut: SettingsShortcutItem,
  t: TFunction
) {
  if (shortcut.from === "picgo") {
    if (shortcut.name === "upload") {
      return t("QUICK_UPLOAD")
    }

    if (shortcut.name === "open-main-window") {
      return t("OPEN_MAIN_WINDOW")
    }
  }

  return shortcut.label
}

export function PicGoSettingsShortcuts() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const providers = useAppStore.use.providers()
  const appConfig = useAppStore.use.appConfig()
  const settingsSearchValue = useSettingsStore.use.searchValue()
  const settingsConfig = appConfig?.settings ?? defaultSettingsConfig
  const picBedProxy = appConfig?.picBed.proxy ?? ""

  const [editingShortcutId, setEditingShortcutId] = useState<string | null>(null)
  const [draftShortcutValue, setDraftShortcutValue] = useState("")
  const [isCaptureActive, setIsCaptureActive] = useState(false)

  const shortcutItems = buildSettingsShortcutItems(settingsConfig.shortKey)
  const searchItems = buildSettingsSearchItems(
    settingsConfig,
    providers,
    picBedProxy
  )
  const { matchedSections, matchedItemIds, hasQuery } = filterSettingsSectionsBySearch(
    allSettingsSections,
    searchItems,
    settingsSearchValue
  )

  useEffect(() => {
    let isDisposed = false

    async function bootstrap() {
      try {
        await appActions.ensureHydrated()
        await appActions.ensureSettingsHydrated()
      } catch (error) {
        if (!isDisposed) {
          toast.error(resolveErrorMessage(error, "Failed"))
        }
      }
    }

    bootstrap()

    return () => {
      isDisposed = true
    }
  }, [])

  useEffect(() => {
    settingsAdapter.toggleShortcutModifiedMode(editingShortcutId !== null)

    return () => {
      settingsAdapter.toggleShortcutModifiedMode(false)
    }
  }, [editingShortcutId])

  const openEditDialog = (shortcut: SettingsShortcutItem) => {
    setEditingShortcutId(shortcut.id)
    setDraftShortcutValue(shortcut.key)
    setIsCaptureActive(false)
  }

  const closeEditDialog = () => {
    setEditingShortcutId(null)
    setDraftShortcutValue("")
    setIsCaptureActive(false)
  }

  const handleActivateCapture = () => {
    setDraftShortcutValue("")
    setIsCaptureActive(true)
  }

  const handleCaptureKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>
  ) => {
    event.preventDefault()
    const keys = buildShortcutFromKeyboardEvent(event.nativeEvent)
    setDraftShortcutValue(buildShortcutValue(keys.slice(0, 4)))
    setIsCaptureActive(false)
  }

  const handleSaveShortcut = async () => {
    if (!editingShortcutId) {
      return
    }

    try {
      const keys = parseShortcutKeys(draftShortcutValue).slice(0, 4)
      if (keys.length === 0) {
        toast.error(t("FAILED"))
        return
      }

      await settingsStoreActions.updateShortcutKeys(editingShortcutId, keys)
      toast.success(t("TIPS_SHORTCUT_MODIFIED_SUCCEED"))
      closeEditDialog()
    } catch (error) {
      toast.error(resolveErrorMessage(error, t("FAILED")))
    }
  }

  const handleToggleShortcut = async (shortcutId: string, nextEnabled: boolean) => {
    try {
      await settingsStoreActions.setShortcutEnabled(shortcutId, nextEnabled)
      toast.success(t("TIPS_SHORTCUT_MODIFIED_SUCCEED"))
    } catch (error) {
      toast.error(resolveErrorMessage(error, t("FAILED")))
    }
  }

  return (
    <>
      <SettingsSidebar
        selectedSection={settingsSectionId.Advanced}
        matchedSections={matchedSections}
        matchedItemIds={matchedItemIds}
        isAdvancedRoute={true}
        activeAdvancedRoute="shortcuts"
        onSelectSection={(section) =>
          navigate({
            to: "/main/settings/settings",
            search: (prev) => ({
              ...prev,
              section,
            }),
          })
        }
        onNavigateRoute={(to) => navigate({ to })}
      />

      <AppMainCard asChild className="overflow-hidden">
        <main>
          <MainCardHeader
            className="px-6"
            leading={
              <>
                <span className="font-medium">{t("SETTINGS")}</span>
                <ChevronRightIcon className="size-4" />
                <span className="text-muted-foreground">
                  {t("SETTINGS_OPEN_SHORTCUTS")}
                </span>
              </>
            }
          />

          <ScrollArea className="min-h-0 flex-1">
            <div className="mx-auto w-full max-w-(--app-provider-content-max-width) px-6 py-6">
              {hasQuery && !matchedItemIds.has("shortcuts-entry") ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
                  <div className="text-lg font-semibold">
                    {t("SETTINGS_NO_RESULTS_TITLE")}
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {t("SETTINGS_NO_RESULTS_DESCRIPTION")}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => settingsStoreActions.setSearchValue("")}
                  >
                    {t("ALBUM_CLEAR_SELECTION")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {shortcutItems.map((shortcut) => {
                    const label = resolveShortcutLabel(shortcut, t)
                    const sourceName = resolveSourceName(shortcut)
                    const isBuiltin = isBuiltinShortcut(shortcut)

                    return (
                      <div
                        key={shortcut.id}
                        className="border-border/60 rounded-lg border p-4"
                      >
                        <div className="grid gap-4 min-[1120px]:grid-cols-[260px_minmax(0,1fr)] min-[1120px]:items-center">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{label}</div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "mt-2 max-w-[240px] truncate",
                                isBuiltin ? "text-foreground" : "text-muted-foreground"
                              )}
                            >
                              {sourceName}
                            </Badge>
                          </div>

                          <div className="flex min-w-0 flex-wrap items-center gap-3 min-[1120px]:grid min-[1120px]:grid-cols-[minmax(0,1fr)_auto] min-[1120px]:items-center">
                            <div className="min-w-0 shrink grow basis-[220px]">
                              <ShortcutKbdList value={shortcut.key} />
                            </div>

                            <div className="flex shrink-0 items-center gap-3 min-[1120px]:justify-end">
                              <div className="flex shrink-0 items-center gap-2">
                                <Switch
                                  checked={shortcut.enable}
                                  onCheckedChange={async (checked) => {
                                    await handleToggleShortcut(
                                      shortcut.id,
                                      checked === true
                                    )
                                  }}
                                />
                                <span className="text-sm whitespace-nowrap">
                                  {shortcut.enable
                                    ? t("SHORTCUT_ENABLED")
                                    : t("SHORTCUT_DISABLED")}
                                </span>
                              </div>

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="shrink-0"
                                onClick={() => openEditDialog(shortcut)}
                              >
                                {t("SHORTCUT_EDIT")}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </main>
      </AppMainCard>

      <ShortcutEditDialog
        open={editingShortcutId !== null}
        draftShortcutValue={draftShortcutValue}
        isCaptureActive={isCaptureActive}
        onCancel={closeEditDialog}
        onConfirm={async () => {
          await handleSaveShortcut()
        }}
        onCaptureActivate={handleActivateCapture}
        onCaptureBlur={() => setIsCaptureActive(false)}
        onCaptureKeyDown={handleCaptureKeyDown}
      />
    </>
  )
}
