import { useEffect } from "react"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { toast } from "sonner"

import { isMacOS } from "@/lib/platform"
import { useAppStore } from "@/store"
import i18n from "@/i18n"
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

  const providers = useAppStore((state) => state.providers)
  const settingsConfig = useAppStore(
    (state) => state.appConfig?.settings ?? defaultSettingsConfig
  )
  const settingsVersion = useAppStore((state) => state.settingsVersion)
  const settingsPage = useAppStore((state) => state.settingsPage)
  const ensureHydrated = useAppStore((state) => state.ensureHydrated)
  const ensureSettingsHydrated = useAppStore((state) => state.ensureSettingsHydrated)
  const setSettingsSearchValue = useAppStore((state) => state.setSettingsSearchValue)

  const queriedSection = search.section
  const selectedSection = resolveSettingsSection(queriedSection)

  const searchItems = buildSettingsSearchItems(settingsConfig, providers)
  const { matchedSections, matchedItemIds, hasQuery } = filterSettingsSectionsBySearch(
    allSettingsSections,
    searchItems,
    settingsPage.searchValue
  )

  useEffect(() => {
    let isDisposed = false

    async function bootstrap() {
      try {
        await ensureHydrated()
        await ensureSettingsHydrated()
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
  }, [ensureHydrated, ensureSettingsHydrated])

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
        searchValue={settingsPage.searchValue}
        matchedSections={matchedSections}
        matchedItemIds={matchedItemIds}
        isAdvancedRoute={false}
        activeAdvancedRoute={null}
        onSearchValueChange={setSettingsSearchValue}
        onSelectSection={handleSelectSection}
        onNavigateRoute={(to) => navigate({ to })}
      />

      <SettingsPanel
        selectedSection={selectedSection}
        hasSearch={hasQuery}
        matchedItemIds={matchedItemIds}
        settingsConfig={settingsConfig}
        settingsVersion={settingsVersion}
        providers={providers}
        isMac={isMacOS()}
        onNavigateUrlRewrite={() => navigate({ to: "/main/settings/url-rewrite" })}
        onClearSearch={() => setSettingsSearchValue("")}
      />
    </>
  )
}
