import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { openUrl } from "@/lib/utils"
import { appActions, pluginStoreActions, useAppStore, usePluginStore } from "@/store"
import { PluginDetailPanel } from "./plugin-detail-panel"
import { PluginSidebar, type PluginSidebarListItem } from "./plugin-sidebar"
import {
  pluginDetailTab,
  pluginGearActionKind,
  pluginReadmeStatus,
  type PluginDetailTab,
  type PluginGearAction,
  type PluginInstalledItem,
} from "./types"
import {
  resolveActivePlugin,
  resolvePluginTabJump,
  resolveSupportedPluginTab,
  resolveErrorMessage,
  resolvePluginDetailTabs,
  resolveReadmeState,
} from "./utils"

const awesomePluginListUrl = "https://github.com/PicGo/Awesome-PicGo"

function resolveFolderPathFromFiles(files: FileList) {
  const firstFile = files[0]

  if (!firstFile) {
    return null
  }

  const relativePath = firstFile.webkitRelativePath || firstFile.name
  const folderName = relativePath.split("/").filter(Boolean)[0]

  return folderName ?? null
}

export function PicGoPlugins() {
  const { t } = useTranslation()

  const appConfig = useAppStore.use.appConfig()
  const pluginsInstalled = useAppStore.use.pluginsInstalled()
  const pluginSearchValue = usePluginStore.use.searchValue()
  const pluginSearchResults = usePluginStore.use.searchResults()
  const isMutatingByPlugin = usePluginStore.use.isMutatingByPlugin()
  const readmeByPlugin = usePluginStore.use.readmeByPlugin()

  const [selectedPluginFullName, setSelectedPluginFullName] = useState<string | null>(
    null
  )
  const [activeTab, setActiveTab] = useState<PluginDetailTab>(pluginDetailTab.Readme)
  const pendingTabOnSelectionRef = useRef<PluginDetailTab | null>(null)
  const importInputRef = useRef<HTMLInputElement | null>(null)

  const isSearchMode = pluginSearchValue.trim().length > 0
  const installedPluginMap = new Map(
    pluginsInstalled.map((plugin) => [plugin.fullName, plugin] as const)
  )

  const listItems: PluginSidebarListItem[] = isSearchMode
    ? pluginSearchResults.map((item) => ({
      fullName: item.fullName,
      name: item.name,
      description: item.description,
      author: item.author,
      version: item.version,
      logo: item.logo,
      homepage: item.homepage,
      hasInstall: item.hasInstall,
      installedPlugin: installedPluginMap.get(item.fullName) ?? null,
    }))
    : pluginsInstalled.map((plugin) => ({
      fullName: plugin.fullName,
      name: plugin.name,
      description: plugin.description,
      author: plugin.author,
      version: plugin.version,
      logo: plugin.logo,
      homepage: plugin.homepage,
      hasInstall: true,
      installedPlugin: plugin,
    }))

  const activeListItem = resolveActivePlugin(listItems, selectedPluginFullName)
  const activePlugin: PluginInstalledItem | null = activeListItem?.installedPlugin ?? null
  const activeReadmeState = resolveReadmeState(
    readmeByPlugin,
    activeListItem?.fullName
  )
  const availableTabs = resolvePluginDetailTabs(activePlugin)

  // Hydrate initial plugin/provider/app config state when this page mounts.
  useEffect(() => {
    let isDisposed = false

    async function bootstrap() {
      try {
        await appActions.ensureHydrated()
      } catch (error) {
        if (!isDisposed) {
          toast.error(resolveErrorMessage(error, t("FAILED")))
        }
      }
    }

    bootstrap()

    return () => {
      isDisposed = true
    }
  }, [t])

  // Configure the hidden file input to allow folder selection for local plugin import.
  useEffect(() => {
    const input = importInputRef.current

    if (!input) {
      return
    }

    input.setAttribute("webkitdirectory", "")
    input.setAttribute("directory", "")
  }, [])

  // Debounce npm search requests while the search keyword changes.
  useEffect(() => {
    const query = pluginSearchValue
    const timer = window.setTimeout(() => {
      pluginStoreActions.searchPlugins(query)
    }, 180)

    return () => {
      window.clearTimeout(timer)
    }
  }, [pluginSearchValue])

  // Keep selected plugin in sync with the current sidebar list result set.
  useEffect(() => {
    if (!activeListItem) {
      setSelectedPluginFullName(null)
      return
    }

    if (selectedPluginFullName === activeListItem.fullName) {
      return
    }

    setSelectedPluginFullName(activeListItem.fullName)
  }, [activeListItem, selectedPluginFullName])

  // Reset tab on plugin switch, but respect a pending tab jump requested from the gear menu.
  useEffect(() => {
    const activeFullName = activeListItem?.fullName

    if (!activeFullName) {
      return
    }

    const pendingTab = pendingTabOnSelectionRef.current
    pendingTabOnSelectionRef.current = null

    setActiveTab(pendingTab ?? pluginDetailTab.Readme)
  }, [activeListItem?.fullName])

  // Fetch README lazily for the active plugin when it is still idle.
  useEffect(() => {
    const fullName = activeListItem?.fullName

    if (!fullName) {
      return
    }

    const readmeState = readmeByPlugin[fullName]

    if (readmeState && readmeState.status !== pluginReadmeStatus.Idle) {
      return
    }

    pluginStoreActions.fetchPluginReadme(fullName)
  }, [activeListItem?.fullName, readmeByPlugin])

  // Guarantee the current active tab is always valid for the selected plugin.
  useEffect(() => {
    setActiveTab((currentTab) => resolveSupportedPluginTab(currentTab, availableTabs))
  }, [availableTabs])

  const handleOpenAwesomeList = async () => {
    await openUrl(awesomePluginListUrl)
  }

  const handleInstallPlugin = async (fullName: string) => {
    try {
      await pluginStoreActions.installPlugin(fullName)
      toast.success(t("PLUGIN_INSTALL_SUCCEED"))
      setSelectedPluginFullName(fullName)
    } catch (error) {
      toast.error(resolveErrorMessage(error, t("PLUGIN_INSTALL_FAILED")))
    }
  }

  const handleSetPluginEnabled = async (fullName: string, enabled: boolean) => {
    try {
      await pluginStoreActions.setPluginEnabled(fullName, enabled)
      toast.success(t("SUCCESS"))
    } catch (error) {
      toast.error(resolveErrorMessage(error, t("FAILED")))
    }
  }

  const handleUpdatePlugin = async (fullName: string) => {
    try {
      await pluginStoreActions.updatePlugin(fullName)
      toast.success(t("PLUGIN_UPDATE_SUCCEED"))
    } catch (error) {
      toast.error(resolveErrorMessage(error, t("FAILED")))
    }
  }

  const handleUninstallPlugin = async (fullName: string) => {
    try {
      await pluginStoreActions.uninstallPlugin(fullName)
      toast.success(t("PLUGIN_UNINSTALL_SUCCEED"))
    } catch (error) {
      toast.error(resolveErrorMessage(error, t("FAILED")))
    }
  }

  const handleJumpToTab = (pluginFullName: string, tab: PluginDetailTab) => {
    const jumpResolution = resolvePluginTabJump(
      activeListItem?.fullName,
      pluginFullName,
      tab
    )

    if (jumpResolution.shouldSwitchImmediately) {
      pendingTabOnSelectionRef.current = null
      setActiveTab(jumpResolution.targetTab)
      return
    }

    pendingTabOnSelectionRef.current = jumpResolution.targetTab
    setSelectedPluginFullName(jumpResolution.targetPluginFullName)
  }

  const handleGearAction = async (
    plugin: PluginInstalledItem,
    action: PluginGearAction
  ) => {
    if (action.kind === pluginGearActionKind.JumpConfig) {
      handleJumpToTab(plugin.fullName, pluginDetailTab.Config)
      return
    }

    if (action.kind === pluginGearActionKind.JumpTransformer) {
      handleJumpToTab(plugin.fullName, pluginDetailTab.Transformer)
      return
    }

    if (action.kind === pluginGearActionKind.Enable) {
      await handleSetPluginEnabled(plugin.fullName, true)
      return
    }

    if (action.kind === pluginGearActionKind.Disable) {
      await handleSetPluginEnabled(plugin.fullName, false)
      return
    }

    if (action.kind === pluginGearActionKind.Update) {
      await handleUpdatePlugin(plugin.fullName)
      return
    }

    if (action.kind === pluginGearActionKind.Uninstall) {
      await handleUninstallPlugin(plugin.fullName)
      return
    }

    try {
      if (action.kind === pluginGearActionKind.ToggleTransformer) {
        await pluginStoreActions.togglePluginTransformer(plugin.fullName)
        toast.success(t("SUCCESS"))
        return
      }

      if (action.kind === pluginGearActionKind.GuiMenu && action.guiMenuLabel) {
        const result = await pluginStoreActions.runPluginGuiMenuAction(
          plugin.fullName,
          action.guiMenuLabel
        )
        toast.success(result.message)
      }
    } catch (error) {
      toast.error(resolveErrorMessage(error, t("FAILED")))
    }
  }

  const handleSaveConfig = async (
    fullName: string,
    tab: "config" | "transformer",
    values: Record<string, unknown>
  ) => {
    try {
      await pluginStoreActions.savePluginConfig(fullName, tab, values)
      toast.success(t("SUCCESS"))
    } catch (error) {
      toast.error(resolveErrorMessage(error, t("FAILED")))
    }
  }

  const handleOpenImportDialog = () => {
    importInputRef.current?.click()
  }

  const handleImportInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files

    if (!files || files.length === 0) {
      return
    }

    const folderPath = resolveFolderPathFromFiles(files)

    if (!folderPath) {
      return
    }

    try {
      const result = await pluginStoreActions.importLocalPlugin(folderPath)
      toast.success(`${t("PLUGIN_IMPORT_SUCCEED")}: ${result.path}`)
      setSelectedPluginFullName(result.installedPlugin.fullName)
    } catch (error) {
      toast.error(resolveErrorMessage(error, t("PLUGIN_IMPORT_FAILED")))
    } finally {
      event.target.value = ""
    }
  }

  return (
    <>
      <input
        ref={importInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleImportInputChange}
      />

      <PluginSidebar
        items={listItems}
        selectedPluginFullName={selectedPluginFullName}
        onSelectPlugin={setSelectedPluginFullName}
        onInstallPlugin={handleInstallPlugin}
        onOpenAwesomeList={handleOpenAwesomeList}
        onImportLocalPlugin={handleOpenImportDialog}
        onGearAction={handleGearAction}
      />

      <PluginDetailPanel
        appConfig={appConfig}
        selectedItem={
          activeListItem
            ? {
              name: activeListItem.name,
              fullName: activeListItem.fullName,
              description: activeListItem.description,
              author: activeListItem.author,
              version: activeListItem.version,
              logo: activeListItem.logo,
              homepage: activeListItem.homepage,
              hasInstall: activeListItem.hasInstall,
            }
            : null
        }
        plugin={activePlugin}
        activeTab={activeTab}
        availableTabs={availableTabs}
        readmeState={activeReadmeState}
        isMutating={
          activeListItem
            ? Boolean(isMutatingByPlugin[activeListItem.fullName])
            : false
        }
        onTabChange={setActiveTab}
        onInstallPlugin={handleInstallPlugin}
        onSaveConfig={handleSaveConfig}
        onSetPluginEnabled={handleSetPluginEnabled}
        onUpdatePlugin={handleUpdatePlugin}
        onUninstallPlugin={handleUninstallPlugin}
      />
    </>
  )
}
