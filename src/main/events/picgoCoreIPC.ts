import path from 'path'
import GuiApi from 'apis/gui'
import {
  dialog,
  shell,
  IpcMainEvent,
  ipcMain
} from 'electron'
import PicGoCore from '~/universal/types/picgo'
import { IPicGoHelperType } from '#/types/enum'
import shortKeyHandler from 'apis/app/shortKey/shortKeyHandler'
import picgo from '@core/picgo'
import { handleStreamlinePluginName } from '~/universal/utils/common'
import { IGuiMenuItem } from 'picgo/dist/src/types'
import windowManager from 'apis/app/window/windowManager'
import { IWindowList } from 'apis/app/window/constants'
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
  PICGO_OPEN_FILE
} from '#/events/constants'

import { GalleryDB } from 'apis/core/datastore'
import { IObject, IFilter } from '@picgo/store/dist/types'

// eslint-disable-next-line
const requireFunc = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require
// const PluginHandler = requireFunc('picgo/dist/lib/PluginHandler').default
const STORE_PATH = path.dirname(dbPathChecker())
// const CONFIG_PATH = path.join(STORE_PATH, '/data.json')

type PicGoNotice = {
  title: string,
  body: string[]
}

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
  for (let i in config) {
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
  for (let i in pluginList) {
    const plugin = picgo.pluginLoader.getPlugin(pluginList[i])!
    const pluginPath = path.join(STORE_PATH, `/node_modules/${pluginList[i]}`)
    const pluginPKG = requireFunc(path.join(pluginPath, 'package.json'))
    const uploaderName = plugin.uploader || ''
    const transformerName = plugin.transformer || ''
    let menu: IGuiMenuItem[] = []
    if (plugin.guiMenu) {
      menu = plugin.guiMenu(picgo)
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
    const list = getPluginList()
    event.sender.send('pluginList', list)
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
        title: '插件安装失败',
        body: res.body as string
      })
    }
    event.sender.send('hideLoading')
    dispose()
  })
}

const handlePluginUninstall = () => {
  ipcMain.on('uninstallPlugin', async (event: IpcMainEvent, msg: string) => {
    const dispose = handleNPMError()
    const res = await picgo.pluginHandler.uninstall([msg])
    if (res.success) {
      event.sender.send('uninstallSuccess', res.body[0])
      shortKeyHandler.unregisterPluginShortKey(res.body[0])
    } else {
      showNotification({
        title: '插件卸载失败',
        body: res.body as string
      })
    }
    event.sender.send('hideLoading')
    dispose()
  })
}

const handlePluginUpdate = () => {
  ipcMain.on('updatePlugin', async (event: IpcMainEvent, msg: string) => {
    const dispose = handleNPMError()
    const res = await picgo.pluginHandler.update([msg])
    if (res.success) {
      event.sender.send('updateSuccess', res.body[0])
    } else {
      showNotification({
        title: '插件更新失败',
        body: res.body as string
      })
    }
    event.sender.send('hideLoading')
    dispose()
  })
}

const handleNPMError = (): IDispose => {
  const handler = (msg: string) => {
    if (msg === 'NPM is not installed') {
      dialog.showMessageBox({
        title: '发生错误',
        message: '请安装Node.js并重启PicGo再继续操作',
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
  ipcMain.on('getPicBedConfig', (event: IpcMainEvent, type: string) => {
    const name = picgo.helper.uploader.get(type)?.name || type
    if (picgo.helper.uploader.get(type)?.config) {
      const config = handleConfigWithFunction(picgo.helper.uploader.get(type)!.config(picgo))
      event.sender.send('getPicBedConfig', config, name)
    } else {
      event.sender.send('getPicBedConfig', [], name)
    }
  })
}

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
  ipcMain.on('importLocalPlugin', (event: IpcMainEvent) => {
    const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)!
    dialog.showOpenDialog(settingWindow, {
      properties: ['openDirectory']
    }, async (filePath: string[]) => {
      if (filePath.length > 0) {
        const res = await picgo.pluginHandler.install(filePath)
        if (res.success) {
          const list = getPluginList()
          event.sender.send('pluginList', list)
          showNotification({
            title: '导入插件成功',
            body: ''
          })
        } else {
          showNotification({
            title: '导入插件失败',
            body: res.body as string
          })
        }
      }
      event.sender.send('hideLoading')
    })
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
}

const handleOpenFile = () => {
  ipcMain.on(PICGO_OPEN_FILE, (event: IpcMainEvent, fileName: string) => {
    const abFilePath = path.join(STORE_PATH, fileName)
    shell.openItem(abFilePath)
  })
}

export default {
  listen () {
    handleGetPluginList()
    handlePluginInstall()
    handlePluginUninstall()
    handlePluginUpdate()
    handleGetPicBedConfig()
    handlePluginActions()
    handleRemoveFiles()
    handlePicGoSaveConfig()
    handlePicGoGetConfig()
    handlePicGoGalleryDB()
    handleImportLocalPlugin()
    handleOpenFile()
  }
}
