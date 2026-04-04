import { useEffect, useRef, useState } from "react"
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
  const isImportingLocal = usePluginStore.use.isImportingLocal()

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
    setActiveTab(jumpResolution.targetTab)
  }

  useIPCOn('pluginList', (list: IPicGoPlugin[]) => {
    pluginStoreActions.setInstalledPlugins(list.map(mapInstalledPluginItem))
  })

  useIPCOn(PICGO_HANDLE_PLUGIN_ING, (fullName: string) => {
    pluginStoreActions.setMutating(fullName, true)
  })

  useIPCOn(PICGO_HANDLE_PLUGIN_DONE, (fullName: string) => {
    pluginStoreActions.setMutating(fullName, false)
  })

  useIPCOn(PICGO_TOGGLE_PLUGIN, (fullName: string, enabled: boolean) => {
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

  useIPCOn(
    PICGO_CONFIG_PLUGIN,
    (currentType: 'plugin' | 'transformer' | 'uploader', configName: string) => {
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

  const resolvedSelectedPluginFullName = activeListItem?.fullName ?? null
  const resolvedActiveTab = resolveSupportedPluginTab(activeTab, availableTabs)

  const handleOpenAwesomeList = async () => {
    openURL(awesomePluginListUrl)
  }

  const handleOpenPluginMenu = (plugin: PluginInstalledItem) => {
    pluginsAdapter.openPluginMenu(plugin as unknown as IPicGoPlugin)
  }

  useIPCOn(PICGO_PLUGIN_MENU_ACTION, async (fullName: string, action: IPluginMenuAction) => {
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

  const handleOpenImportDialog = async () => {
    try {
      const result = await pluginStoreActions.importLocalPlugin()
      if (!result) {
        return
      }
      setSelectedPluginFullName(result.installedPlugin.fullName)
    } catch (error) {
      console.error(
        `[plugins] import local failed: ${error instanceof Error ? error.message : t("PLUGIN_IMPORT_FAILED")}`
      )
    }
  }

  return (
    <>
      <PluginSidebar
        items={listItems}
        selectedPluginFullName={resolvedSelectedPluginFullName}
        onSelectPlugin={(fullName) => {
          pendingTabOnSelectionRef.current = null
          setSelectedPluginFullName(fullName)
          setActiveTab(pluginDetailTab.Readme)
        }}
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
        activeTab={resolvedActiveTab}
        availableTabs={availableTabs}
        readmeState={activeReadmeState}
        isMutating={
          activeListItem
            ? Boolean(isMutatingByPlugin[activeListItem.fullName])
            : false
        }
        onTabChange={(tab) => {
          setActiveTab(resolveSupportedPluginTab(tab, availableTabs))
        }}
      />

      {isImportingLocal ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background px-4 py-3 shadow-lg">
            <div className="size-5 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
            <span className="text-sm font-medium">{t("PLUGIN_IMPORT_LOCAL")}</span>
          </div>
        </div>
      ) : null}
    </>
  )
}
