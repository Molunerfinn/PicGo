import path from 'path'

// eslint-disable-next-line
const requireFunc = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require
const PicGo = requireFunc('picgo')

export default (app, ipcMain) => {
  const STORE_PATH = app.getPath('userData')
  const CONFIG_PATH = path.join(STORE_PATH, '/data.json')
  const picgo = new PicGo(CONFIG_PATH)

  ipcMain.on('getPluginList', event => {
    const pluginList = picgo.pluginLoader.getList()
    const list = []
    for (let i in pluginList) {
      const pluginPath = path.join(STORE_PATH, `/node_modules/${pluginList[i]}`)
      const pluginPKG = requireFunc(path.join(pluginPath, 'package.json'))
      const obj = {
        name: pluginList[i],
        author: pluginPKG.author,
        description: pluginPKG.description,
        logo: path.join(pluginPath, 'logo.png').split(path.sep).join('/'),
        config: {
          plugin: picgo.pluginLoader.getPlugin(pluginList[i]).config ? picgo.pluginLoader.getPlugin(pluginList[i]).config(picgo) : []
        },
        enabled: picgo.getConfig(`plugins.${pluginList[i]}`)
      }
      list.push(obj)
    }
    event.sender.send('pluginList', list)
  })
}
