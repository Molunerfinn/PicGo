import axios from 'axios'
import { ipcRenderer } from 'electron'
import { OPEN_URL, SHOW_PLUGIN_PAGE_MENU } from '#/events/constants'
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
  uninstallPlugin (fullName: string) {
    sendToMain('uninstallPlugin', fullName)
  },
  updatePlugin (fullName: string) {
    sendToMain('updatePlugin', fullName)
  },
  togglePluginEnabled (fullName: string, enabled: boolean) {
    return saveConfig({
      [`picgoPlugins.${fullName}`]: enabled
    })
  },
  async saveTransformer (transformer: string) {
    await saveConfig({
      'picBed.transformer': transformer
    })
  },
  async fetchPluginReadme (fullName: string) {
    const response = await axios.get<string>(
      `https://cdn.jsdelivr.net/npm/${fullName}/README.md`,
      {
        responseType: 'text'
      }
    )

    return response.data || ''
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
