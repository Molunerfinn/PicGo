import { ExternalLinkIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { settingsStoreActions, useAppStore } from "@/store"
import { openSettingsExternalUrl } from "./side-effect-utils"
import { SettingsRow } from "./settings-row"
import { defaultSettingsConfig } from "./utils"
import { useSettingsSave } from "./use-settings-save"

interface SettingsSectionAboutProps {
  isItemVisible: (itemId: string) => boolean
}

const aboutLinks = [
  {
    id: "website",
    labelKey: "SETTINGS_LINK_WEBSITE",
    url: "https://picgo.app/",
    searchItemId: "about-link-website",
  },
  {
    id: "github",
    labelKey: "SETTINGS_LINK_GITHUB",
    url: "https://github.com/Molunerfinn/PicGo",
    searchItemId: "about-link-github",
  },
  {
    id: "docs",
    labelKey: "SETTINGS_LINK_DOCS",
    url: "https://docs.picgo.app/gui/",
    searchItemId: "about-link-docs",
  },
  {
    id: "privacy",
    labelKey: "SETTINGS_LINK_PRIVACY",
    url: "https://picgo.app/privacy/",
    searchItemId: "about-link-privacy",
  },
  {
    id: "terms",
    labelKey: "SETTINGS_LINK_TERMS",
    url: "https://picgo.app/terms/",
    searchItemId: "about-link-terms",
  },
] as const

function resolveErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}

export function SettingsSectionAbout({
  isItemVisible,
}: SettingsSectionAboutProps) {
  const { t } = useTranslation()
  const appConfig = useAppStore.use.appConfig()
  const settingsVersion = useAppStore.use.settingsVersion()
  const settingsConfig = appConfig?.settings ?? defaultSettingsConfig
  const saveSettingsConfig = useSettingsSave()
  const [isCheckingUpdates, setCheckingUpdates] = useState(false)

  const runCheckUpdates = async () => {
    setCheckingUpdates(true)

    try {
      const result = await settingsStoreActions.checkUpdates()
      if (result.hasUpdate) {
        toast.success(`${t("SETTINGS_NEWEST_VERSION")}: ${result.latestVersion}`)
      } else {
        toast.success(`${t("SETTINGS_CURRENT_VERSION")} ${result.currentVersion}`)
      }
    } catch (error) {
      toast.error(resolveErrorMessage(error, t("FAILED")))
    } finally {
      setCheckingUpdates(false)
    }
  }

  const handleCheckUpdates = async () => {
    await runCheckUpdates()
  }

  const handleOpenExternalUrl = async (url: string) => {
    try {
      await openSettingsExternalUrl(url)
      toast.success(t("SUCCESS"))
    } catch (error) {
      toast.error(resolveErrorMessage(error, t("FAILED")))
    }
  }

  return (
    <div className="space-y-6">
      {isItemVisible("about-version") ? (
        <div className="flex items-center gap-4 rounded-xl border border-border px-4 py-4">
          <img
            src="https://pics.molunerfinn.com/doc/picgo-logo.png"
            alt="PicGo Logo"
            className="size-14 object-contain"
          />
          <div>
            <div className="text-lg font-semibold">PicGo</div>
            <div className="text-muted-foreground text-sm">
              {t("SETTINGS_CURRENT_VERSION")}: {settingsVersion.currentVersion}
            </div>
            {settingsVersion.latestVersion ? (
              <div className="text-muted-foreground text-sm">
                {t("SETTINGS_NEWEST_VERSION")}: {settingsVersion.latestVersion}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="space-y-1">
        <SettingsRow
          hidden={!isItemVisible("about-update")}
          title={t("SETTINGS_OPEN_UPDATE_HELPER")}
          control={
            <Switch
              checked={settingsConfig.showUpdateTip}
              onCheckedChange={(checked) => {
                saveSettingsConfig("settings.showUpdateTip", checked)
              }}
            />
          }
        />
        {settingsConfig.showUpdateTip ? (
          <SettingsRow
            hidden={!isItemVisible("about-update")}
            title={t("SETTINGS_ACCEPT_BETA_UPDATE")}
            control={
              <Switch
                checked={settingsConfig.checkBetaUpdate}
                onCheckedChange={(checked) => {
                  saveSettingsConfig("settings.checkBetaUpdate", checked)
                }}
              />
            }
          />
        ) : null}
        <SettingsRow
          hidden={!isItemVisible("about-update")}
          title={t("SETTINGS_CHECK_UPDATE")}
          control={
            <Button
              type="button"
              onClick={handleCheckUpdates}
              disabled={isCheckingUpdates}
            >
              {isCheckingUpdates
                ? `${t("SETTINGS_GETING")}...`
                : t("SETTINGS_CLICK_TO_CHECK")}
            </Button>
          }
        />
      </div>

      {aboutLinks.some((link) => isItemVisible(link.searchItemId)) ? (
        <div className="rounded-xl border border-border">
          {aboutLinks
            .filter((link) => isItemVisible(link.searchItemId))
            .map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={async () => {
                  await handleOpenExternalUrl(link.url)
                }}
                className={cn(
                  "border-border/60 hover:bg-muted/40 flex w-full cursor-pointer items-center justify-between border-b px-4 py-3 text-left transition-colors last:border-b-0"
                )}
              >
                <span className="text-sm font-medium">{t(link.labelKey)}</span>
                <ExternalLinkIcon className="text-muted-foreground size-4" />
              </button>
            ))}
        </div>
      ) : null}
    </div>
  )
}
