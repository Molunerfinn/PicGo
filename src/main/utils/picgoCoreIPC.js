import path from 'path'

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
      const obj = {
        name: pluginList[i].replace(/picgo-plugin-/, ''),
        author: pluginPKG.author.name || pluginPKG.author,
        description: pluginPKG.description,
        logo: 'file://' + path.join(pluginPath, 'logo.png').split(path.sep).join('/'),
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
        enabled: picgo.getConfig(`plugins.${pluginList[i]}`),
        homepage: pluginPKG.homepage ? pluginPKG.homepage : ''
      }
      list.push(obj)
    }
    event.sender.send('pluginList', list)
  })
}

const handlePluginInstall = (ipcMain, STORE_PATH, CONFIG_PATH) => {
  ipcMain.on('installPlugin', (event, msg) => {
    const picgo = new PicGo(CONFIG_PATH)
    const pluginHandler = new PluginHandler(picgo)
    picgo.on('installSuccess', (plugin) => {
      console.log(plugin)
    })
    pluginHandler.install([`picgo-plugin-${msg}`])
  })
}

const handlePluginUninstall = (ipcMain, STORE_PATH, CONFIG_PATH) => {
  ipcMain.on('uninstallPlugin', (event, msg) => {
    const picgo = new PicGo(CONFIG_PATH)
    const pluginHandler = new PluginHandler(picgo)
    console.log(msg, 123)
    picgo.on('uninstallSuccess', (plugin) => {
      console.log(plugin)
    })
    pluginHandler.uninstall([`picgo-plugin-${msg}`])
  })
}

export default (app, ipcMain) => {
  const STORE_PATH = app.getPath('userData')
  const CONFIG_PATH = path.join(STORE_PATH, '/data.json')
  handleGetPluginList(ipcMain, STORE_PATH, CONFIG_PATH)
  handlePluginInstall(ipcMain, STORE_PATH, CONFIG_PATH)
  handlePluginUninstall(ipcMain, STORE_PATH, CONFIG_PATH)
}
