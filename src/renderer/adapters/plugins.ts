import axios from 'axios'
import { ipcRenderer } from 'electron'
import { OPEN_URL, PICGO_CONFIG_PLUGIN, PICGO_HANDLE_PLUGIN_DONE, PICGO_HANDLE_PLUGIN_ING, PICGO_TOGGLE_PLUGIN, SHOW_PLUGIN_PAGE_MENU } from '#/events/constants'
import { IRPCActionType } from '~/universal/types/enum'
import { getConfig, saveConfig, sendRPC, sendToMain } from '@/utils/dataSender'

interface PluginInstallResult {
  success: boolean
  body: string
  errMsg: string
}

interface NpmSearchResultObject {
  package: {
    name: string
    version: string
    description: string
    keywords?: string[]
    maintainers?: Array<{
      username: string
    }>
    links?: {
      homepage?: string
    }
  }
}

interface PluginLifecycleListeners {
  onConfigPlugin?: (currentType: 'plugin' | 'transformer' | 'uploader', configName: string, config: IPicGoPluginConfig[]) => void
  onHideLoading?: () => void
  onPluginDone?: (fullName: string) => void
  onPluginIng?: (fullName: string) => void
  onPluginToggle?: (fullName: string, enabled: boolean) => void
  onUninstallSuccess?: (fullName: string) => void
  onUpdateSuccess?: (fullName: string) => void
}

function streamlinePluginName (fullName: string) {
  return fullName.replace(/^picgo-plugin-/, '')
}

export const pluginsAdapter = {
  getInstalledPlugins (): Promise<IPicGoPlugin[]> {
    return new Promise((resolve) => {
      const handleResponse = (_event: Electron.IpcRendererEvent, list: IPicGoPlugin[]) => {
        resolve(list)
      }

      ipcRenderer.once('pluginList', handleResponse)
      sendToMain('getPluginList')
    })
  },
  installPlugin (fullName: string): Promise<PluginInstallResult> {
    return new Promise((resolve) => {
      const handleResponse = (_event: Electron.IpcRendererEvent, result: PluginInstallResult) => {
        resolve(result)
      }

      ipcRenderer.once('installPlugin', handleResponse)
      sendToMain('installPlugin', fullName)
    })
  },
  importLocalPlugin (): Promise<void> {
    return new Promise((resolve) => {
      const handleResponse = () => {
        resolve()
      }

      ipcRenderer.once('hideLoading', handleResponse)
      sendToMain('importLocalPlugin')
    })
  },
  openPluginMenu (plugin: IPicGoPlugin) {
    sendToMain(SHOW_PLUGIN_PAGE_MENU, plugin)
  },
  reloadApp () {
    sendRPC(IRPCActionType.RELOAD_APP)
  },
  async getNeedReload () {
    return (await getConfig<boolean>('needReload')) || false
  },
  async setNeedReload (value: boolean) {
    await saveConfig({
      needReload: value
    })
  },
  async getPluginConfigValues (currentType: 'plugin' | 'transformer' | 'uploader', configName: string) {
    if (currentType === 'plugin') {
      return (await getConfig<IStringKeyMap>(configName)) || {}
    }

    if (currentType === 'uploader') {
      return (await getConfig<IStringKeyMap>(`picBed.${configName}`)) || {}
    }

    return (await getConfig<IStringKeyMap>(`transformer.${configName}`)) || {}
  },
  async savePluginConfig (currentType: 'plugin' | 'transformer' | 'uploader', configName: string, values: IStringKeyMap) {
    if (currentType === 'plugin') {
      await saveConfig({
        [configName]: values
      })
      return
    }

    if (currentType === 'uploader') {
      await saveConfig({
        [`picBed.${configName}`]: values
      })
      return
    }

    await saveConfig({
      [`transformer.${configName}`]: values
    })
  },
  subscribeLifecycle (listeners: PluginLifecycleListeners) {
    const disposers: Array<() => void> = []

    const register = <T extends unknown[]>(channel: string, listener?: (...args: T) => void) => {
      if (!listener) {
        return
      }

      const handler = (_event: Electron.IpcRendererEvent, ...args: T) => {
        listener(...args)
      }

      ipcRenderer.on(channel, handler)
      disposers.push(() => {
        ipcRenderer.removeListener(channel, handler)
      })
    }

    register(PICGO_CONFIG_PLUGIN, listeners.onConfigPlugin)
    register(PICGO_HANDLE_PLUGIN_DONE, listeners.onPluginDone)
    register(PICGO_HANDLE_PLUGIN_ING, listeners.onPluginIng)
    register(PICGO_TOGGLE_PLUGIN, listeners.onPluginToggle)
    register('hideLoading', listeners.onHideLoading)
    register('uninstallSuccess', listeners.onUninstallSuccess)
    register('updateSuccess', listeners.onUpdateSuccess)

    return () => {
      disposers.forEach((dispose) => {
        dispose()
      })
    }
  },
  async searchPlugins (searchText: string, installedPlugins: IPicGoPlugin[]) {
    const response = await axios.get<{ objects: NpmSearchResultObject[] }>(`https://registry.npmjs.com/-/v1/search?text=${searchText}`)
    const installedNames = new Set(installedPlugins.map((item) => item.fullName))

    return response.data.objects
      .filter((item) => item.package.name.includes('picgo-plugin-'))
      .filter((item) => {
        const description = item.package.description || ''
        return !description.includes('picgo.net') && !description.includes('PicGo官方')
      })
      .map((item) => ({
        name: streamlinePluginName(item.package.name),
        fullName: item.package.name,
        author: item.package.maintainers?.[0]?.username || '',
        description: item.package.description || '',
        logo: `https://cdn.jsdelivr.net/npm/${item.package.name}/logo.png`,
        config: {},
        homepage: item.package.links?.homepage || '',
        hasInstall: installedNames.has(item.package.name),
        version: item.package.version,
        gui: Boolean(item.package.keywords?.includes('picgo-gui-plugin')),
        ing: false
      } as IPicGoPlugin))
  },
  openPluginHomepage (url: string) {
    if (!url) {
      return
    }
    sendToMain(OPEN_URL, url)
  },
  openAwesomeList () {
    sendToMain(OPEN_URL, 'https://github.com/PicGo/Awesome-PicGo')
  }
}
