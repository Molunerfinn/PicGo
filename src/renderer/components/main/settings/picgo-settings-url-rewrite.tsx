import {
  ChevronRightIcon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
  ArrowDownIcon,
  ArrowUpIcon,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { AppMainCard } from "@/components/common/app-main-card"
import { MainCardHeader } from "@/components/common/main-card-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useAppStore } from "@/store"
import { SettingsSidebar } from "./settings-sidebar"
import {
  allSettingsSections,
  applyUrlRewriteRules,
  buildSettingsSearchItems,
  defaultSettingsConfig,
  filterSettingsSectionsBySearch,
  settingsSectionId,
  type SettingsUrlRewriteRule,
} from "./utils"

function createRuleId() {
  return `rule-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

function resolveErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}

function moveRule(
  list: SettingsUrlRewriteRule[],
  index: number,
  direction: -1 | 1
) {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= list.length) {
    return list
  }

  const nextList = [...list]
  const [current] = nextList.splice(index, 1)
  nextList.splice(nextIndex, 0, current)
  return nextList
}

export function PicGoSettingsUrlRewrite() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const providers = useAppStore((state) => state.providers)
  const settingsConfig = useAppStore(
    (state) => state.appConfig?.settings ?? defaultSettingsConfig
  )
  const settingsPage = useAppStore((state) => state.settingsPage)
  const ensureHydrated = useAppStore((state) => state.ensureHydrated)
  const ensureSettingsHydrated = useAppStore((state) => state.ensureSettingsHydrated)
  const setSettingsSearchValue = useAppStore((state) => state.setSettingsSearchValue)
  const saveUrlRewriteRules = useAppStore((state) => state.saveUrlRewriteRules)

  const [draftRules, setDraftRules] = useState<SettingsUrlRewriteRule[] | null>(null)
  const [previewInput, setPreviewInput] = useState("")
  const rules = draftRules ?? settingsConfig.urlRewriteRules

  const searchItems = buildSettingsSearchItems(settingsConfig, providers)
  const { matchedSections, matchedItemIds, hasQuery } = filterSettingsSectionsBySearch(
    allSettingsSections,
    searchItems,
    settingsPage.searchValue
  )

  const previewOutput =
    previewInput.trim().length > 0 ? applyUrlRewriteRules(previewInput, rules) : ""

  useEffect(() => {
    let isDisposed = false

    async function bootstrap() {
      try {
        await ensureHydrated()
        await ensureSettingsHydrated()
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
  }, [ensureHydrated, ensureSettingsHydrated])

  const updateRules = (
    updater: (current: SettingsUrlRewriteRule[]) => SettingsUrlRewriteRule[]
  ) => {
    setDraftRules((prev) => {
      const base = prev ?? settingsConfig.urlRewriteRules
      return updater(base)
    })
  }

  const handleSave = async () => {
    try {
      await saveUrlRewriteRules(rules)
      setDraftRules(null)
      toast.success(t("SUCCESS"))
    } catch (error) {
      toast.error(resolveErrorMessage(error, t("FAILED")))
    }
  }

  return (
    <>
      <SettingsSidebar
        selectedSection={settingsSectionId.Advanced}
        searchValue={settingsPage.searchValue}
        matchedSections={matchedSections}
        matchedItemIds={matchedItemIds}
        isAdvancedRoute={true}
        activeAdvancedRoute="url-rewrite"
        onSearchValueChange={setSettingsSearchValue}
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
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground cursor-pointer border-0 bg-transparent p-0 transition-colors"
                  onClick={() =>
                    navigate({
                      to: "/main/settings/settings",
                      search: (prev) => ({
                        ...prev,
                        section: settingsSectionId.Advanced,
                      }),
                    })
                  }
                >
                  {t("SETTINGS_SECTION_ADVANCED")}
                </button>
                <ChevronRightIcon className="size-4" />
                <span className="text-muted-foreground">{t("SETTINGS_URL_REWRITE")}</span>
              </>
            }
            trailing={
              <Button
                onClick={() => {
                  handleSave().catch(() => undefined)
                }}
              >
                <SaveIcon className="size-4" />
                <span>{t("CONFIRM")}</span>
              </Button>
            }
          />

          <ScrollArea className="min-h-0 flex-1">
            <div className="mx-auto w-full max-w-(--app-provider-content-max-width) px-6 py-6">
              {hasQuery && !matchedItemIds.has("url-rewrite-entry") ? (
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
                    onClick={() => setSettingsSearchValue("")}
                  >
                    {t("GALLERY_CLEAR_SELECTION")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border/70 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-sm font-semibold">{t("URL_REWRITE_HELP")}</h2>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          updateRules((prev) => [
                            ...prev,
                            {
                              id: createRuleId(),
                              match: "",
                              replace: "",
                              global: false,
                              ignoreCase: false,
                              enabled: true,
                            },
                          ])
                        }}
                      >
                        <PlusIcon className="size-4" />
                        <span>{t("URL_REWRITE_ADD_RULE")}</span>
                      </Button>
                    </div>

                    {rules.length === 0 ? (
                      <div className="text-muted-foreground rounded-md border border-dashed border-border px-4 py-8 text-center text-sm">
                        {t("URL_REWRITE_EMPTY")}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {rules.map((rule, index) => (
                          <div
                            key={rule.id}
                            className="rounded-md border border-border/70 p-3"
                          >
                            <div className="mb-3 flex items-center justify-between gap-2">
                              <div className="text-sm font-medium">
                                {t("URL_REWRITE_ORDER")} {index + 1}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  size="icon-xs"
                                  variant="ghost"
                                  onClick={() => {
                                    updateRules((prev) => moveRule(prev, index, -1))
                                  }}
                                  disabled={index === 0}
                                  title={t("URL_REWRITE_MOVE_UP")}
                                >
                                  <ArrowUpIcon className="size-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon-xs"
                                  variant="ghost"
                                  onClick={() => {
                                    updateRules((prev) => moveRule(prev, index, 1))
                                  }}
                                  disabled={index === rules.length - 1}
                                  title={t("URL_REWRITE_MOVE_DOWN")}
                                >
                                  <ArrowDownIcon className="size-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon-xs"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => {
                                    updateRules((prev) =>
                                      prev.filter((item) => item.id !== rule.id)
                                    )
                                  }}
                                  title={t("URL_REWRITE_DELETE")}
                                >
                                  <Trash2Icon className="size-3.5" />
                                </Button>
                              </div>
                            </div>

                            <div className="grid gap-3">
                              <div className="space-y-1.5">
                                <Label htmlFor={`url-rewrite-match-${rule.id}`}>
                                  {t("URL_REWRITE_MATCH")}
                                </Label>
                                <Input
                                  id={`url-rewrite-match-${rule.id}`}
                                  value={rule.match}
                                  onChange={(event) => {
                                    const nextValue = event.target.value
                                    updateRules((prev) =>
                                      prev.map((item) =>
                                        item.id === rule.id
                                          ? { ...item, match: nextValue }
                                          : item
                                      )
                                    )
                                  }}
                                  placeholder={t("URL_REWRITE_MATCH_PLACEHOLDER")}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label htmlFor={`url-rewrite-replace-${rule.id}`}>
                                  {t("URL_REWRITE_REPLACE")}
                                </Label>
                                <Input
                                  id={`url-rewrite-replace-${rule.id}`}
                                  value={rule.replace}
                                  onChange={(event) => {
                                    const nextValue = event.target.value
                                    updateRules((prev) =>
                                      prev.map((item) =>
                                        item.id === rule.id
                                          ? { ...item, replace: nextValue }
                                          : item
                                      )
                                    )
                                  }}
                                  placeholder={t("URL_REWRITE_REPLACE_PLACEHOLDER")}
                                />
                              </div>
                              <div className="flex flex-wrap items-center gap-4">
                                <Label className="gap-2">
                                  <Switch
                                    checked={rule.enabled}
                                    onCheckedChange={(checked) => {
                                      updateRules((prev) =>
                                        prev.map((item) =>
                                          item.id === rule.id
                                            ? { ...item, enabled: checked === true }
                                            : item
                                        )
                                      )
                                    }}
                                  />
                                  <span className="text-sm">{t("URL_REWRITE_ENABLED")}</span>
                                </Label>
                                <Label className="gap-2">
                                  <Switch
                                    checked={rule.global}
                                    onCheckedChange={(checked) => {
                                      updateRules((prev) =>
                                        prev.map((item) =>
                                          item.id === rule.id
                                            ? { ...item, global: checked === true }
                                            : item
                                        )
                                      )
                                    }}
                                  />
                                  <span className="text-sm">
                                    {t("URL_REWRITE_FLAG_GLOBAL_LABEL")}
                                  </span>
                                </Label>
                                <Label className="gap-2">
                                  <Switch
                                    checked={rule.ignoreCase}
                                    onCheckedChange={(checked) => {
                                      updateRules((prev) =>
                                        prev.map((item) =>
                                          item.id === rule.id
                                            ? { ...item, ignoreCase: checked === true }
                                            : item
                                        )
                                      )
                                    }}
                                  />
                                  <span className="text-sm">
                                    {t("URL_REWRITE_FLAG_IGNORE_CASE_LABEL")}
                                  </span>
                                </Label>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-border/70 p-4">
                    <h2 className="mb-3 text-sm font-semibold">
                      {t("URL_REWRITE_PREVIEW_TITLE")}
                    </h2>
                    <div className="grid gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="url-rewrite-preview-input">
                          {t("URL_REWRITE_PREVIEW_RUN")}
                        </Label>
                        <Input
                          id="url-rewrite-preview-input"
                          value={previewInput}
                          onChange={(event) => setPreviewInput(event.target.value)}
                          placeholder={t("URL_REWRITE_PREVIEW_PLACEHOLDER")}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="url-rewrite-preview-output">
                          {t("URL_REWRITE_PREVIEW_OUTPUT")}
                        </Label>
                        <Textarea
                          id="url-rewrite-preview-output"
                          value={previewOutput ?? t("URL_REWRITE_PREVIEW_RULE_INVALID")}
                          readOnly
                          className="min-h-20"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </main>
      </AppMainCard>
    </>
  )
}
