import { SearchIcon, XIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { settingsStoreActions, useSettingsStore } from "@/store"
import {
  filterSettingsNavItemsBySearch,
  settingsNavItemKind,
  settingsSectionId,
  type SettingsSectionId,
} from "./utils"

interface SettingsSidebarProps {
  selectedSection: SettingsSectionId
  matchedSections: SettingsSectionId[]
  matchedItemIds: Set<string>
  isAdvancedRoute: boolean
  activeAdvancedRoute: "shortcuts" | "url-rewrite" | null
  onSelectSection: (section: SettingsSectionId) => void
  onNavigateRoute: (to: "/main/settings/shortcuts") => void
}

export function SettingsSidebar({
  selectedSection,
  matchedSections,
  matchedItemIds,
  isAdvancedRoute,
  activeAdvancedRoute,
  onSelectSection,
  onNavigateRoute,
}: SettingsSidebarProps) {
  const { t } = useTranslation()
  const searchValue = useSettingsStore.use.searchValue()

  const resolveSectionLabel = (sectionId: SettingsSectionId) => {
    if (sectionId === settingsSectionId.General) {
      return t("SETTINGS_SECTION_GENERAL")
    }
    if (sectionId === settingsSectionId.Appearance) {
      return t("SETTINGS_SECTION_APPEARANCE")
    }
    if (sectionId === settingsSectionId.UploadWorkflow) {
      return t("SETTINGS_SECTION_UPLOAD_WORKFLOW")
    }
    if (sectionId === settingsSectionId.Network) {
      return t("SETTINGS_SECTION_NETWORK")
    }
    if (sectionId === settingsSectionId.Advanced) {
      return t("SETTINGS_SECTION_ADVANCED")
    }
    return t("SETTINGS_SECTION_ABOUT")
  }
  const normalizedSearch = searchValue.trim().toLowerCase()
  const hasSearch = normalizedSearch.length > 0
  const filteredNavItems = filterSettingsNavItemsBySearch(
    searchValue,
    matchedSections,
    matchedItemIds
  )

  return (
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border flex w-(--app-provider-sidebar-width) shrink-0 flex-col overflow-hidden rounded-xl border backdrop-blur-xl">
      <div className="border-sidebar-border/60 flex flex-col gap-3 border-b px-4 py-4">
        <h1 className="text-base font-semibold">{t("SETTINGS")}</h1>

        <InputGroup className="bg-background/70">
          <InputGroupAddon>
            <SearchIcon className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            value={searchValue}
            onChange={(event) => settingsStoreActions.setSearchValue(event.target.value)}
            placeholder={t("SEARCH")}
            aria-label={t("SEARCH")}
          />
          {hasSearch ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                variant="ghost"
                className="text-muted-foreground transition-all duration-300 hover:bg-(--app-provider-sidebar-item-hover-bg) hover:text-(--app-provider-sidebar-item-active-color)"
                onClick={() => settingsStoreActions.setSearchValue("")}
                title={t("GALLERY_CLEAR_SELECTION")}
                aria-label={t("GALLERY_CLEAR_SELECTION")}
              >
                <XIcon className="size-3.5" />
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="px-4 py-2">
          <div className="space-y-1">
            {filteredNavItems.map((item) => {
              if (item.kind === settingsNavItemKind.Route && item.routeTo) {
                const isActive = activeAdvancedRoute === "shortcuts"

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigateRoute(item.routeTo!)}
                    data-active={isActive ? "true" : "false"}
                    className={cn(
                      "flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm font-medium transition-all duration-300 hover:bg-(--app-provider-sidebar-item-hover-bg)",
                      isActive
                        ? "bg-(--app-provider-sidebar-item-active-bg) text-(--app-provider-sidebar-item-active-color) hover:bg-(--app-provider-sidebar-item-active-bg) hover:text-(--app-provider-sidebar-item-active-color)"
                        : "text-muted-foreground hover:text-(--app-provider-sidebar-item-active-color)"
                    )}
                  >
                    <span className="truncate">
                      {t("SETTINGS_OPEN_SHORTCUTS")}
                    </span>
                  </button>
                )
              }

              const section = item.section
              if (!section) {
                return null
              }

              const isAdvancedSectionOnAdvancedRoute =
                isAdvancedRoute &&
                section === settingsSectionId.Advanced &&
                activeAdvancedRoute === "url-rewrite"
              const isActive =
                selectedSection === section &&
                (!isAdvancedRoute || isAdvancedSectionOnAdvancedRoute)

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectSection(section)}
                  data-active={isActive ? "true" : "false"}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-all duration-300 hover:bg-(--app-provider-sidebar-item-hover-bg)",
                    isActive
                      ? "bg-(--app-provider-sidebar-item-active-bg) text-(--app-provider-sidebar-item-active-color) hover:bg-(--app-provider-sidebar-item-active-bg) hover:text-(--app-provider-sidebar-item-active-color)"
                      : "text-muted-foreground hover:text-(--app-provider-sidebar-item-active-color)"
                  )}
                >
                  <span className="truncate">{resolveSectionLabel(section)}</span>
                </button>
              )
            })}
          </div>
        </div>
      </ScrollArea>
    </aside>
  )
}
