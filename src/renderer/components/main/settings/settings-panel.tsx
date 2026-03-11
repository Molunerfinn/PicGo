import { ChevronRightIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { AppMainCard } from "@/components/common/app-main-card"
import { MainCardHeader } from "@/components/common/main-card-header"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { settingsStoreActions } from "@/store"
import { SettingsSectionAbout } from "./settings-section-about"
import { SettingsSectionAdvanced } from "./settings-section-advanced"
import { SettingsSectionAppearance } from "./settings-section-appearance"
import { SettingsSectionGeneral } from "./settings-section-general"
import { SettingsSectionNetwork } from "./settings-section-network"
import { SettingsSectionUploadWorkflow } from "./settings-section-upload-workflow"
import {
  sectionHasMatchedItems,
  settingsSectionId,
  type SettingsSectionId,
} from "./utils"

interface SettingsPanelProps {
  selectedSection: SettingsSectionId
  hasSearch: boolean
  matchedItemIds: Set<string>
  isMac: boolean
  onNavigateUrlRewrite: () => void
}

export function SettingsPanel({
  selectedSection,
  hasSearch,
  matchedItemIds,
  isMac,
  onNavigateUrlRewrite,
}: SettingsPanelProps) {
  const { t } = useTranslation()
  const isItemVisible = (itemId: string) =>
    !hasSearch || matchedItemIds.has(itemId)
  const isAnyItemVisible = (itemIds: string[]) =>
    itemIds.some((itemId) => isItemVisible(itemId))

  const hasVisibleContent =
    !hasSearch || sectionHasMatchedItems(selectedSection, matchedItemIds)

  const sectionTitleMap: Record<SettingsSectionId, string> = {
    [settingsSectionId.General]: t("SETTINGS_SECTION_GENERAL"),
    [settingsSectionId.Appearance]: t("SETTINGS_SECTION_APPEARANCE"),
    [settingsSectionId.UploadWorkflow]: t("SETTINGS_SECTION_UPLOAD_WORKFLOW"),
    [settingsSectionId.Network]: t("SETTINGS_SECTION_NETWORK"),
    [settingsSectionId.Advanced]: t("SETTINGS_SECTION_ADVANCED"),
    [settingsSectionId.About]: t("SETTINGS_SECTION_ABOUT"),
  }

  const sectionTitle = sectionTitleMap[selectedSection]

  const renderSectionContent = () => {
    if (selectedSection === settingsSectionId.General) {
      return (
        <SettingsSectionGeneral isMac={isMac} isItemVisible={isItemVisible} />
      )
    }

    if (selectedSection === settingsSectionId.Appearance) {
      return (
        <SettingsSectionAppearance isMac={isMac} isItemVisible={isItemVisible} />
      )
    }

    if (selectedSection === settingsSectionId.UploadWorkflow) {
      return <SettingsSectionUploadWorkflow isItemVisible={isItemVisible} />
    }

    if (selectedSection === settingsSectionId.Network) {
      return (
        <SettingsSectionNetwork
          isItemVisible={isItemVisible}
          isAnyItemVisible={isAnyItemVisible}
        />
      )
    }

    if (selectedSection === settingsSectionId.Advanced) {
      return (
        <SettingsSectionAdvanced
          isItemVisible={isItemVisible}
          isAnyItemVisible={isAnyItemVisible}
          onNavigateUrlRewrite={onNavigateUrlRewrite}
        />
      )
    }

    return <SettingsSectionAbout isItemVisible={isItemVisible} />
  }

  return (
    <AppMainCard asChild className="overflow-hidden">
      <main>
        <MainCardHeader
          className="px-6"
          leading={
            <>
              <span className="font-medium">{t("SETTINGS")}</span>
              <ChevronRightIcon className="size-4" />
              <span className="text-muted-foreground truncate">{sectionTitle}</span>
            </>
          }
        />

        <ScrollArea className="min-h-0 flex-1">
          <div className="mx-auto w-full max-w-(--app-provider-content-max-width) px-6 py-6">
            {hasSearch && !hasVisibleContent ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
                <div className="text-lg font-semibold">
                  {t("SETTINGS_NO_RESULTS_TITLE")}
                </div>
                <p className="text-muted-foreground mt-2 text-sm">
                  {t("SETTINGS_NO_RESULTS_DESCRIPTION")}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={() => settingsStoreActions.setSearchValue("")}
                >
                  {t("GALLERY_CLEAR_SELECTION")}
                </Button>
              </div>
            ) : null}

            {!hasSearch || hasVisibleContent ? renderSectionContent() : null}
          </div>
        </ScrollArea>
      </main>
    </AppMainCard>
  )
}
