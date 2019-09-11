import path from 'path'
import GuiApi from './guiApi'
import { dialog, shell } from 'electron'
import db from '../../datastore'

// eslint-disable-next-line
const requireFunc = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require
const PicGo = requireFunc('picgo')
const PluginHandler = requireFunc('picgo/dist/lib/PluginHandler').default

// get uploader or transformer config
const getConfig = (name, type, ctx) => {
  let config = []
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

const handleConfigWithFunction = config => {
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

const handleGetPluginList = (ipcMain, STORE_PATH, CONFIG_PATH) => {
  ipcMain.on('getPluginList', event => {
    const picgo = new PicGo(CONFIG_PATH)
    const pluginList = picgo.pluginLoader.getList()
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
      const obj = {
        name: pluginList[i].replace(/picgo-plugin-/, ''),
        author: pluginPKG.author.name || pluginPKG.author,
        description: pluginPKG.description,
        logo: 'file://' + path.join(pluginPath, 'logo.png').split(path.sep).join('/'),
        version: pluginPKG.version,
        gui,
        config: {
          plugin: {
            name: pluginList[i].replace(/picgo-plugin-/, ''),
            config: plugin.config ? handleConfigWithFunction(plugin.config(picgo)) : []
          },
          uploader: {
            name: uploaderName,
            config: handleConfigWithFunction(getConfig(uploaderName, 'uploader', picgo))
          },
          transformer: {
            name: transformerName,
            config: handleConfigWithFunction(getConfig(uploaderName, 'transformer', picgo))
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

const handlePluginInstall = (ipcMain, CONFIG_PATH) => {
  ipcMain.on('installPlugin', async (event, msg) => {
    const picgo = new PicGo(CONFIG_PATH)
    const pluginHandler = new PluginHandler(picgo)
    picgo.on('installSuccess', notice => {
      event.sender.send('installSuccess', notice.body[0].replace(/picgo-plugin-/, ''))
    })
    picgo.on('failed', () => {
      handleNPMError()
    })
    await pluginHandler.uninstall([msg])
    pluginHandler.install([msg])
    picgo.cmd.program.removeAllListeners()
  })
}

const handlePluginUninstall = (ipcMain, CONFIG_PATH) => {
  ipcMain.on('uninstallPlugin', async (event, msg) => {
    const picgo = new PicGo(CONFIG_PATH)
    const pluginHandler = new PluginHandler(picgo)
    picgo.on('uninstallSuccess', notice => {
      event.sender.send('uninstallSuccess', notice.body[0].replace(/picgo-plugin-/, ''))
    })
    picgo.on('failed', () => {
      handleNPMError()
    })
    await pluginHandler.uninstall([msg])
    picgo.cmd.program.removeAllListeners()
  })
}

const handlePluginUpdate = (ipcMain, CONFIG_PATH) => {
  ipcMain.on('updatePlugin', async (event, msg) => {
    const picgo = new PicGo(CONFIG_PATH)
    const pluginHandler = new PluginHandler(picgo)
    picgo.on('updateSuccess', notice => {
      event.sender.send('updateSuccess', notice.body[0].replace(/picgo-plugin-/, ''))
    })
    picgo.on('failed', () => {
      handleNPMError()
    })
    await pluginHandler.update([msg])
    picgo.cmd.program.removeAllListeners()
  })
}

const handleNPMError = () => {
  dialog.showMessageBox({
    title: '发生错误',
    message: '请安装Node.js并重启PicGo再继续操作',
    buttons: ['Yes']
  }, (res) => {
    if (res === 0) {
      shell.openExternal('https://nodejs.org/')
    }
  })
}

const handleGetPicBedConfig = (ipcMain, CONFIG_PATH) => {
  ipcMain.on('getPicBedConfig', (event, type) => {
    const picgo = new PicGo(CONFIG_PATH)
    const name = picgo.helper.uploader.get(type).name || type
    if (picgo.helper.uploader.get(type).config) {
      const config = handleConfigWithFunction(picgo.helper.uploader.get(type).config(picgo))
      event.sender.send('getPicBedConfig', config, name)
    } else {
      event.sender.send('getPicBedConfig', [], name)
    }
    picgo.cmd.program.removeAllListeners()
  })
}

const handlePluginActions = (ipcMain, CONFIG_PATH) => {
  ipcMain.on('pluginActions', (event, name, label) => {
    const picgo = new PicGo(CONFIG_PATH)
    const plugin = picgo.pluginLoader.getPlugin(`picgo-plugin-${name}`)
    const guiApi = new GuiApi(ipcMain, event.sender, picgo)
    if (plugin.guiMenu && plugin.guiMenu(picgo).length > 0) {
      const menu = plugin.guiMenu(picgo)
      menu.forEach(item => {
        if (item.label === label) {
          item.handle(picgo, guiApi)
        }
      })
    }
  })
}

const handleRemoveFiles = (ipcMain, CONFIG_PATH) => {
  ipcMain.on('removeFiles', (event, files) => {
    const picgo = new PicGo(CONFIG_PATH)
    const guiApi = new GuiApi(ipcMain, event.sender, picgo)
    setTimeout(() => {
      picgo.emit('remove', files, guiApi)
    }, 500)
  })
}

const handlePluginShortKeyRegister = (plugin) => {
  if (plugin.shortKeys && plugin.shortKeys.length > 0) {
    let shortKeyConfig = db.get('settings.shortKey')
    plugin.shortKeys.forEach(item => {
      if (!shortKeyConfig[item.name]) {
        shortKeyConfig[item.name] = item
      }
    })
  }
}

export default (app, ipcMain) => {
  const STORE_PATH = app.getPath('userData')
  const CONFIG_PATH = path.join(STORE_PATH, '/data.json')
  handleGetPluginList(ipcMain, STORE_PATH, CONFIG_PATH)
  handlePluginInstall(ipcMain, CONFIG_PATH)
  handlePluginUninstall(ipcMain, CONFIG_PATH)
  handlePluginUpdate(ipcMain, CONFIG_PATH)
  handleGetPicBedConfig(ipcMain, CONFIG_PATH)
  handlePluginActions(ipcMain, CONFIG_PATH)
  handleRemoveFiles(ipcMain, CONFIG_PATH)
  handlePluginShortKeyRegister({})
}
