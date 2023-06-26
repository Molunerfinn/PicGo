import bus from '@core/bus'
import {
  globalShortcut
} from 'electron'
import logger from '@core/picgo/logger'
import GuiApi from '../../gui'
import db from '~/main/apis/core/datastore'
import { TOGGLE_SHORTKEY_MODIFIED_MODE } from '#/events/constants'
import shortKeyService from './shortKeyService'
import picgo from '@core/picgo'
import { BuiltinShortKeyMap } from './builtin'
import { SHORTKEY_BUILTIN_PREFIX } from '../../core/bus/constants'

class ShortKeyHandler {
  private isInModifiedMode: boolean = false
  constructor () {
    bus.on(TOGGLE_SHORTKEY_MODIFIED_MODE, flag => {
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
      .forEach(command => {
        const config = commands[command]
        // if disabled, don't register #534
        logger.info(`register builtin shortKey command: [${command}] - [${config.key}]`)
        if (config.enable) {
          logger.info(`register builtin shortKey command: [${command}] - [${config.key}] successfully`)
          globalShortcut.register(config.key, () => {
            this.handler(command)
          })
        } else {
          logger.warn(`builtin shortKey command: [${command}] - [${config.key}] register failed, it's disabled`)
        }
      })
  }

  private initPluginsShortKey () {
    // get enabled plugin
    const pluginList = picgo.pluginLoader.getList()
    for (const item of pluginList) {
      const plugin = picgo.pluginLoader.getPlugin(item)
      // if a plugin has commands
      if (plugin && plugin.commands) {
        if (typeof plugin.commands !== 'function') {
          logger.warn(`${item}'s commands is not a function`)
          continue
        }
        const commands = plugin.commands(picgo) as IPluginShortKeyConfig[]
        for (const cmd of commands) {
          const command = `${item}:${cmd.name}`
          if (db.has(`settings.shortKey[${command}]`)) {
            const commandConfig = db.get(`settings.shortKey.${command}`) as IShortKeyConfig
            // if disabled, don't register #534
            if (commandConfig.enable) {
              this.registerShortKey(commandConfig, command, cmd.handle, false)
            }
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
    // if the config file already had this command
    // then writeFlag -> false
    if (writeFlag) {
      picgo.saveConfig({
        [`settings.shortKey.${command}`]: {
          enable: true,
          name: config.name,
          label: config.label,
          key: config.key
        }
      })
    }
  }

  // enable or disable shortKey
  bindOrUnbindShortKey (item: IShortKeyConfig, from: string): boolean {
    const command = `${from}:${item.name}`
    if (item.enable === false) {
      globalShortcut.unregister(item.key)
      picgo.saveConfig({
        [`settings.shortKey.${command}.enable`]: false
      })
      return true
    } else {
      if (globalShortcut.isRegistered(item.key)) {
        return false
      } else {
        picgo.saveConfig({
          [`settings.shortKey.${command}.enable`]: true
        })
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
    picgo.saveConfig({
      [`settings.shortKey.${command}.key`]: item.key
    })
    globalShortcut.register(item.key, () => {
      this.handler(`${from}:${item.name}`)
    })
    return true
  }

  private async handler (command: string) {
    if (this.isInModifiedMode) {
      logger.warn(`in modified mode, ignore shortKey command: [${command}]`)
      return
    }
    if (command.includes(SHORTKEY_BUILTIN_PREFIX)) {
      const handler = BuiltinShortKeyMap[command]
      if (handler) {
        logger.info(`get builtin shortKey handler for command: [${command}]`)
        return handler()
      } else {
        logger.warn(`can't find builtin shortKey handler for command: [${command}]`)
      }
    } else if (command.includes('picgo-plugin-')) {
      const handler = shortKeyService.getShortKeyHandler(command)
      if (handler) {
        logger.info(`get plugin shortKey handler for command: [${command}]`)
        return handler(picgo, GuiApi.getInstance())
      }
    } else {
      logger.warn(`can not find command: [${command}]`)
    }
  }

  registerPluginShortKey (pluginName: string) {
    const plugin = picgo.pluginLoader.getPlugin(pluginName)
    if (plugin && plugin.commands) {
      if (typeof plugin.commands !== 'function') {
        logger.warn(`${pluginName}'s commands is not a function`)
        return
      }
      const commands = plugin.commands(picgo) as IPluginShortKeyConfig[]
      for (const cmd of commands) {
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
