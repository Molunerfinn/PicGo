import bus from './eventBus'
import PicGoCore from '~/universal/types/picgo'
import path from 'path'
import {
  app,
  globalShortcut,
  BrowserWindow
} from 'electron'
import logger from './logger'
import GuiApi from './guiApi'
import db from '#/datastore'
import shortKeyService from './shortKeyService'
// eslint-disable-next-line
const requireFunc = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require

const PicGo = requireFunc('picgo') as typeof PicGoCore
const STORE_PATH = app.getPath('userData')
const CONFIG_PATH = path.join(STORE_PATH, '/data.json')

class ShortKeyHandler {
  private isInModifiedMode: boolean = false
  constructor () {
    bus.on('toggleShortKeyModifiedMode', flag => {
      this.isInModifiedMode = flag
    })
  }
  init () {
    this.initBuiltInShortKey()
    this.initPluginsShortKey()
  }
  private initBuiltInShortKey () {
    const commands = db.get('settings.shortKey') as IShortKeyConfigs
    Object.keys(commands)
      .filter(item => item.includes('picgo:'))
      .map(command => {
        const config = commands[command]
        globalShortcut.register(config.key, () => {
          this.handler(command)
        })
      })
  }
  private initPluginsShortKey () {
    const picgo = new PicGo(CONFIG_PATH)
    const pluginList = picgo.pluginLoader.getList()
    for (let item of pluginList) {
      const plugin = picgo.pluginLoader.getPlugin(item)
      // if a plugin has commands
      if (plugin && plugin.commands) {
        if (typeof plugin.commands !== 'function') {
          logger.warn(`${item}'s commands is not a function`)
          continue
        }
        const commands = plugin.commands(picgo) as IPluginShortKeyConfig[]
        for (let cmd of commands) {
          const command = `${item}:${cmd.name}`
          if (db.has(`settings.shortKey[${command}]`)) {
            const commandConfig = db.get(`settings.shortKey.${command}`) as IShortKeyConfig
            this.registerShortKey(commandConfig, command, cmd.handle, false)
          } else {
            this.registerShortKey(cmd, command, cmd.handle, true)
          }
        }
      } else {
        continue
      }
    }
  }
  private registerShortKey (config: IShortKeyConfig | IPluginShortKeyConfig, command: string, handler: IShortKeyHandler, writeFlag: boolean) {
    shortKeyService.registerCommand(command, handler)
    if (config.key) {
      globalShortcut.register(config.key, () => {
        this.handler(command)
      })
    } else {
      logger.warn(`${command} do not provide a key to bind`)
    }
    if (writeFlag) {
      db.set(`settings.shortKey.${command}`, {
        enable: true,
        name: config.name,
        label: config.label,
        key: config.key
      } as IShortKeyConfig)
    }
  }
  // enable or disable shortKey
  bindOrUnbindShortKey (item: IShortKeyConfig, from: string): boolean {
    const command = `${from}:${item.name}`
    if (item.enable === false) {
      globalShortcut.unregister(item.key)
      db.set(`settings.shortKey.${command}.enable`, false)
      return true
    } else {
      if (globalShortcut.isRegistered(item.key)) {
        return false
      } else {
        db.set(`settings.shortKey.${command}.enable`, true)
        globalShortcut.register(item.key, () => {
          this.handler(command)
        })
        return true
      }
    }
  }
  // update shortKey bindings
  updateShortKey (item: IShortKeyConfig, oldKey: string, from: string): boolean {
    const command = `${from}:${item.name}`
    if (globalShortcut.isRegistered(item.key)) return false
    globalShortcut.unregister(oldKey)
    db.set(`settings.shortKey.${command}.key`, item.key)
    globalShortcut.register(item.key, () => {
      this.handler(`${from}:${item.name}`)
    })
    return true
  }
  private async handler (command: string) {
    if (this.isInModifiedMode) {
      return
    }
    if (command.includes('picgo:')) {
      bus.emit(command)
    } else if (command.includes('picgo-plugin-')) {
      const handler = shortKeyService.getShortKeyHandler(command)
      if (handler) {
        const picgo = new PicGo(CONFIG_PATH)
        // make sure settingWindow is created
        bus.once('createSettingWindowDone', (cmd: string, settingWindowId: number) => {
          if (cmd === command) {
            const webContents = BrowserWindow.fromId(settingWindowId).webContents
            const guiApi = new GuiApi(webContents)
            return handler(picgo, guiApi)
          }
        })
        bus.emit('createSettingWindow', command)
      }
    } else {
      logger.warn(`can not find command: ${command}`)
    }
  }
  registerPluginShortKey (pluginName: string) {
    const picgo = new PicGo(CONFIG_PATH)
    const plugin = picgo.pluginLoader.getPlugin(pluginName)
    if (plugin && plugin.commands) {
      if (typeof plugin.commands !== 'function') {
        logger.warn(`${pluginName}'s commands is not a function`)
        return
      }
      const commands = plugin.commands(picgo) as IPluginShortKeyConfig[]
      for (let cmd of commands) {
        const command = `${pluginName}:${cmd.name}`
        if (db.has(`settings.shortKey[${command}]`)) {
          const commandConfig = db.get(`settings.shortKey[${command}]`) as IShortKeyConfig
          this.registerShortKey(commandConfig, command, cmd.handle, false)
        } else {
          this.registerShortKey(cmd, command, cmd.handle, true)
        }
      }
    }
  }
  unregisterPluginShortKey (pluginName: string) {
    const commands = db.get('settings.shortKey') as IShortKeyConfigs
    const keyList = Object.keys(commands)
      .filter(command => command.includes(pluginName))
      .map(command => {
        return {
          command,
          key: commands[command].key
        }
      }) as IKeyCommandType[]
    keyList.forEach(item => {
      globalShortcut.unregister(item.key)
      shortKeyService.unregisterCommand(item.command)
      db.unset('settings.shortKey', item.command)
    })
  }
}

export default new ShortKeyHandler()
