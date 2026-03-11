import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useAppStore } from "@/store"
import { SettingsCustomLinkDialog } from "./settings-dialog-custom-link"
import {
  settingsCustomLinkFormatExampleValue,
  useSettingsExampleText,
} from "./settings-example-text"
import { SettingsRow } from "./settings-row"
import { useSettingsSave } from "./use-settings-save"
import { defaultSettingsConfig } from "./utils"

interface SettingsSectionUploadWorkflowProps {
  isItemVisible: (itemId: string) => boolean
}

export function SettingsSectionUploadWorkflow({
  isItemVisible,
}: SettingsSectionUploadWorkflowProps) {
  const { t } = useTranslation()
  const appConfig = useAppStore.use.appConfig()
  const settingsConfig = appConfig?.settings ?? defaultSettingsConfig
  const formatSettingsExampleText = useSettingsExampleText()
  const saveSettingsConfig = useSettingsSave()
  const customLinkFormatExample = formatSettingsExampleText(
    settingsCustomLinkFormatExampleValue
  )
  const [isCustomLinkOpen, setCustomLinkOpen] = useState(false)
  const [customLinkDraft, setCustomLinkDraft] = useState(settingsConfig.customLink)

  return (
    <>
      <div className="space-y-1">
        <SettingsRow
          hidden={!isItemVisible("rename-before-upload")}
          title={t("SETTINGS_RENAME_BEFORE_UPLOAD")}
          control={
            <Switch
              checked={settingsConfig.rename}
              onCheckedChange={(checked) => {
                saveSettingsConfig("settings.rename", checked)
              }}
            />
          }
        />
        <SettingsRow
          hidden={!isItemVisible("timestamp-rename")}
          title={t("SETTINGS_TIMESTAMP_RENAME")}
          control={
            <Switch
              checked={settingsConfig.autoRename}
              onCheckedChange={(checked) => {
                saveSettingsConfig("settings.autoRename", checked)
              }}
            />
          }
        />
        <SettingsRow
          hidden={!isItemVisible("auto-copy-url")}
          title={t("SETTINGS_AUTO_COPY_URL_AFTER_UPLOAD")}
          control={
            <Switch
              checked={settingsConfig.autoCopyUrl}
              onCheckedChange={(checked) => {
                saveSettingsConfig("settings.autoCopyUrl", checked)
              }}
            />
          }
        />
        <SettingsRow
          hidden={!isItemVisible("builtin-clipboard")}
          title={t("SETTINGS_USE_BUILTIN_CLIPBOARD_UPLOAD")}
          description={t("BUILTIN_CLIPBOARD_TIPS")}
          control={
            <Switch
              checked={settingsConfig.useBuiltinClipboard}
              onCheckedChange={(checked) => {
                saveSettingsConfig("settings.useBuiltinClipboard", checked)
              }}
            />
          }
        />
        <SettingsRow
          hidden={!isItemVisible("encode-output-url")}
          title={t("SETTINGS_ENCODE_OUTPUT_URL")}
          control={
            <Switch
              checked={settingsConfig.encodeOutputURL}
              onCheckedChange={(checked) => {
                saveSettingsConfig("settings.encodeOutputURL", checked)
              }}
            />
          }
        />
        <SettingsRow
          hidden={!isItemVisible("upload-notification")}
          title={t("SETTINGS_OPEN_UPLOAD_TIPS")}
          control={
            <Switch
              checked={settingsConfig.uploadNotification}
              onCheckedChange={(checked) => {
                saveSettingsConfig("settings.uploadNotification", checked)
              }}
            />
          }
        />
        <SettingsRow
          hidden={!isItemVisible("notification-sound")}
          title={t("SETTINGS_NOTIFICATION_SOUND")}
          control={
            <Switch
              checked={settingsConfig.notificationSound}
              onCheckedChange={(checked) => {
                saveSettingsConfig("settings.notificationSound", checked)
              }}
            />
          }
        />
        <SettingsRow
          hidden={!isItemVisible("custom-link-format")}
          title={t("SETTINGS_CUSTOM_LINK_FORMAT")}
          description={customLinkFormatExample}
          control={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCustomLinkDraft(settingsConfig.customLink)
                setCustomLinkOpen(true)
              }}
            >
              {t("SETTINGS_CLICK_TO_SET")}
            </Button>
          }
        />
      </div>

      <SettingsCustomLinkDialog
        open={isCustomLinkOpen}
        onOpenChange={setCustomLinkOpen}
        customLinkDraft={customLinkDraft}
        onCustomLinkDraftChange={setCustomLinkDraft}
      />
    </>
  )
}
