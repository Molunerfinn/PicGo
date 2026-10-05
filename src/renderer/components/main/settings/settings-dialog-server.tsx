import { useState } from "react"
import { useTranslation } from "react-i18next"
import { EyeIcon, EyeOffIcon } from "lucide-react"

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
  serverSecretDraft: string
  onServerHostDraftChange: (value: string) => void
  onServerPortDraftChange: (value: string) => void
  onServerEnableDraftChange: (value: boolean) => void
  onServerSecretDraftChange: (value: string) => void
}

export function SettingsServerDialog({
  open,
  onOpenChange,
  serverHostDraft,
  serverPortDraft,
  serverEnableDraft,
  serverSecretDraft,
  onServerHostDraftChange,
  onServerPortDraftChange,
  onServerEnableDraftChange,
  onServerSecretDraftChange,
}: SettingsServerDialogProps) {
  const { t } = useTranslation()
  const saveSettingsConfig = useSettingsSave()
  const [isSecretVisible, setIsSecretVisible] = useState(false)

  // Mask the secret again whenever the dialog closes, so it always reopens hidden.
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setIsSecretVisible(false)
    onOpenChange(nextOpen)
  }

  const handleConfirm = async () => {
    const port = Number(serverPortDraft)
    const nextServer = {
      host: serverHostDraft,
      port: Number.isFinite(port) ? port : 36677,
      enable: serverEnableDraft,
      // Core trims the secret and treats an empty value as "authentication disabled".
      secret: serverSecretDraft.trim(),
    }

    const isSaved = await saveSettingsConfig("settings.server", nextServer)
    if (isSaved) {
      handleOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
              <div className="space-y-1.5">
                <Label htmlFor="settings-server-secret">{t("SETTINGS_SET_SERVER_SECRET")}</Label>
                <div className="relative">
                  <Input
                    id="settings-server-secret"
                    type={isSecretVisible ? "text" : "password"}
                    autoComplete="off"
                    className="pr-10"
                    value={serverSecretDraft}
                    onChange={(event) => onServerSecretDraftChange(event.target.value)}
                    placeholder={t("SETTINGS_TIP_PLACEHOLDER_SECRET")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="absolute top-1/2 right-1 -translate-y-1/2"
                    aria-label={t(isSecretVisible ? "SETTINGS_HIDE_SECRET" : "SETTINGS_SHOW_SECRET")}
                    onClick={() => setIsSecretVisible((prev) => !prev)}
                  >
                    {isSecretVisible ? (
                      <EyeOffIcon className="size-4" />
                    ) : (
                      <EyeIcon className="size-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{t("SETTINGS_TIPS_SERVER_SECRET")}</p>
              </div>
            </>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {t("CANCEL")}
          </Button>
          <Button onClick={handleConfirm}>{t("CONFIRM")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
