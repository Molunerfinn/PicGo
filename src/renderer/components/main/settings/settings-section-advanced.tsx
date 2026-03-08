import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  openSettingsConfigFile,
  openSettingsLogFile,
} from "./side-effect-utils"
import { SettingsLogDialog } from "./settings-dialog-log"
import { SettingsRow } from "./settings-row"
import type { SettingsConfigState } from "./utils"

interface SettingsSectionAdvancedProps {
  settingsConfig: SettingsConfigState
  isItemVisible: (itemId: string) => boolean
  isAnyItemVisible: (itemIds: string[]) => boolean
  onSaveConfig: (
    path: string | Partial<SettingsConfigState>,
    value?: unknown
  ) => Promise<boolean>
  onNavigateUrlRewrite: () => void
}

function resolveErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}

export function SettingsSectionAdvanced({
  settingsConfig,
  isItemVisible,
  isAnyItemVisible,
  onSaveConfig,
  onNavigateUrlRewrite,
}: SettingsSectionAdvancedProps) {
  const { t } = useTranslation()
  const [isLogDialogOpen, setLogDialogOpen] = useState(false)
  const [logLevelDraft, setLogLevelDraft] = useState(settingsConfig.logLevel)
  const [logSizeDraft, setLogSizeDraft] = useState(String(settingsConfig.logFileSizeLimit))

  const handleOpenConfigFile = async () => {
    try {
      const filePath = await openSettingsConfigFile()
      toast.success(`${t("SETTINGS_OPEN_CONFIG_FILE")}: ${filePath}`)
    } catch (error) {
      toast.error(resolveErrorMessage(error, t("FAILED")))
    }
  }

  const handleOpenLogFile = async () => {
    try {
      const filePath = await openSettingsLogFile()
      toast.success(`${t("SETTINGS_LOG_FILE")}: ${filePath}`)
    } catch (error) {
      toast.error(resolveErrorMessage(error, t("FAILED")))
    }
  }

  return (
    <>
      <div className="space-y-1">
        <SettingsRow
          hidden={!isAnyItemVisible(["log-level", "log-size"])}
          title={t("SETTINGS_SET_LOG_FILE")}
          control={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setLogLevelDraft(settingsConfig.logLevel)
                setLogSizeDraft(String(settingsConfig.logFileSizeLimit))
                setLogDialogOpen(true)
              }}
            >
              {t("SETTINGS_CLICK_TO_SET")}
            </Button>
          }
        />
        <SettingsRow
          hidden={!isItemVisible("open-config-file")}
          title={t("SETTINGS_OPEN_CONFIG_FILE")}
          control={
            <Button
              type="button"
              variant="outline"
              onClick={handleOpenConfigFile}
            >
              {t("SETTINGS_CLICK_TO_OPEN")}
            </Button>
          }
        />
        <SettingsRow
          hidden={!isItemVisible("open-log-file")}
          title={t("SETTINGS_LOG_FILE")}
          control={
            <Button
              type="button"
              variant="outline"
              onClick={handleOpenLogFile}
            >
              {t("SETTINGS_CLICK_TO_OPEN")}
            </Button>
          }
        />
        <SettingsRow
          hidden={!isItemVisible("url-rewrite-entry")}
          title={t("SETTINGS_URL_REWRITE")}
          control={
            <Button type="button" variant="outline" onClick={onNavigateUrlRewrite}>
              {t("SETTINGS_CLICK_TO_SET")}
            </Button>
          }
        />
      </div>

      <SettingsLogDialog
        open={isLogDialogOpen}
        onOpenChange={setLogDialogOpen}
        logLevelDraft={logLevelDraft}
        logSizeDraft={logSizeDraft}
        onLogLevelDraftChange={setLogLevelDraft}
        onLogSizeDraftChange={setLogSizeDraft}
        onSaveConfig={onSaveConfig}
      />
    </>
  )
}
