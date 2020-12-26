import path from 'path'
import GuiApi from 'apis/gui'
import {
  dialog,
  shell,
  IpcMainEvent,
  ipcMain,
  app
} from 'electron'
import PicGoCore from '~/universal/types/picgo'
import { IPicGoHelperType } from '#/types/enum'
import shortKeyHandler from '../apis/app/shortKey/shortKeyHandler'
import picgo from '@core/picgo'
import { handleStreamlinePluginName } from '~/universal/utils/common'

// eslint-disable-next-line
const requireFunc = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require
// const PluginHandler = requireFunc('picgo/dist/lib/PluginHandler').default
const STORE_PATH = app.getPath('userData')
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

const handleGetPluginList = () => {
  ipcMain.on('getPluginList', (event: IpcMainEvent) => {
    const pluginList = picgo.pluginLoader.getFullList()
    const list = []
    for (let i in pluginList) {
      const plugin = picgo.pluginLoader.getPlugin(pluginList[i])
      const pluginPath = path.join(STORE_PATH, `/node_modules/${pluginList[i]}`)
      const pluginPKG = requireFunc(path.join(pluginPath, 'package.json'))
      const uploaderName = plugin.uploader || ''
      const transformerName = plugin.transformer || ''
      let menu = []
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
    event.sender.send('pluginList', list)
    picgo.cmd.program.removeAllListeners()
  })
}

const handlePluginInstall = () => {
  ipcMain.on('installPlugin', async (event: IpcMainEvent, msg: string) => {
    const dispose = handleNPMError()
    picgo.once('installSuccess', (notice: PicGoNotice) => {
      event.sender.send('installSuccess', notice.body[0])
      shortKeyHandler.registerPluginShortKey(notice.body[0])
      picgo.removeAllListeners('installFailed')
      dispose()
    })
    picgo.once('installFailed', () => {
      picgo.removeAllListeners('installSuccess')
      dispose()
    })
    await picgo.pluginHandler.install([msg])
    picgo.cmd.program.removeAllListeners()
  })
}

const handlePluginUninstall = () => {
  ipcMain.on('uninstallPlugin', async (event: IpcMainEvent, msg: string) => {
    const dispose = handleNPMError()
    picgo.once('uninstallSuccess', (notice: PicGoNotice) => {
      event.sender.send('uninstallSuccess', notice.body[0])
      shortKeyHandler.unregisterPluginShortKey(notice.body[0])
      picgo.removeAllListeners('uninstallFailed')
      dispose()
    })
    picgo.once('uninstallFailed', () => {
      picgo.removeAllListeners('uninstallSuccess')
      dispose()
    })
    await picgo.pluginHandler.uninstall([msg])
    picgo.cmd.program.removeAllListeners()
  })
}

const handlePluginUpdate = () => {
  ipcMain.on('updatePlugin', async (event: IpcMainEvent, msg: string) => {
    const dispose = handleNPMError()
    picgo.once('updateSuccess', (notice: { body: string[], title: string }) => {
      event.sender.send('updateSuccess', notice.body[0])
      picgo.removeAllListeners('updateFailed')
      dispose()
    })
    picgo.once('updateFailed', () => {
      picgo.removeAllListeners('updateSuccess')
      dispose()
    })
    await picgo.pluginHandler.update([msg])
    picgo.cmd.program.removeAllListeners()
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
    picgo.cmd.program.removeAllListeners()
  })
}

const handlePluginActions = () => {
  ipcMain.on('pluginActions', (event: IpcMainEvent, name: string, label: string) => {
    const plugin = picgo.pluginLoader.getPlugin(name)
    const guiApi = new GuiApi()
    if (plugin.guiMenu && plugin.guiMenu(picgo).length > 0) {
      const menu: GuiMenuItem[] = plugin.guiMenu(picgo)
      menu.forEach(item => {
        if (item.label === label) {
          item.handle(picgo, guiApi)
        }
      })
    }
  })
}

const handleRemoveFiles = () => {
  ipcMain.on('removeFiles', (event: IpcMainEvent, files: ImgInfo[]) => {
    const guiApi = new GuiApi()
    setTimeout(() => {
      picgo.emit('remove', files, guiApi)
    }, 500)
  })
}

const handlePicGoSaveData = () => {
  ipcMain.on('picgoSaveData', (event: IpcMainEvent, data: IObj) => {
    picgo.saveConfig(data)
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
    handlePicGoSaveData()
  }
}
