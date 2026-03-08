import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
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
  settingsPluginMirrorExampleValue,
  settingsProxyExampleValue,
  useSettingsExampleText,
} from "./settings-example-text"
import type { SettingsConfigState } from "./utils"
import { saveProxySettingsConfig } from "./utils"

interface SettingsProxyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proxyDraft: string
  npmProxyDraft: string
  npmRegistryDraft: string
  onProxyDraftChange: (value: string) => void
  onNpmProxyDraftChange: (value: string) => void
  onNpmRegistryDraftChange: (value: string) => void
  onSaveConfig: (
    path: string | Partial<SettingsConfigState>,
    value?: unknown
  ) => Promise<boolean>
}

export function SettingsProxyDialog({
  open,
  onOpenChange,
  proxyDraft,
  npmProxyDraft,
  npmRegistryDraft,
  onProxyDraftChange,
  onNpmProxyDraftChange,
  onNpmRegistryDraftChange,
  onSaveConfig,
}: SettingsProxyDialogProps) {
  const { t } = useTranslation()
  const formatSettingsExampleText = useSettingsExampleText()

  const handleConfirm = async () => {
    const isSaved = await saveProxySettingsConfig(onSaveConfig, {
      proxy: proxyDraft,
      npmProxy: npmProxyDraft,
      npmRegistry: npmRegistryDraft,
    })

    if (isSaved) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("SETTINGS_SET_PROXY_AND_MIRROR")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="settings-proxy-upload">{t("SETTINGS_UPLOAD_PROXY")}</Label>
            <Input
              id="settings-proxy-upload"
              value={proxyDraft}
              placeholder={formatSettingsExampleText(settingsProxyExampleValue)}
              onChange={(event) => onProxyDraftChange(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="settings-proxy-npm">{t("SETTINGS_PLUGIN_INSTALL_PROXY")}</Label>
            <Input
              id="settings-proxy-npm"
              value={npmProxyDraft}
              placeholder={formatSettingsExampleText(settingsProxyExampleValue)}
              onChange={(event) => onNpmProxyDraftChange(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="settings-registry-npm">{t("SETTINGS_PLUGIN_INSTALL_MIRROR")}</Label>
            <Input
              id="settings-registry-npm"
              value={npmRegistryDraft}
              placeholder={formatSettingsExampleText(
                settingsPluginMirrorExampleValue
              )}
              onChange={(event) => onNpmRegistryDraftChange(event.target.value)}
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
