import axios from 'axios'
import { ipcRenderer } from 'electron'
import { OPEN_URL, SHOW_PLUGIN_PAGE_MENU } from '#/events/constants'
import { IRPCActionType } from '~/universal/types/enum'
import { getConfig, invokeRPC, saveConfig, sendRPC, sendToMain } from '@/utils/dataSender'

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

const README_FILE_CANDIDATES = ['README.md', 'readme.md', 'Readme.md'] as const

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
    return invokeRPC<string>(IRPCActionType.INSTALL_PLUGIN, fullName).then((result: IRPCResult<string>) => ({
      success: result.success,
      body: fullName,
      errMsg: result.success ? '' : (result.error || '')
    }))
  },
  importLocalPlugin () {
    return invokeRPC<string | null>(IRPCActionType.IMPORT_LOCAL_PLUGIN)
  },
  uninstallPlugin (fullName: string) {
    return invokeRPC<string>(IRPCActionType.UNINSTALL_PLUGIN, fullName)
  },
  updatePlugin (fullName: string) {
    return invokeRPC<string>(IRPCActionType.UPDATE_PLUGIN, fullName)
  },
  togglePluginEnabled (fullName: string, enabled: boolean) {
    return invokeRPC<string>(
      enabled
        ? IRPCActionType.ENABLE_PLUGIN
        : IRPCActionType.DISABLE_PLUGIN,
      fullName
    )
  },
  async saveTransformer (transformer: string) {
    await saveConfig({
      'picBed.transformer': transformer
    })
  },
  async fetchPluginReadme (fullName: string) {
    let lastError: unknown = null

    for (const readmeFileName of README_FILE_CANDIDATES) {
      try {
        const response = await axios.get<string>(
          `https://cdn.jsdelivr.net/npm/${fullName}/${readmeFileName}`,
          {
            responseType: 'text'
          }
        )

        return response.data || ''
      } catch (error) {
        lastError = error
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Failed to fetch plugin readme')
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
