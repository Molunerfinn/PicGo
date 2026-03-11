import type {
  PluginConfigSectionType,
  PluginImportResult
} from '@/components/main/plugins/types'
import { pluginReadmeStatus } from '@/components/main/plugins/types'
import { usePluginStore } from './store'

export const pluginStoreActions = {
  setSearchValue (value: string) {
    usePluginStore.setState((state) => {
      state.searchValue = value
    })
  },
  async searchPlugins (_query: string) {
    usePluginStore.setState((state) => {
      state.searchResults = []
      state.isSearching = false
    })
  },
  async installPlugin (_fullName: string) {},
  async setPluginEnabled (_fullName: string, _enabled: boolean) {},
  async updatePlugin (_fullName: string) {},
  async uninstallPlugin (_fullName: string) {},
  async savePluginConfig (
    _fullName: string,
    _section: PluginConfigSectionType,
    _values: Record<string, unknown>
  ) {},
  async togglePluginTransformer (_fullName: string) {
    return ''
  },
  async runPluginGuiMenuAction (fullName: string, label: string) {
    return {
      fullName,
      label,
      message: ''
    }
  },
  async fetchPluginReadme (fullName: string) {
    usePluginStore.setState((state) => {
      state.readmeByPlugin[fullName] = {
        status: pluginReadmeStatus.Empty,
        content: '',
        errorMessage: null
      }
    })
  },
  async importLocalPlugin (folderPath: string): Promise<PluginImportResult> {
    return {
      path: folderPath,
      installedPlugin: {
        name: '',
        fullName: '',
        author: '',
        description: '',
        logo: '',
        version: '',
        gui: false,
        homepage: '',
        enabled: false,
        hasInstall: true,
        guiMenu: [],
        config: {
          plugin: {
            name: '',
            fullName: '',
            config: []
          },
          transformer: {
            name: '',
            fullName: '',
            config: []
          }
        }
      }
    }
  }
}
