import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { settingsStoreActions, useAppStore } from "@/store"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { SettingsRow } from "./settings-row"
import { useSettingsSave } from "./use-settings-save"
import {
  defaultSettingsConfig,
  settingsAppearance,
} from "./utils"

interface SettingsSectionAppearanceProps {
  isMac: boolean
  isItemVisible: (itemId: string) => boolean
}

export function SettingsSectionAppearance({
  isMac,
  isItemVisible,
}: SettingsSectionAppearanceProps) {
  const { t } = useTranslation()
  const appConfig = useAppStore.use.appConfig()
  const providers = useAppStore.use.providers()
  const settingsConfig = appConfig?.settings ?? defaultSettingsConfig
  const visiblePicBedNames = (appConfig?.picBed.list ?? [])
    .filter((provider) => provider.visible)
    .map((provider) => provider.name)
  const saveSettingsConfig = useSettingsSave()

  const handleVisibleProviderChange = async (
    providerName: string,
    nextChecked: boolean
  ) => {
    const nextNames = nextChecked
      ? Array.from(new Set([...visiblePicBedNames, providerName]))
      : visiblePicBedNames.filter((name) => name !== providerName)

    try {
      await settingsStoreActions.saveVisiblePicBedNames(nextNames)
      toast.success(t("SUCCESS"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("FAILED"))
    }
  }

  return (
    <div className="space-y-1">
      <SettingsRow
        hidden={!isItemVisible("appearance-mode")}
        title={t("SETTINGS_APPEARANCE_MODE")}
        control={
          <Select
            value={settingsConfig.appearance}
            onValueChange={(value) => {
              saveSettingsConfig("settings.appearance", value)
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t("SETTINGS_APPEARANCE_MODE")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={settingsAppearance.Light}>
                {t("SETTINGS_APPEARANCE_MODE_LIGHT")}
              </SelectItem>
              <SelectItem value={settingsAppearance.Dark}>
                {t("SETTINGS_APPEARANCE_MODE_DARK")}
              </SelectItem>
              <SelectItem value={settingsAppearance.Auto}>
                {t("SETTINGS_APPEARANCE_MODE_AUTO")}
              </SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <SettingsRow
        hidden={!isMac || !isItemVisible("show-dock-icon")}
        title={t("SETTINGS_SHOW_DOCK_ICON")}
        control={
          <Switch
            checked={settingsConfig.showDockIcon}
            onCheckedChange={(checked) => {
              saveSettingsConfig("settings.showDockIcon", checked)
            }}
          />
        }
      />

      <SettingsRow
        hidden={!isMac || !isItemVisible("show-menubar-icon")}
        title={t("SETTINGS_SHOW_MENUBAR_ICON")}
        description={t("SETTINGS_SHOW_MENUBAR_ICON_TIPS")}
        control={
          <Switch
            checked={settingsConfig.showMenubarIcon}
            onCheckedChange={(checked) => {
              saveSettingsConfig("settings.showMenubarIcon", checked)
            }}
          />
        }
      />

      <SettingsRow
        hidden={isMac || !isItemVisible("mini-window-on-top")}
        title={t("SETTINGS_MINI_WINDOW_ON_TOP")}
        control={
          <Switch
            checked={settingsConfig.miniWindowOnTop}
            onCheckedChange={async (checked) => {
              const isSaved = await saveSettingsConfig("settings.miniWindowOnTop", checked)
              if (isSaved) {
                toast.info(t("TIPS_NEED_RELOAD"))
              }
            }}
          />
        }
      />

      <SettingsRow
        hidden={!isItemVisible("visible-providers")}
        title={t("CHOOSE_SHOWED_PICBED")}
        titleClassName="line-clamp-2 max-w-36 sm:max-w-40 md:max-w-48 lg:max-w-56"
        titleContainerClassName="sm:shrink-0 sm:flex-none sm:basis-40 md:basis-48 lg:basis-56"
        controlContainerClassName="sm:w-full sm:min-w-0 sm:flex-1 sm:justify-start"
        control={
          <div className="grid w-full min-w-0 gap-2 min-[1200px]:grid-cols-2">
            {providers.map((provider) => {
              const checked = visiblePicBedNames.includes(provider.name)

              return (
                <Label
                  key={provider.id}
                  className="w-full min-w-0 items-start gap-3 rounded-md border border-border px-3 py-2 min-[1200px]:items-center"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={async (nextChecked) => {
                      await handleVisibleProviderChange(
                        provider.name,
                        nextChecked === true
                      )
                    }}
                  />
                  <span
                    className="min-w-0 text-sm leading-5 break-words line-clamp-2 min-[1200px]:line-clamp-1"
                    title={provider.name}
                  >
                    {provider.name}
                  </span>
                </Label>
              )
            })}
          </div>
        }
      />
    </div>
  )
}
