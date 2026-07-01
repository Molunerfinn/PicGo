import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { useAppStore } from "@/store"
import { SettingsProxyDialog } from "./settings-dialog-proxy"
import { SettingsServerDialog } from "./settings-dialog-server"
import { SettingsRow } from "./settings-row"
import { defaultSettingsConfig } from "./utils"

interface SettingsSectionNetworkProps {
  isItemVisible: (itemId: string) => boolean
  isAnyItemVisible: (itemIds: string[]) => boolean
}

export function SettingsSectionNetwork({
  isItemVisible,
  isAnyItemVisible,
}: SettingsSectionNetworkProps) {
  const { t } = useTranslation()
  const appConfig = useAppStore.use.appConfig()
  const settingsConfig = appConfig?.settings ?? defaultSettingsConfig
  const picBedProxy = appConfig?.picBed.proxy ?? ""
  const [isProxyDialogOpen, setProxyDialogOpen] = useState(false)
  const [isServerDialogOpen, setServerDialogOpen] = useState(false)
  const [proxyDraft, setProxyDraft] = useState(picBedProxy)
  const [npmProxyDraft, setNpmProxyDraft] = useState(settingsConfig.npmProxy)
  const [npmRegistryDraft, setNpmRegistryDraft] = useState(settingsConfig.npmRegistry)
  const [serverHostDraft, setServerHostDraft] = useState(settingsConfig.server.host)
  const [serverPortDraft, setServerPortDraft] = useState(String(settingsConfig.server.port))
  const [serverEnableDraft, setServerEnableDraft] = useState(settingsConfig.server.enable)

  return (
    <>
      <div className="space-y-1">
        <SettingsRow
          hidden={
            !isAnyItemVisible(["upload-proxy", "plugin-proxy", "plugin-mirror"])
          }
          title={t("SETTINGS_SET_PROXY_AND_MIRROR")}
          control={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setProxyDraft(picBedProxy)
                setNpmProxyDraft(settingsConfig.npmProxy)
                setNpmRegistryDraft(settingsConfig.npmRegistry)
                setProxyDialogOpen(true)
              }}
            >
              {t("SETTINGS_CLICK_TO_SET")}
            </Button>
          }
        />
        <SettingsRow
          hidden={!isItemVisible("server")}
          title={t("SETTINGS_SET_PICGO_SERVER")}
          description={t("SETTINGS_TIPS_SERVER_NOTICE")}
          control={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setServerHostDraft(settingsConfig.server.host)
                setServerPortDraft(String(settingsConfig.server.port))
                setServerEnableDraft(settingsConfig.server.enable)
                setServerDialogOpen(true)
              }}
            >
              {t("SETTINGS_CLICK_TO_SET")}
            </Button>
          }
        />
      </div>

      <SettingsProxyDialog
        open={isProxyDialogOpen}
        onOpenChange={setProxyDialogOpen}
        proxyDraft={proxyDraft}
        npmProxyDraft={npmProxyDraft}
        npmRegistryDraft={npmRegistryDraft}
        onProxyDraftChange={setProxyDraft}
        onNpmProxyDraftChange={setNpmProxyDraft}
        onNpmRegistryDraftChange={setNpmRegistryDraft}
      />

      <SettingsServerDialog
        open={isServerDialogOpen}
        onOpenChange={setServerDialogOpen}
        serverHostDraft={serverHostDraft}
        serverPortDraft={serverPortDraft}
        serverEnableDraft={serverEnableDraft}
        onServerHostDraftChange={setServerHostDraft}
        onServerPortDraftChange={setServerPortDraft}
        onServerEnableDraftChange={setServerEnableDraft}
      />
    </>
  )
}
