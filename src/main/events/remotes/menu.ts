import windowManager from 'apis/app/window/windowManager'
import { IPluginMenuAction, IWindowList } from '#/types/enum'
import { Menu, BrowserWindow, app, dialog } from 'electron'
import picgo from '@core/picgo'
import {
  uploadClipboardFiles
} from '~/main/apis/app/uploader/apis'
import { privacyManager } from '~/main/utils/privacyManager'
import pkg from 'root/package.json'
import GuiApi from 'apis/gui'
import { PICGO_CONFIG_PLUGIN, PICGO_PLUGIN_MENU_ACTION, SHOW_MAIN_PAGE_DONATION, SHOW_MAIN_PAGE_QRCODE } from '~/universal/events/constants'
import { PicGo as PicGoCore } from 'picgo'
import { T } from '~/main/i18n'
import { buildPicBedListMenu } from './picBedListMenu'

interface GuiMenuItem {
  label: string
  handle: (arg0: PicGoCore, arg1: GuiApi) => Promise<void>
}

const buildMiniPageMenu = () => {
  const submenu = buildPicBedListMenu()
  const template = [
    {
      label: T('OPEN_MAIN_WINDOW'),
      click () {
        windowManager.get(IWindowList.SETTING_WINDOW)!.show()
        if (windowManager.has(IWindowList.MINI_WINDOW)) {
          windowManager.get(IWindowList.MINI_WINDOW)!.hide()
        }
      }
    },
    {
      label: T('CHOOSE_DEFAULT_PICBED'),
      type: 'submenu',
      submenu
    },
    {
      label: T('UPLOAD_BY_CLIPBOARD'),
      click () {
        uploadClipboardFiles()
      }
    },
    {
      label: T('HIDE_WINDOW'),
      click () {
        BrowserWindow.getFocusedWindow()!.hide()
      }
    },
    {
      label: T('PRIVACY_TERMS_AGREEMENT'),
      click () {
        privacyManager.show(false)
      }
    },
    {
      label: T('RELOAD_APP'),
      click () {
        app.relaunch()
        app.exit(0)
      }
    },
    {
      role: 'quit',
      label: T('QUIT')
    }
  ]
  // @ts-ignore
  return Menu.buildFromTemplate(template)
}

const buildMainPageMenu = (win: BrowserWindow) => {
  const template = [
    {
      label: T('ABOUT'),
      click () {
        dialog.showMessageBox({
          title: 'PicGo',
          message: 'PicGo',
          detail: `Version: ${pkg.version}\nAuthor: Molunerfinn\nGithub: https://github.com/Molunerfinn/PicGo`
        })
      }
    },
    {
      label: T('SPONSOR_PICGO'),
      click () {
        win?.webContents?.send(SHOW_MAIN_PAGE_DONATION)
      }
    },
    {
      label: T('SHOW_PICBED_QRCODE'),
      click () {
        win?.webContents?.send(SHOW_MAIN_PAGE_QRCODE)
      }
    },
    {
      label: T('OPEN_TOOLBOX'),
      click () {
        const window = windowManager.create(IWindowList.TOOLBOX_WINDOW)
        window?.show()
      }
    },
    {
      label: T('SHOW_DEVTOOLS'),
      click () {
        win?.webContents?.openDevTools({
          mode: 'detach'
        })
      }
    },
    {
      label: T('PRIVACY_TERMS_AGREEMENT'),
      click () {
        privacyManager.show(false)
      }
    }
  ]
  // @ts-ignore
  return Menu.buildFromTemplate(template)
}

// TODO: separate to single file

const buildPluginPageMenu = (plugin: IPicGoPlugin) => {
  const menu = [{
    label: T('ENABLE_PLUGIN'),
    enabled: !plugin.enabled,
    click () {
      const window = windowManager.get(IWindowList.SETTING_WINDOW)!
      window.webContents.send(PICGO_PLUGIN_MENU_ACTION, plugin.fullName, IPluginMenuAction.ENABLE)
    }
  }, {
    label: T('DISABLE_PLUGIN'),
    enabled: plugin.enabled,
    click () {
      const window = windowManager.get(IWindowList.SETTING_WINDOW)!
      window.webContents.send(PICGO_PLUGIN_MENU_ACTION, plugin.fullName, IPluginMenuAction.DISABLE)
    }
  }, {
    label: T('UNINSTALL_PLUGIN'),
    click () {
      const window = windowManager.get(IWindowList.SETTING_WINDOW)!
      window.webContents.send(PICGO_PLUGIN_MENU_ACTION, plugin.fullName, IPluginMenuAction.UNINSTALL)
    }
  }, {
    label: T('UPDATE_PLUGIN'),
    click () {
      const window = windowManager.get(IWindowList.SETTING_WINDOW)!
      window.webContents.send(PICGO_PLUGIN_MENU_ACTION, plugin.fullName, IPluginMenuAction.UPDATE)
    }
  }]
  for (const i in plugin.config) {
    if (i === 'uploader') {
      continue
    }
    if (plugin.config[i].config.length > 0) {
      const obj = {
        label: T('CONFIG_THING', {
          c: `${i} - ${plugin.config[i].fullName || plugin.config[i].name}`
        }),
        click () {
          const window = windowManager.get(IWindowList.SETTING_WINDOW)!
          const currentType = i
          const configName = plugin.config[i].fullName || plugin.config[i].name
          const config = plugin.config[i].config
          window.webContents.send(PICGO_CONFIG_PLUGIN, currentType, configName, config)
        }
      }
      menu.push(obj)
    }
  }

  // handle transformer
  if (plugin.config.transformer.name) {
    const currentTransformer = picgo.getConfig<string>('picBed.transformer') || 'path'
    const pluginTransformer = plugin.config.transformer.name
    const obj = {
      label: `${currentTransformer === pluginTransformer ? T('DISABLE') : T('ENABLE')} transformer - ${plugin.config.transformer.name}`,
      click () {
        const transformer = plugin.config.transformer.name
        const currentTransformer = picgo.getConfig<string>('picBed.transformer') || 'path'
        if (currentTransformer === transformer) {
          picgo.saveConfig({
            'picBed.transformer': 'path'
          })
        } else {
          picgo.saveConfig({
            'picBed.transformer': transformer
          })
        }
      }
    }
    menu.push(obj)
  }

  // plugin custom menus
  if (plugin.guiMenu) {
    menu.push({
      // @ts-ignore
      type: 'separator'
    })
    for (const i of plugin.guiMenu) {
      menu.push({
        label: i.label,
        click () {
          const picgoPlugin = picgo.pluginLoader.getPlugin(plugin.fullName)
          if (picgoPlugin?.guiMenu?.(picgo)?.length) {
            const menu: GuiMenuItem[] = picgoPlugin.guiMenu(picgo)
            menu.forEach(item => {
              if (item.label === i.label) {
                item.handle(picgo, GuiApi.getInstance())
              }
            })
          }
        }
      })
    }
  }

  // @ts-ignore
  return Menu.buildFromTemplate(menu)
}

export {
  buildMiniPageMenu,
  buildMainPageMenu,
  buildPicBedListMenu,
  buildPluginPageMenu
}
