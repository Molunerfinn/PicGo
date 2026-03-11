import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { IStartupMode } from "~/universal/types/enum"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { settingsStoreActions, useAppStore } from "@/store"
import { SettingsRow } from "./settings-row"
import { useSettingsSave } from "./use-settings-save"
import {
  defaultSettingsConfig,
} from "./utils"

interface SettingsSectionGeneralProps {
  isMac: boolean
  isItemVisible: (itemId: string) => boolean
}

export function SettingsSectionGeneral({
  isMac,
  isItemVisible,
}: SettingsSectionGeneralProps) {
  const { t } = useTranslation()
  const appConfig = useAppStore.use.appConfig()
  const settingsConfig = appConfig?.settings ?? defaultSettingsConfig
  const saveSettingsConfig = useSettingsSave()

  const handleLanguageChange = async (value: string) => {
    try {
      await settingsStoreActions.saveLanguage(value)
      toast.success(t("SUCCESS"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("FAILED"))
    }
  }

  return (
    <div className="space-y-1">
      <SettingsRow
        hidden={!isItemVisible("language")}
        title={t("SETTINGS_CHOOSE_LANGUAGE")}
        control={
          <Select
            value={settingsConfig.language}
            onValueChange={(value) => {
              if (typeof value === "string") {
                handleLanguageChange(value)
              }
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
              saveSettingsConfig("settings.startupMode", value)
            }}
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder={t("SETTINGS_STARTUP_MODE")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={IStartupMode.SHOW_MAIN_WINDOW}>
                {t("SETTINGS_STARTUP_MODE_MAIN_WINDOW")}
              </SelectItem>
              {!isMac ? (
                <SelectItem value={IStartupMode.SHOW_MINI_WINDOW}>
                  {t("SETTINGS_STARTUP_MODE_MINI_WINDOW")}
                </SelectItem>
              ) : null}
              <SelectItem value={IStartupMode.HIDE}>
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
              saveSettingsConfig("settings.autoStart", checked)
            }}
          />
        }
      />
    </div>
  )
}
