import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  isLogLevelOptionDisabled,
  sanitizeNumericInput,
  saveLogSettingsConfig,
  settingLogLevel,
  toggleLogLevelDraft,
  type SettingLogLevel,
} from "./utils"
import { useSettingsSave } from "./use-settings-save"

interface SettingsLogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  logLevelDraft: string[]
  logSizeDraft: string
  onLogLevelDraftChange: (nextLogLevel: string[]) => void
  onLogSizeDraftChange: (nextLogSize: string) => void
}

export function SettingsLogDialog({
  open,
  onOpenChange,
  logLevelDraft,
  logSizeDraft,
  onLogLevelDraftChange,
  onLogSizeDraftChange,
}: SettingsLogDialogProps) {
  const { t } = useTranslation()
  const saveSettingsConfig = useSettingsSave()

  const logLevelOptions: Array<{ id: SettingLogLevel; label: string }> = [
    { id: settingLogLevel.All, label: t("SETTINGS_LOG_LEVEL_ALL") },
    { id: settingLogLevel.Success, label: t("SETTINGS_LOG_LEVEL_SUCCESS") },
    { id: settingLogLevel.Error, label: t("SETTINGS_LOG_LEVEL_ERROR") },
    { id: settingLogLevel.Info, label: t("SETTINGS_LOG_LEVEL_INFO") },
    { id: settingLogLevel.Warn, label: t("SETTINGS_LOG_LEVEL_WARN") },
    { id: settingLogLevel.None, label: t("SETTINGS_LOG_LEVEL_NONE") },
  ]

  const handleConfirm = async () => {
    if (logLevelDraft.length === 0) {
      toast.error(t("TIPS_PLEASE_CHOOSE_LOG_LEVEL"))
      return
    }

    const isSaved = await saveLogSettingsConfig(saveSettingsConfig, {
      logLevel: logLevelDraft,
      logFileSizeLimit: logSizeDraft,
    })

    if (isSaved) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("SETTINGS_SET_LOG_FILE")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("SETTINGS_LOG_LEVEL")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {logLevelOptions.map((item) => {
                const checked = logLevelDraft.includes(item.id)
                const disabled = isLogLevelOptionDisabled(logLevelDraft, item.id)

                return (
                  <Label
                    key={item.id}
                    className="group/log-level gap-3 rounded-md border border-border px-3 py-2 transition-colors cursor-pointer data-[disabled=true]:cursor-not-allowed data-[disabled=true]:border-border/70 data-[disabled=true]:bg-muted/20 data-[disabled=true]:opacity-55"
                    data-disabled={disabled ? "true" : "false"}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={disabled}
                      onCheckedChange={(nextChecked) => {
                        onLogLevelDraftChange(
                          toggleLogLevelDraft(logLevelDraft, item.id, nextChecked === true)
                        )
                      }}
                    />
                    <span className="text-sm group-data-[disabled=true]/log-level:text-muted-foreground">
                      {item.label}
                    </span>
                  </Label>
                )
              })}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="settings-log-size">{t("SETTINGS_LOG_FILE_SIZE")} (MB)</Label>
            <Input
              id="settings-log-size"
              value={logSizeDraft}
              inputMode="numeric"
              pattern="[0-9]*"
              onChange={(event) =>
                onLogSizeDraftChange(sanitizeNumericInput(event.target.value))
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("CANCEL")}
          </Button>
          <Button onClick={handleConfirm}>{t("CONFIRM")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
