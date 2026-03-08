import { useTranslation } from "react-i18next"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { SettingsRow } from "./settings-row"
import {
  settingsStartupMode,
  type SettingsConfigState,
} from "./utils"

interface SettingsSectionGeneralProps {
  settingsConfig: SettingsConfigState
  isMac: boolean
  isItemVisible: (itemId: string) => boolean
  onSaveConfig: (
    path: string | Partial<SettingsConfigState>,
    value?: unknown
  ) => Promise<boolean>
}

export function SettingsSectionGeneral({
  settingsConfig,
  isMac,
  isItemVisible,
  onSaveConfig,
}: SettingsSectionGeneralProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-1">
      <SettingsRow
        hidden={!isItemVisible("language")}
        title={t("SETTINGS_CHOOSE_LANGUAGE")}
        control={
          <Select
            value={settingsConfig.language}
            onValueChange={(value) => {
              onSaveConfig("settings.language", value)
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t("SETTINGS_CHOOSE_LANGUAGE")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="zh-CN">简体中文</SelectItem>
              <SelectItem value="zh-TW">繁體中文</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <SettingsRow
        hidden={!isItemVisible("startup-mode")}
        title={t("SETTINGS_STARTUP_MODE")}
        control={
          <Select
            value={settingsConfig.startupMode}
            onValueChange={(value) => {
              onSaveConfig("settings.startupMode", value)
            }}
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder={t("SETTINGS_STARTUP_MODE")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={settingsStartupMode.MainWindow}>
                {t("SETTINGS_STARTUP_MODE_MAIN_WINDOW")}
              </SelectItem>
              {!isMac ? (
                <SelectItem value={settingsStartupMode.MiniWindow}>
                  {t("SETTINGS_STARTUP_MODE_MINI_WINDOW")}
                </SelectItem>
              ) : null}
              <SelectItem value={settingsStartupMode.Hide}>
                {t("SETTINGS_STARTUP_MODE_HIDE")}
              </SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <SettingsRow
        hidden={!isItemVisible("auto-start")}
        title={t("SETTINGS_LAUNCH_ON_BOOT")}
        control={
          <Switch
            checked={settingsConfig.autoStart}
            onCheckedChange={(checked) => {
              onSaveConfig("settings.autoStart", checked)
            }}
          />
        }
      />
    </div>
  )
}
