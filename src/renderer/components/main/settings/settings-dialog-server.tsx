import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { SettingsRow } from "./settings-row"
import { useSettingsSave } from "./use-settings-save"

interface SettingsServerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serverHostDraft: string
  serverPortDraft: string
  serverEnableDraft: boolean
  onServerHostDraftChange: (value: string) => void
  onServerPortDraftChange: (value: string) => void
  onServerEnableDraftChange: (value: boolean) => void
}

export function SettingsServerDialog({
  open,
  onOpenChange,
  serverHostDraft,
  serverPortDraft,
  serverEnableDraft,
  onServerHostDraftChange,
  onServerPortDraftChange,
  onServerEnableDraftChange,
}: SettingsServerDialogProps) {
  const { t } = useTranslation()
  const saveSettingsConfig = useSettingsSave()

  const handleConfirm = async () => {
    const port = Number(serverPortDraft)
    const nextServer = {
      host: serverHostDraft,
      port: Number.isFinite(port) ? port : 36677,
      enable: serverEnableDraft,
    }

    const isSaved = await saveSettingsConfig("settings.server", nextServer)
    if (isSaved) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("SETTINGS_SET_PICGO_SERVER")}</DialogTitle>
          <DialogDescription>{t("SETTINGS_TIPS_SERVER_NOTICE")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <SettingsRow
            title={t("SETTINGS_ENABLE_SERVER")}
            control={
              <Switch
                checked={serverEnableDraft}
                onCheckedChange={(checked) => onServerEnableDraftChange(checked === true)}
              />
            }
          />
          {serverEnableDraft ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="settings-server-host">{t("SETTINGS_SET_SERVER_HOST")}</Label>
                <Input
                  id="settings-server-host"
                  value={serverHostDraft}
                  onChange={(event) => onServerHostDraftChange(event.target.value)}
                  placeholder={t("SETTINGS_TIP_PLACEHOLDER_HOST")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="settings-server-port">{t("SETTINGS_SET_SERVER_PORT")}</Label>
                <Input
                  id="settings-server-port"
                  value={serverPortDraft}
                  onChange={(event) => onServerPortDraftChange(event.target.value)}
                  placeholder={t("SETTINGS_TIP_PLACEHOLDER_PORT")}
                />
              </div>
            </>
          ) : null}
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
