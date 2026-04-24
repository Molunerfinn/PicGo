import path from 'path'
import GuiApi from 'apis/gui'
import {
  shell,
  IpcMainEvent,
  ipcMain,
  clipboard
} from 'electron'
import fs from 'fs-extra'
import { IPasteStyle, IPicGoHelperType, IRPCActionType, IWindowList } from '#/types/enum'
import picgo from '@core/picgo'
import { handleStreamlinePluginName, simpleClone } from '~/universal/utils/common'
import { IBuildInEvent, IGuiMenuItem, PicGo as PicGoCore } from 'picgo'
import windowManager from 'apis/app/window/windowManager'
import { showNotification } from '~/main/utils/common'
import { dbPathChecker } from 'apis/core/datastore/dbChecker'
import logger from 'apis/core/picgo/logger'
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
import { notifyAppConfigUpdated } from '~/main/utils/appConfigNotifier'
import { rpcServer } from './rpc'

const STORE_PATH = path.dirname(dbPathChecker())

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
    const pluginPKG = fs.readJSONSync(path.join(pluginPath, 'package.json'), 'utf-8')
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

const handleRemoveFiles = () => {
  ipcMain.on('removeFiles', (event: IpcMainEvent, files: ImgInfo[]) => {
    setTimeout(() => {
      picgo.emit('remove', files, GuiApi.getInstance())
    }, 500)
  })
}

const handlePicGoSaveConfig = () => {
  ipcMain.handle(PICGO_SAVE_CONFIG, (_event, data: IObj) => {
    picgo.saveConfig(data)
    notifyAppConfigUpdated()
    return true
  })
}

const handlePicGoGetConfig = () => {
  ipcMain.on(PICGO_GET_CONFIG, (event: IpcMainEvent, key: string | undefined, callbackId: string) => {
    const result = picgo.getConfig(key)
    event.sender.send(PICGO_GET_CONFIG, result, callbackId)
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
    notifyAppConfigUpdated()
  })
  ipcMain.on(GET_CURRENT_LANGUAGE, (event: IpcMainEvent) => {
    const { lang, locales } = i18nManager.getCurrentLocales()
    event.sender.send(GET_CURRENT_LANGUAGE, lang, locales)
  })
}

const PICGO_CLOUD_TYPE = 'picgo-cloud'

const markImportedItemsInGalleryDB = async (items: Array<{ id?: string, type?: string }>): Promise<void> => {
  const dbStore = GalleryDB.getInstance()
  const itemsToMark = items.filter(
    (item) => typeof item.id === 'string' && item.id.trim() !== '' && item.type !== PICGO_CLOUD_TYPE
  )

  for (const item of itemsToMark) {
    try {
      await dbStore.updateById(item.id!, { _importToPicGoCloud: true })
    } catch {
      // Silently skip items that don't exist in local DB
    }
  }
}

const handleCloudAlbumEvents = () => {
  picgo.on(IBuildInEvent.CLOUD_ALBUM_UPDATED, (payload: { items?: Array<{ id?: string, type?: string }> } | undefined) => {
    if (windowManager.has(IWindowList.SETTING_WINDOW)) {
      windowManager.get(IWindowList.SETTING_WINDOW)!.webContents.send(
        IRPCActionType.UPDATE_CLOUD_ALBUM
      )
    }

    // Write back _importToPicGoCloud flag to local gallery DB for non-picgo-cloud items
    const items = payload?.items
    if (Array.isArray(items) && items.length > 0) {
      markImportedItemsInGalleryDB(items).catch((error) => {
        logger.error('[PicGo Cloud][album] failed to mark imported items in gallery DB', error)
      })
    }
  })

  picgo.on(IBuildInEvent.CLOUD_IMPORT_PROGRESS, (progress: unknown) => {
    if (windowManager.has(IWindowList.SETTING_WINDOW)) {
      windowManager.get(IWindowList.SETTING_WINDOW)!.webContents.send(
        'CLOUD_IMPORT_PROGRESS',
        progress
      )
    }
  })
}

const handleRPCActions = () => {
  rpcServer.start()
}

export default {
  listen () {
    handleGetPluginList()
    handleGetPicBedConfig()
    handleRemoveFiles()
    handlePicGoSaveConfig()
    handlePicGoGetConfig()
    handlePicGoGalleryDB()
    handleOpenFile()
    handleOpenWindow()
    handleI18n()
    handleCloudAlbumEvents()
    handleRPCActions()
  }
}
