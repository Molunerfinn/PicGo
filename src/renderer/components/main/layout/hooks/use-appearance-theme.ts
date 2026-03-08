import { useEffect, useState } from "react"

import {
  defaultSettingsConfig,
  settingsAppearance,
} from "@/components/main/settings/utils"
import { useAppStore } from "@/store"

const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)"

function resolveInitialPrefersDark() {
  if (typeof window === "undefined") {
    return false
  }

  return window.matchMedia(DARK_MEDIA_QUERY).matches
}

export function useAppearanceTheme() {
  const [prefersDark, setPrefersDark] = useState(resolveInitialPrefersDark)
  const ensureSettingsHydrated = useAppStore((state) => state.ensureSettingsHydrated)
  const saveSettingsConfig = useAppStore((state) => state.saveSettingsConfig)
  const appearance = useAppStore(
    (state) =>
      state.appConfig?.settings.appearance ?? defaultSettingsConfig.appearance
  )

  const isDark =
    appearance === settingsAppearance.Dark ||
    (appearance === settingsAppearance.Auto && prefersDark)

  useEffect(() => {
    async function bootstrapAppearanceTheme () {
      try {
        await ensureSettingsHydrated()
      } catch (error) {
        console.error(error)
      }
    }

    bootstrapAppearanceTheme()
  }, [ensureSettingsHydrated])

  useEffect(() => {
    const mediaQuery = window.matchMedia(DARK_MEDIA_QUERY)
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersDark(event.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
  }, [isDark])

  const toggleTheme = async () => {
    const nextAppearance = isDark
      ? settingsAppearance.Light
      : settingsAppearance.Dark

    await saveSettingsConfig("settings.appearance", nextAppearance)
  }

  return {
    isDark,
    toggleTheme,
  }
}
