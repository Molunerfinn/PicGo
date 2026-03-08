import { ChevronRightIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { AppMainCard } from "@/components/common/app-main-card"
import { MainCardHeader } from "@/components/common/main-card-header"
import type { ProviderUploaderSummary } from "@/components/main/providers/types"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import i18n from "@/i18n"
import { useAppStore } from "@/store"
import { SettingsSectionAbout } from "./settings-section-about"
import { SettingsSectionAdvanced } from "./settings-section-advanced"
import { SettingsSectionAppearance } from "./settings-section-appearance"
import { SettingsSectionGeneral } from "./settings-section-general"
import { SettingsSectionNetwork } from "./settings-section-network"
import { SettingsSectionUploadWorkflow } from "./settings-section-upload-workflow"
import {
  sectionHasMatchedItems,
  settingsSectionId,
  type SettingsConfigState,
  type SettingsSectionId,
  type SettingsVersionState,
} from "./utils"

interface SettingsPanelProps {
  selectedSection: SettingsSectionId
  hasSearch: boolean
  matchedItemIds: Set<string>
  settingsConfig: SettingsConfigState
  settingsVersion: SettingsVersionState
  providers: ProviderUploaderSummary[]
  isMac: boolean
  onNavigateUrlRewrite: () => void
  onClearSearch: () => void
}

function resolveErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}

function resolveLanguageToSync(
  path: string | Partial<SettingsConfigState>,
  value?: unknown
) {
  if (typeof path === "string") {
    if (path === "settings.language" && typeof value === "string") {
      return value
    }

    return null
  }

  if (typeof path.language === "string") {
    return path.language
  }

  return null
}

export function SettingsPanel({
  selectedSection,
  hasSearch,
  matchedItemIds,
  settingsConfig,
  settingsVersion,
  providers,
  isMac,
  onNavigateUrlRewrite,
  onClearSearch,
}: SettingsPanelProps) {
  const { t } = useTranslation()
  const saveSettingsConfig = useAppStore((state) => state.saveSettingsConfig)

  const isItemVisible = (itemId: string) =>
    !hasSearch || matchedItemIds.has(itemId)
  const isAnyItemVisible = (itemIds: string[]) =>
    itemIds.some((itemId) => isItemVisible(itemId))

  const hasVisibleContent =
    !hasSearch || sectionHasMatchedItems(selectedSection, matchedItemIds)

  const saveConfigValue = async (
    path: string | Partial<SettingsConfigState>,
    value?: unknown
  ) => {
    try {
      await saveSettingsConfig(path, value)
      const nextLanguage = resolveLanguageToSync(path, value)
      if (nextLanguage) {
        await i18n.changeLanguage(nextLanguage)
      }
      toast.success(t("SUCCESS"))
      return true
    } catch (error) {
      toast.error(resolveErrorMessage(error, t("FAILED")))
      return false
    }
  }

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
        <SettingsSectionGeneral
          settingsConfig={settingsConfig}
          isMac={isMac}
          isItemVisible={isItemVisible}
          onSaveConfig={saveConfigValue}
        />
      )
    }

    if (selectedSection === settingsSectionId.Appearance) {
      return (
        <SettingsSectionAppearance
          settingsConfig={settingsConfig}
          providers={providers}
          isMac={isMac}
          isItemVisible={isItemVisible}
          onSaveConfig={saveConfigValue}
        />
      )
    }

    if (selectedSection === settingsSectionId.UploadWorkflow) {
      return (
        <SettingsSectionUploadWorkflow
          settingsConfig={settingsConfig}
          isItemVisible={isItemVisible}
          onSaveConfig={saveConfigValue}
        />
      )
    }

    if (selectedSection === settingsSectionId.Network) {
      return (
        <SettingsSectionNetwork
          settingsConfig={settingsConfig}
          isItemVisible={isItemVisible}
          isAnyItemVisible={isAnyItemVisible}
          onSaveConfig={saveConfigValue}
        />
      )
    }

    if (selectedSection === settingsSectionId.Advanced) {
      return (
        <SettingsSectionAdvanced
          settingsConfig={settingsConfig}
          isItemVisible={isItemVisible}
          isAnyItemVisible={isAnyItemVisible}
          onSaveConfig={saveConfigValue}
          onNavigateUrlRewrite={onNavigateUrlRewrite}
        />
      )
    }

    return (
      <SettingsSectionAbout
        settingsConfig={settingsConfig}
        settingsVersion={settingsVersion}
        isItemVisible={isItemVisible}
        onSaveConfig={saveConfigValue}
      />
    )
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
                  onClick={onClearSearch}
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
