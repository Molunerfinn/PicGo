import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"

export const settingsCustomLinkFormatExampleValue = "[$fileName]($url)"
export const settingsProxyExampleValue = "http://127.0.0.1:1080"
export const settingsPluginMirrorExampleValue = "https://registry.npmmirror.com"

export function buildSettingsExampleText(
  t: TFunction,
  value: string
): string {
  return t("COMMON_FOR_EXAMPLE", { value })
}

export function useSettingsExampleText() {
  const { t } = useTranslation()
  return (value: string) => buildSettingsExampleText(t, value)
}
