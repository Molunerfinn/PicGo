import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import {
  PICGO_CONFIG_PLUGIN,
  PICGO_HANDLE_PLUGIN_DONE,
  PICGO_HANDLE_PLUGIN_ING,
  PICGO_PLUGIN_MENU_ACTION,
  PICGO_TOGGLE_PLUGIN,
} from "#/events/constants"
import { IPluginMenuAction } from "~/universal/types/enum"
import { pluginsAdapter } from "@/adapters/plugins"
import { useIPCOn } from "@/hooks/useIPC"
import { openURL } from "@/utils/dataSender"
import { appActions, pluginStoreActions, useAppStore, usePluginStore } from "@/store"
import { PluginDetailPanel } from "./plugin-detail-panel"
import { PluginSidebar, type PluginSidebarListItem } from "./plugin-sidebar"
import {
  pluginDetailTab,
  pluginReadmeStatus,
  type PluginDetailTab,
  type PluginInstalledItem,
} from "./types"
import {
  mapInstalledPluginItem,
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
  const isSearching = usePluginStore.use.isSearching()
  const isMutatingByPlugin = usePluginStore.use.isMutatingByPlugin()
  const readmeByPlugin = usePluginStore.use.readmeByPlugin()

  const [selectedPluginFullName, setSelectedPluginFullName] = useState<string | null>(
    null
  )
  const [activeTab, setActiveTab] = useState<PluginDetailTab>(pluginDetailTab.Readme)
  const pendingTabOnSelectionRef = useRef<PluginDetailTab | null>(null)
  const activePluginFullNameRef = useRef<string | undefined>(undefined)
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
  const activeReadmeState =
    isSearchMode && isSearching && pluginSearchResults.length === 0
      ? {
        status: pluginReadmeStatus.Loading,
        content: "",
        errorMessage: null
      }
      : resolveReadmeState(readmeByPlugin, activeListItem?.fullName)
  const availableTabs = resolvePluginDetailTabs(activePlugin)

  useEffect(() => {
    activePluginFullNameRef.current = activeListItem?.fullName
  }, [activeListItem?.fullName])

  const handleJumpToTab = (pluginFullName: string, tab: PluginDetailTab) => {
    const jumpResolution = resolvePluginTabJump(
      activePluginFullNameRef.current,
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

  useIPCOn('pluginList', (_event, list: IPicGoPlugin[]) => {
    pluginStoreActions.setInstalledPlugins(list.map(mapInstalledPluginItem))
  })

  useIPCOn('hideLoading', () => {
    pluginStoreActions.setImportingLocal(false)
    pluginStoreActions.setSearching(false)
  })

  useIPCOn(PICGO_HANDLE_PLUGIN_ING, (_event, fullName: string) => {
    pluginStoreActions.setMutating(fullName, true)
  })

  useIPCOn(PICGO_HANDLE_PLUGIN_DONE, (_event, fullName: string) => {
    pluginStoreActions.setMutating(fullName, false)
  })

  useIPCOn(PICGO_TOGGLE_PLUGIN, (_event, fullName: string, enabled: boolean) => {
    useAppStore.setState((state) => {
      state.pluginsInstalled = state.pluginsInstalled.map((item) => {
        if (item.fullName !== fullName) {
          return item
        }

        return {
          ...item,
          enabled
        }
      })

      if (state.appConfig) {
        state.appConfig.picgoPlugins[fullName] = enabled
        state.appConfig.needReload = true
      }
    })
  })

  useIPCOn('updateSuccess', async () => {
    const installedPlugins = await pluginsAdapter.getInstalledPlugins()
    pluginStoreActions.setInstalledPlugins(
      installedPlugins.map(mapInstalledPluginItem)
    )
    await appActions.hydrateAppState()
  })

  useIPCOn('uninstallSuccess', async () => {
    const installedPlugins = await pluginsAdapter.getInstalledPlugins()
    pluginStoreActions.setInstalledPlugins(
      installedPlugins.map(mapInstalledPluginItem)
    )
    await appActions.hydrateAppState()
  })

  useIPCOn(
    PICGO_CONFIG_PLUGIN,
    (_event, currentType: 'plugin' | 'transformer' | 'uploader', configName: string) => {
      const installedPlugins = useAppStore.getState().pluginsInstalled
      const matchedPlugin = installedPlugins.find((plugin) => {
        if (currentType === 'plugin') {
          return (
            plugin.config.plugin.fullName === configName ||
            plugin.config.plugin.name === configName
          )
        }

        if (currentType === 'transformer') {
          return (
            plugin.config.transformer.fullName === configName ||
            plugin.config.transformer.name === configName
          )
        }

        return (
          plugin.uploader?.name === configName ||
          plugin.uploader?.id === configName
        )
      })

      if (!matchedPlugin) {
        return
      }

      handleJumpToTab(
        matchedPlugin.fullName,
        currentType === 'transformer'
          ? pluginDetailTab.Transformer
          : pluginDetailTab.Config
      )
    }
  )

  // Hydrate initial plugin/provider/app config state when this page mounts.
  useEffect(() => {
    let isDisposed = false

    async function bootstrap() {
      try {
        await appActions.ensureHydrated()
        const installedPlugins = await pluginsAdapter.getInstalledPlugins()
        pluginStoreActions.setInstalledPlugins(
          installedPlugins.map(mapInstalledPluginItem)
        )
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

  // Reset tab on plugin switch, but respect a pending tab jump requested from the main-process plugin menu.
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
    openURL(awesomePluginListUrl)
  }

  const handleOpenPluginMenu = (plugin: PluginInstalledItem) => {
    pluginsAdapter.openPluginMenu(plugin as unknown as IPicGoPlugin)
  }

  useIPCOn(PICGO_PLUGIN_MENU_ACTION, async (_event, fullName: string, action: IPluginMenuAction) => {
    try {
      if (action === IPluginMenuAction.ENABLE) {
        await pluginStoreActions.setPluginEnabled(fullName, true)
        return
      }

      if (action === IPluginMenuAction.DISABLE) {
        await pluginStoreActions.setPluginEnabled(fullName, false)
        return
      }

      if (action === IPluginMenuAction.UPDATE) {
        await pluginStoreActions.updatePlugin(fullName)
        return
      }

      await pluginStoreActions.uninstallPlugin(fullName)
    } catch (error) {
      console.error(
        `[plugins] action failed: ${error instanceof Error ? error.message : t("FAILED")}`
      )
    }
  })

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
        onInstallPlugin={async (fullName) => {
          try {
            await pluginStoreActions.installPlugin(fullName)
            setSelectedPluginFullName(fullName)
          } catch (error) {
            console.error(
              `[plugins] install failed: ${error instanceof Error ? error.message : t("PLUGIN_INSTALL_FAILED")}`
            )
          }
        }}
        onOpenAwesomeList={handleOpenAwesomeList}
        onImportLocalPlugin={handleOpenImportDialog}
        onOpenPluginMenu={handleOpenPluginMenu}
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
      />
    </>
  )
}
