import path from 'path'
import GuiApi from 'apis/gui'
import {
  dialog,
  shell,
  IpcMainEvent,
  ipcMain,
  clipboard
} from 'electron'
import { IPasteStyle, IPicGoHelperType, IWindowList } from '#/types/enum'
import shortKeyHandler from 'apis/app/shortKey/shortKeyHandler'
import picgo from '@core/picgo'
import { handleStreamlinePluginName, simpleClone } from '~/universal/utils/common'
import { IGuiMenuItem, PicGo as PicGoCore } from 'picgo'
import windowManager from 'apis/app/window/windowManager'
import { showNotification } from '~/main/utils/common'
import { dbPathChecker } from 'apis/core/datastore/dbChecker'
import {
  PICGO_SAVE_CONFIG,
  PICGO_GET_CONFIG,
  PICGO_GET_DB,
  PICGO_INSERT_DB,
  PICGO_INSERT_MANY_DB,
  PICGO_UPDATE_BY_ID_DB,
  PICGO_GET_BY_ID_DB,
  PICGO_REMOVE_BY_ID_DB,
  PICGO_OPEN_FILE,
  PASTE_TEXT,
  OPEN_WINDOW,
  GET_LANGUAGE_LIST,
  SET_CURRENT_LANGUAGE,
  GET_CURRENT_LANGUAGE,
  GET_PICBED_CONFIG
} from '#/events/constants'

import { GalleryDB } from 'apis/core/datastore'
import { IObject, IFilter } from '@picgo/store/dist/types'
import pasteTemplate from '../utils/pasteTemplate'
import { i18nManager, T } from '~/main/i18n'
import { rpcServer } from './rpc'

// eslint-disable-next-line
const requireFunc = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require
// const PluginHandler = requireFunc('picgo/lib/PluginHandler').default
const STORE_PATH = path.dirname(dbPathChecker())
// const CONFIG_PATH = path.join(STORE_PATH, '/data.json')

interface GuiMenuItem {
  label: string
  handle: (arg0: PicGoCore, arg1: GuiApi) => Promise<void>
}

// get uploader or transformer config
const getConfig = (name: string, type: IPicGoHelperType, ctx: PicGoCore) => {
  let config: any[] = []
  if (name === '') {
    return config
  } else {
    const handler = ctx.helper[type].get(name)
    if (handler) {
      if (handler.config) {
        config = handler.config(ctx)
      }
    }
    return config
  }
}

const handleConfigWithFunction = (config: any[]) => {
  for (const i in config) {
    if (typeof config[i].default === 'function') {
      config[i].default = config[i].default()
    }
    if (typeof config[i].choices === 'function') {
      config[i].choices = config[i].choices()
    }
  }
  return config
}

const getPluginList = (): IPicGoPlugin[] => {
  const pluginList = picgo.pluginLoader.getFullList()
  const list = []
  for (const i in pluginList) {
    const plugin = picgo.pluginLoader.getPlugin(pluginList[i])!
    const pluginPath = path.join(STORE_PATH, `/node_modules/${pluginList[i]}`)
    const pluginPKG = requireFunc(path.join(pluginPath, 'package.json'))
    const uploaderName = plugin.uploader || ''
    const transformerName = plugin.transformer || ''
    let menu: Omit<IGuiMenuItem, 'handle'>[] = []
    if (plugin.guiMenu) {
      menu = plugin.guiMenu(picgo).map(item => ({
        label: item.label
      }))
    }
    let gui = false
    if (pluginPKG.keywords && pluginPKG.keywords.length > 0) {
      if (pluginPKG.keywords.includes('picgo-gui-plugin')) {
        gui = true
      }
    }
    const obj: IPicGoPlugin = {
      name: handleStreamlinePluginName(pluginList[i]),
      fullName: pluginList[i],
      author: pluginPKG.author.name || pluginPKG.author,
      description: pluginPKG.description,
      logo: 'file://' + path.join(pluginPath, 'logo.png').split(path.sep).join('/'),
      version: pluginPKG.version,
      gui,
      config: {
        plugin: {
          fullName: pluginList[i],
          name: handleStreamlinePluginName(pluginList[i]),
          config: plugin.config ? handleConfigWithFunction(plugin.config(picgo)) : []
        },
        uploader: {
          name: uploaderName,
          config: handleConfigWithFunction(getConfig(uploaderName, IPicGoHelperType.uploader, picgo))
        },
        transformer: {
          name: transformerName,
          config: handleConfigWithFunction(getConfig(uploaderName, IPicGoHelperType.transformer, picgo))
        }
      },
      enabled: picgo.getConfig(`picgoPlugins.${pluginList[i]}`),
      homepage: pluginPKG.homepage ? pluginPKG.homepage : '',
      guiMenu: menu,
      ing: false
    }
    list.push(obj)
  }
  return list
}

const handleGetPluginList = () => {
  ipcMain.on('getPluginList', (event: IpcMainEvent) => {
    try {
      const list = simpleClone(getPluginList())
      // here can just send JS Object not function
      // or will cause [Failed to serialize arguments] error
      event.sender.send('pluginList', list)
    } catch (e: any) {
      event.sender.send('pluginList', [])
      showNotification({
        title: T('TIPS_GET_PLUGIN_LIST_FAILED'),
        body: e.message
      })
      picgo.log.error(e)
    }
  })
}

const handlePluginInstall = () => {
  ipcMain.on('installPlugin', async (event: IpcMainEvent, fullName: string) => {
    const dispose = handleNPMError()
    const res = await picgo.pluginHandler.install([fullName])
    event.sender.send('installPlugin', {
      success: res.success,
      body: fullName,
      errMsg: res.success ? '' : res.body
    })
    if (res.success) {
      shortKeyHandler.registerPluginShortKey(res.body[0])
    } else {
      showNotification({
        title: T('PLUGIN_INSTALL_FAILED'),
        body: res.body as string
      })
    }
    event.sender.send('hideLoading')
    dispose()
  })
}

const handlePluginUninstall = async (fullName: string) => {
  const window = windowManager.get(IWindowList.SETTING_WINDOW)!
  const dispose = handleNPMError()
  const res = await picgo.pluginHandler.uninstall([fullName])
  if (res.success) {
    window.webContents.send('uninstallSuccess', res.body[0])
    shortKeyHandler.unregisterPluginShortKey(res.body[0])
  } else {
    showNotification({
      title: T('PLUGIN_UNINSTALL_FAILED'),
      body: res.body as string
    })
  }
  window.webContents.send('hideLoading')
  dispose()
}

const handlePluginUpdate = async (fullName: string) => {
  const window = windowManager.get(IWindowList.SETTING_WINDOW)!
  const dispose = handleNPMError()
  const res = await picgo.pluginHandler.update([fullName])
  if (res.success) {
    window.webContents.send('updateSuccess', res.body[0])
  } else {
    showNotification({
      title: T('PLUGIN_UPDATE_FAILED'),
      body: res.body as string
    })
  }
  window.webContents.send('hideLoading')
  dispose()
}

const handleNPMError = (): IDispose => {
  const handler = (msg: string) => {
    if (msg === 'NPM is not installed') {
      dialog.showMessageBox({
        title: T('TIPS_ERROR'),
        message: T('TIPS_INSTALL_NODE_AND_RELOAD_PICGO'),
        buttons: ['Yes']
      }).then((res) => {
        if (res.response === 0) {
          shell.openExternal('https://nodejs.org/')
        }
      })
    }
  }
  picgo.once('failed', handler)
  return () => picgo.off('failed', handler)
}

const handleGetPicBedConfig = () => {
  ipcMain.on(GET_PICBED_CONFIG, (event: IpcMainEvent, type: string) => {
    const name = picgo.helper.uploader.get(type)?.name || type
    if (picgo.helper.uploader.get(type)?.config) {
      const _config = picgo.helper.uploader.get(type)!.config!(picgo)
      const config = handleConfigWithFunction(_config)
      event.sender.send(GET_PICBED_CONFIG, config, name)
    } else {
      event.sender.send(GET_PICBED_CONFIG, [], name)
    }
  })
}

// TODO: remove it
const handlePluginActions = () => {
  ipcMain.on('pluginActions', (event: IpcMainEvent, name: string, label: string) => {
    const plugin = picgo.pluginLoader.getPlugin(name)
    if (plugin?.guiMenu?.(picgo)?.length) {
      const menu: GuiMenuItem[] = plugin.guiMenu(picgo)
      menu.forEach(item => {
        if (item.label === label) {
          item.handle(picgo, GuiApi.getInstance())
        }
      })
    }
  })
}

const handleRemoveFiles = () => {
  ipcMain.on('removeFiles', (event: IpcMainEvent, files: ImgInfo[]) => {
    setTimeout(() => {
      picgo.emit('remove', files, GuiApi.getInstance())
    }, 500)
  })
}

const handlePicGoSaveConfig = () => {
  ipcMain.on(PICGO_SAVE_CONFIG, (event: IpcMainEvent, data: IObj) => {
    picgo.saveConfig(data)
  })
}

const handlePicGoGetConfig = () => {
  ipcMain.on(PICGO_GET_CONFIG, (event: IpcMainEvent, key: string | undefined, callbackId: string) => {
    const result = picgo.getConfig(key)
    event.sender.send(PICGO_GET_CONFIG, result, callbackId)
  })
}

const handleImportLocalPlugin = () => {
  ipcMain.on('importLocalPlugin', async (event: IpcMainEvent) => {
    const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)!
    const res = await dialog.showOpenDialog(settingWindow, {
      properties: ['openDirectory']
    })
    const filePaths = res.filePaths
    if (filePaths.length > 0) {
      const res = await picgo.pluginHandler.install(filePaths)
      if (res.success) {
        try {
          const list = simpleClone(getPluginList())
          event.sender.send('pluginList', list)
        } catch (e: any) {
          event.sender.send('pluginList', [])
          showNotification({
            title: T('TIPS_GET_PLUGIN_LIST_FAILED'),
            body: e.message
          })
        }
        showNotification({
          title: T('PLUGIN_IMPORT_SUCCEED'),
          body: ''
        })
      } else {
        showNotification({
          title: T('PLUGIN_IMPORT_FAILED'),
          body: res.body as string
        })
      }
    }
    event.sender.send('hideLoading')
  })
}

const handlePicGoGalleryDB = () => {
  ipcMain.on(PICGO_GET_DB, async (event: IpcMainEvent, filter: IFilter, callbackId: string) => {
    const dbStore = GalleryDB.getInstance()
    const res = await dbStore.get(filter)
    event.sender.send(PICGO_GET_DB, res, callbackId)
  })

  ipcMain.on(PICGO_INSERT_DB, async (event: IpcMainEvent, value: IObject, callbackId: string) => {
    const dbStore = GalleryDB.getInstance()
    const res = await dbStore.insert(value)
    event.sender.send(PICGO_INSERT_DB, res, callbackId)
  })

  ipcMain.on(PICGO_INSERT_MANY_DB, async (event: IpcMainEvent, value: IObject[], callbackId: string) => {
    const dbStore = GalleryDB.getInstance()
    const res = await dbStore.insertMany(value)
    event.sender.send(PICGO_INSERT_MANY_DB, res, callbackId)
  })

  ipcMain.on(PICGO_UPDATE_BY_ID_DB, async (event: IpcMainEvent, id: string, value: IObject[], callbackId: string) => {
    const dbStore = GalleryDB.getInstance()
    const res = await dbStore.updateById(id, value)
    event.sender.send(PICGO_UPDATE_BY_ID_DB, res, callbackId)
  })

  ipcMain.on(PICGO_GET_BY_ID_DB, async (event: IpcMainEvent, id: string, callbackId: string) => {
    const dbStore = GalleryDB.getInstance()
    const res = await dbStore.getById(id)
    event.sender.send(PICGO_GET_BY_ID_DB, res, callbackId)
  })

  ipcMain.on(PICGO_REMOVE_BY_ID_DB, async (event: IpcMainEvent, id: string, callbackId: string) => {
    const dbStore = GalleryDB.getInstance()
    const res = await dbStore.removeById(id)
    event.sender.send(PICGO_REMOVE_BY_ID_DB, res, callbackId)
  })

  ipcMain.handle(PASTE_TEXT, async (_, item: ImgInfo, copy = true) => {
    const pasteStyle = picgo.getConfig<IPasteStyle>('settings.pasteStyle') || IPasteStyle.MARKDOWN
    const customLink = picgo.getConfig<string>('settings.customLink')
    const txt = pasteTemplate(pasteStyle, item, customLink)
    if (copy) {
      clipboard.writeText(txt)
    }
    return txt
  })
}

const handleOpenFile = () => {
  ipcMain.on(PICGO_OPEN_FILE, (event: IpcMainEvent, fileName: string) => {
    const abFilePath = path.join(STORE_PATH, fileName)
    shell.openPath(abFilePath)
  })
}

const handleOpenWindow = () => {
  ipcMain.on(OPEN_WINDOW, (event: IpcMainEvent, windowName: IWindowList) => {
    const window = windowManager.get(windowName)
    if (window) {
      window.show()
    }
  })
}

const handleI18n = () => {
  ipcMain.on(GET_LANGUAGE_LIST, (event: IpcMainEvent) => {
    event.sender.send(GET_LANGUAGE_LIST, i18nManager.languageList)
  })
  ipcMain.on(SET_CURRENT_LANGUAGE, (event: IpcMainEvent, language: string) => {
    i18nManager.setCurrentLanguage(language)
    const { lang, locales } = i18nManager.getCurrentLocales()
    picgo.i18n.setLanguage(lang)
    if (process.platform === 'darwin') {
      const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW)
      trayWindow?.webContents.send(SET_CURRENT_LANGUAGE, lang, locales)
    }
    const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)
    settingWindow?.webContents.send(SET_CURRENT_LANGUAGE, lang, locales)
    if (windowManager.has(IWindowList.MINI_WINDOW)) {
      const miniWindow = windowManager.get(IWindowList.MINI_WINDOW)
      miniWindow?.webContents.send(SET_CURRENT_LANGUAGE, lang, locales)
    }
    // event.sender.send(SET_CURRENT_LANGUAGE, lang, locales)
  })
  ipcMain.on(GET_CURRENT_LANGUAGE, (event: IpcMainEvent) => {
    const { lang, locales } = i18nManager.getCurrentLocales()
    event.sender.send(GET_CURRENT_LANGUAGE, lang, locales)
  })
}

const handleRPCActions = () => {
  rpcServer.start()
}

export default {
  listen () {
    handleGetPluginList()
    handlePluginInstall()
    handleGetPicBedConfig()
    handlePluginActions()
    handleRemoveFiles()
    handlePicGoSaveConfig()
    handlePicGoGetConfig()
    handlePicGoGalleryDB()
    handleImportLocalPlugin()
    handleOpenFile()
    handleOpenWindow()
    handleI18n()
    handleRPCActions()
  },
  // TODO: separate to single file
  handlePluginUninstall,
  handlePluginUpdate
}
