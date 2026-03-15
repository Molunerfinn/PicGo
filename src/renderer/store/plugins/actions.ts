import type {
  PluginSearchResultItem,
  PluginInstalledItem,
  PluginConfigSectionType,
  PluginImportResult,
  PluginReadmeState
} from '@/components/main/plugins/types'
import { pluginReadmeStatus } from '@/components/main/plugins/types'
import { pluginsAdapter } from '@/adapters/plugins'
import { mapInstalledPluginItem, mapPluginSearchResult } from '@/components/main/plugins/utils'
import { appActions } from '@/store/app-actions'
import { useAppStore } from '@/store/app-store'
import { usePluginStore } from './store'

export const pluginStoreActions = {
  setSearchValue (value: string) {
    usePluginStore.setState((state) => {
      state.searchValue = value
    })
  },
  setSearching (isSearching: boolean) {
    usePluginStore.setState((state) => {
      state.isSearching = isSearching
    })
  },
  setSearchResults (searchResults: PluginSearchResultItem[]) {
    usePluginStore.setState((state) => {
      state.searchResults = searchResults
      state.isSearching = false
    })
  },
  setInstalledPlugins (pluginsInstalled: PluginInstalledItem[]) {
    useAppStore.setState((state) => {
      state.pluginsInstalled = pluginsInstalled
    })
  },
  setMutating (fullName: string, isMutating: boolean) {
    usePluginStore.setState((state) => {
      state.isMutatingByPlugin[fullName] = isMutating
    })
  },
  setImportingLocal (isImportingLocal: boolean) {
    usePluginStore.setState((state) => {
      state.isImportingLocal = isImportingLocal
    })
  },
  setReadmeState (fullName: string, nextState: PluginReadmeState) {
    usePluginStore.setState((state) => {
      state.readmeByPlugin[fullName] = nextState
    })
  },
  async searchPlugins (query: string) {
    if (!query.trim()) {
      pluginStoreActions.setSearchResults([])
      return
    }

    pluginStoreActions.setSearching(true)

    try {
      const installedPlugins = useAppStore.getState().pluginsInstalled
      const searchResults = await pluginsAdapter.searchPlugins(
        query,
        installedPlugins.map((item) => ({
          name: item.name,
          fullName: item.fullName,
          author: item.author,
          description: item.description,
          logo: item.logo,
          version: item.version,
          gui: item.gui,
          homepage: item.homepage,
          enabled: item.enabled,
          guiMenu: item.guiMenu,
          config: {
            plugin: item.config.plugin,
            uploader: item.uploader
              ? {
                name: item.uploader.name,
                fullName: item.uploader.id,
                config: item.uploader.schema
              }
              : { name: '', fullName: '', config: [] },
            transformer: item.config.transformer
          },
          ing: false,
          hasInstall: item.hasInstall
        }))
      )

      pluginStoreActions.setSearchResults(searchResults.map(mapPluginSearchResult))
    } catch (error) {
      pluginStoreActions.setSearching(false)
      throw error
    }
  },
  async installPlugin (fullName: string) {
    pluginStoreActions.setMutating(fullName, true)

    try {
      const result = await pluginsAdapter.installPlugin(fullName)
      if (!result.success) {
        throw new Error(result.errMsg || result.body || 'Install plugin failed')
      }

      await appActions.hydrateAppState()
      const installedPlugins = await pluginsAdapter.getInstalledPlugins()
      pluginStoreActions.setInstalledPlugins(installedPlugins.map(mapInstalledPluginItem))
    } finally {
      pluginStoreActions.setMutating(fullName, false)
    }
  },
  async setPluginEnabled (fullName: string, enabled: boolean) {
    pluginStoreActions.setMutating(fullName, true)

    try {
      await pluginsAdapter.setNeedReload(true)
      await pluginsAdapter.togglePluginEnabled(fullName, enabled)

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
    } finally {
      pluginStoreActions.setMutating(fullName, false)
    }
  },
  async updatePlugin (fullName: string) {
    pluginStoreActions.setMutating(fullName, true)

    try {
      await pluginsAdapter.updatePlugin(fullName)
      await appActions.hydrateAppState()
      const installedPlugins = await pluginsAdapter.getInstalledPlugins()
      pluginStoreActions.setInstalledPlugins(installedPlugins.map(mapInstalledPluginItem))
      await pluginsAdapter.setNeedReload(true)

      useAppStore.setState((state) => {
        if (state.appConfig) {
          state.appConfig.needReload = true
        }
      })
    } finally {
      pluginStoreActions.setMutating(fullName, false)
    }
  },
  async uninstallPlugin (fullName: string) {
    pluginStoreActions.setMutating(fullName, true)

    try {
      await pluginsAdapter.uninstallPlugin(fullName)
      await appActions.hydrateAppState()
      const installedPlugins = await pluginsAdapter.getInstalledPlugins()
      pluginStoreActions.setInstalledPlugins(installedPlugins.map(mapInstalledPluginItem))
      await pluginsAdapter.setNeedReload(true)

      useAppStore.setState((state) => {
        if (state.appConfig) {
          state.appConfig.needReload = true
        }
      })
    } finally {
      pluginStoreActions.setMutating(fullName, false)
    }
  },
  async savePluginConfig (
    fullName: string,
    section: PluginConfigSectionType,
    values: Record<string, unknown>
  ) {
    pluginStoreActions.setMutating(fullName, true)

    try {
      const installedPlugin = useAppStore.getState().pluginsInstalled.find(
        (item) => item.fullName === fullName
      )

      if (!installedPlugin) {
        throw new Error('Plugin not found')
      }

      const targetConfigName =
        section === 'config'
          ? installedPlugin.config.plugin.fullName || installedPlugin.config.plugin.name
          : installedPlugin.config.transformer.fullName || installedPlugin.config.transformer.name

      await pluginsAdapter.savePluginConfig(
        section === 'config' ? 'plugin' : 'transformer',
        targetConfigName,
        values as IStringKeyMap
      )
      await appActions.refreshAppConfig()
      await appActions.hydrateAppState()
    } finally {
      pluginStoreActions.setMutating(fullName, false)
    }
  },
  async togglePluginTransformer (fullName: string) {
    const installedPlugin = useAppStore.getState().pluginsInstalled.find(
      (item) => item.fullName === fullName
    )

    if (!installedPlugin?.config.transformer.name) {
      throw new Error('Transformer not found')
    }

    const transformerName = installedPlugin.config.transformer.name
    const currentTransformer =
      useAppStore.getState().appConfig?.picBed.transformer ?? 'path'
    const nextTransformer =
      currentTransformer === transformerName ? 'path' : transformerName

    await pluginsAdapter.saveTransformer(nextTransformer)
    await pluginsAdapter.setNeedReload(true)
    await appActions.refreshAppConfig()
    await appActions.hydrateAppState()

    return nextTransformer
  },
  async runPluginGuiMenuAction (fullName: string, label: string) {
    return {
      fullName,
      label,
      message: ''
    }
  },
  async fetchPluginReadme (fullName: string) {
    const currentState = usePluginStore.getState().readmeByPlugin[fullName]

    if (currentState?.status === pluginReadmeStatus.Loading) {
      return
    }

    pluginStoreActions.setReadmeState(fullName, {
      status: pluginReadmeStatus.Loading,
      content: '',
      errorMessage: null
    })

    try {
      const content = await pluginsAdapter.fetchPluginReadme(fullName)

      pluginStoreActions.setReadmeState(fullName, {
        status: content.trim() ? pluginReadmeStatus.Ready : pluginReadmeStatus.Empty,
        content,
        errorMessage: null
      })
    } catch (error) {
      pluginStoreActions.setReadmeState(fullName, {
        status: pluginReadmeStatus.Error,
        content: '',
        errorMessage: error instanceof Error ? error.message : String(error)
      })
    }
  },
  async importLocalPlugin (folderPath: string): Promise<PluginImportResult> {
    pluginStoreActions.setImportingLocal(true)

    try {
      await pluginsAdapter.importLocalPlugin()
      await appActions.hydrateAppState()
      const installedPlugins = await pluginsAdapter.getInstalledPlugins()
      pluginStoreActions.setInstalledPlugins(installedPlugins.map(mapInstalledPluginItem))
      const installedPlugin = useAppStore.getState().pluginsInstalled.find(
        (item) => item.fullName === folderPath || item.name === folderPath
      )

      if (!installedPlugin) {
        throw new Error('Imported plugin not found')
      }

      return {
        path: folderPath,
        installedPlugin
      }
    } finally {
      pluginStoreActions.setImportingLocal(false)
    }
  }
}
