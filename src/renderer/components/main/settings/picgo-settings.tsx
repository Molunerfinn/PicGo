import { useEffect } from "react"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { toast } from "sonner"

import { appActions, useAppStore, useSettingsStore } from "@/store"
import i18n from "@/i18n"
import { isMacOS } from "@/utils/bridge"
import { SettingsPanel } from "./settings-panel"
import { SettingsSidebar } from "./settings-sidebar"
import {
  allSettingsSections,
  buildSettingsSearchItems,
  defaultSettingsConfig,
  filterSettingsSectionsBySearch,
  isValidSettingsSection,
  resolveSettingsSection,
  settingsSectionId,
  type SettingsSectionId,
} from "./utils"

type SettingsRouteSearch = {
  section?: string
}

function resolveErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}

export function PicGoSettings() {
  const navigate = useNavigate()
  const search = useSearch({ from: "/main/settings/settings" }) as SettingsRouteSearch

  const providers = useAppStore.use.providers()
  const appConfig = useAppStore.use.appConfig()
  const settingsSearchValue = useSettingsStore.use.searchValue()
  const settingsConfig = appConfig?.settings ?? defaultSettingsConfig
  const picBedProxy = appConfig?.picBed.proxy ?? ""

  const queriedSection = search.section
  const selectedSection = resolveSettingsSection(queriedSection)

  const searchItems = buildSettingsSearchItems(settingsConfig, providers, picBedProxy)
  const { matchedSections, matchedItemIds, hasQuery } = filterSettingsSectionsBySearch(
    allSettingsSections,
    searchItems,
    settingsSearchValue
  )

  useEffect(() => {
    let isDisposed = false

    async function bootstrap() {
      try {
        await appActions.ensureHydrated()
        await appActions.ensureSettingsHydrated()
      } catch (error) {
        if (!isDisposed) {
          toast.error(resolveErrorMessage(error, "Failed"))
        }
      }
    }

    bootstrap()

    return () => {
      isDisposed = true
    }
  }, [])

  useEffect(() => {
    if (isValidSettingsSection(queriedSection)) {
      return
    }

    navigate({
      to: "/main/settings/settings",
      search: (prev) => ({
        ...prev,
        section: settingsSectionId.General,
      }),
      replace: true,
    })
  }, [navigate, queriedSection])

  useEffect(() => {
    if (i18n.language === settingsConfig.language) {
      return
    }

    i18n.changeLanguage(settingsConfig.language)
  }, [settingsConfig.language])

  useEffect(() => {
    if (!hasQuery || matchedSections.length === 0) {
      return
    }

    const firstMatchedSection = matchedSections[0]
    if (selectedSection === firstMatchedSection) {
      return
    }

    navigate({
      to: "/main/settings/settings",
      search: (prev) => ({
        ...prev,
        section: firstMatchedSection,
      }),
      replace: true,
    })
  }, [hasQuery, matchedSections, navigate, selectedSection])

  const handleSelectSection = (section: SettingsSectionId) => {
    navigate({
      to: "/main/settings/settings",
      search: (prev) => ({
        ...prev,
        section,
      }),
    })
  }

  return (
    <>
      <SettingsSidebar
        selectedSection={selectedSection}
        matchedSections={matchedSections}
        matchedItemIds={matchedItemIds}
        isAdvancedRoute={false}
        activeAdvancedRoute={null}
        onSelectSection={handleSelectSection}
        onNavigateRoute={(to) => navigate({ to })}
      />

      <SettingsPanel
        selectedSection={selectedSection}
        hasSearch={hasQuery}
        matchedItemIds={matchedItemIds}
        isMac={isMacOS()}
        onNavigateUrlRewrite={() => navigate({ to: "/main/settings/url-rewrite" })}
      />
    </>
  )
}
