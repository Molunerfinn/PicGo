import path from 'path'

// eslint-disable-next-line
const requireFunc = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require
const PicGo = requireFunc('picgo')

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

export default (app, ipcMain) => {
  const STORE_PATH = app.getPath('userData')
  const CONFIG_PATH = path.join(STORE_PATH, '/data.json')

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
        author: pluginPKG.author,
        description: pluginPKG.description,
        logo: path.join(pluginPath, 'logo.png').split(path.sep).join('/'),
        config: {
          plugin: {
            name: pluginList[i].replace(/picgo-plugin-/, ''),
            config: plugin.config ? plugin.config(picgo) : []
          },
          uploader: {
            name: uploaderName,
            config: getConfig(uploaderName, 'uploader', picgo)
          },
          transformer: {
            name: transformerName,
            config: getConfig(uploaderName, 'transformer', picgo)
          }
        },
        enabled: picgo.getConfig(`plugins.${pluginList[i]}`)
      }
      list.push(obj)
    }
    event.sender.send('pluginList', list)
  })
}
