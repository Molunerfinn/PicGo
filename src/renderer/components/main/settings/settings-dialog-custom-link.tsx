import { useTranslation } from "react-i18next"
import { toast } from "sonner"

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
import {
  settingsCustomLinkFormatExampleValue,
  useSettingsExampleText,
} from "./settings-example-text"
import { useSettingsSave } from "./use-settings-save"

interface SettingsCustomLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customLinkDraft: string
  onCustomLinkDraftChange: (nextCustomLink: string) => void
}

export function SettingsCustomLinkDialog({
  open,
  onOpenChange,
  customLinkDraft,
  onCustomLinkDraftChange,
}: SettingsCustomLinkDialogProps) {
  const { t } = useTranslation()
  const formatSettingsExampleText = useSettingsExampleText()
  const saveSettingsConfig = useSettingsSave()

  const handleConfirm = async () => {
    const isValid =
      customLinkDraft.includes("$url") ||
      customLinkDraft.includes("$fileName") ||
      customLinkDraft.includes("$extName")

    if (!isValid) {
      toast.error(t("TIPS_MUST_CONTAINS_URL"))
      return
    }

    const isSaved = await saveSettingsConfig("settings.customLink", customLinkDraft)
    if (isSaved) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("SETTINGS_CUSTOM_LINK_FORMAT")}</DialogTitle>
          <DialogDescription>
            <span className="block">{t("SETTINGS_TIPS_PLACEHOLDER_URL")}</span>
            <span className="block">
              {t("SETTINGS_TIPS_PLACEHOLDER_FILENAME")}
            </span>
            <span className="block">
              {t("SETTINGS_TIPS_PLACEHOLDER_EXTNAME")}
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="settings-custom-link-input">{t("INPUT")}</Label>
          <Input
            id="settings-custom-link-input"
            value={customLinkDraft}
            placeholder={formatSettingsExampleText(
              settingsCustomLinkFormatExampleValue
            )}
            onChange={(event) => onCustomLinkDraftChange(event.target.value)}
          />
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
