import { useTranslation } from "react-i18next"
import { toast } from "sonner"

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
import { settingsStoreActions } from "@/store"
import {
  settingsPluginMirrorExampleValue,
  settingsProxyExampleValue,
  useSettingsExampleText,
} from "./settings-example-text"

interface SettingsProxyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proxyDraft: string
  npmProxyDraft: string
  npmRegistryDraft: string
  onProxyDraftChange: (value: string) => void
  onNpmProxyDraftChange: (value: string) => void
  onNpmRegistryDraftChange: (value: string) => void
}

function resolveErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
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
}: SettingsProxyDialogProps) {
  const { t } = useTranslation()
  const formatSettingsExampleText = useSettingsExampleText()
  const handleConfirm = async () => {
    try {
      await settingsStoreActions.saveSettingsConfig({
        npmProxy: npmProxyDraft,
        npmRegistry: npmRegistryDraft,
      })
      await settingsStoreActions.savePicBedProxy(proxyDraft)
      toast.success(t("TIPS_SET_SUCCEED"))
      onOpenChange(false)
    } catch (error) {
      toast.error(resolveErrorMessage(error, t("FAILED")))
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
