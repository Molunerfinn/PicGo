import windowManager from 'apis/app/window/windowManager'
import { IWindowList } from '#/types/enum'
import { Menu, BrowserWindow, app, dialog } from 'electron'
import getPicBeds from '~/main/utils/getPicBeds'
import picgo from '@core/picgo'
import {
  uploadClipboardFiles
} from '~/main/apis/app/uploader/apis'
import { privacyManager } from '~/main/utils/privacyManager'
import pkg from 'root/package.json'
import GuiApi from 'apis/gui'
import { PICGO_CONFIG_PLUGIN, PICGO_HANDLE_PLUGIN_ING, PICGO_TOGGLE_PLUGIN, SHOW_MAIN_PAGE_DONATION, SHOW_MAIN_PAGE_QRCODE } from '~/universal/events/constants'
import picgoCoreIPC from '~/main/events/picgoCoreIPC'
import { PicGo as PicGoCore } from 'picgo'
import { T } from '~/universal/i18n'

interface GuiMenuItem {
  label: string
  handle: (arg0: PicGoCore, arg1: GuiApi) => Promise<void>
}

const buildMiniPageMenu = () => {
  const picBeds = getPicBeds()
  const current = picgo.getConfig('picBed.uploader')
  const submenu = picBeds.filter(item => item.visible).map(item => {
    return {
      label: item.name,
      type: 'radio',
      checked: current === item.type,
      click () {
        picgo.saveConfig({
          'picBed.current': item.type,
          'picBed.uploader': item.type
        })
        if (windowManager.has(IWindowList.SETTING_WINDOW)) {
          windowManager.get(IWindowList.SETTING_WINDOW)!.webContents.send('syncPicBed')
        }
      }
    }
  })
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
      label: T('PRIVACY_AGREEMENT'),
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
      label: T('SHOW_DEVTOOLS'),
      click () {
        win?.webContents?.openDevTools()
      }
    },
    {
      label: T('PRIVACY_AGREEMENT'),
      click () {
        privacyManager.show(false)
      }
    }
  ]
  // @ts-ignore
  return Menu.buildFromTemplate(template)
}

const buildUploadPageMenu = () => {
  const picBeds = getPicBeds()
  const currentPicBed = picgo.getConfig('picBed.uploader')
  const submenu = picBeds.filter(item => item.visible).map(item => {
    return {
      label: item.name,
      type: 'radio',
      checked: currentPicBed === item.type,
      click () {
        picgo.saveConfig({
          'picBed.current': item.type,
          'picBed.uploader': item.type
        })
        if (windowManager.has(IWindowList.SETTING_WINDOW)) {
          windowManager.get(IWindowList.SETTING_WINDOW)!.webContents.send('syncPicBed')
        }
      }
    }
  })
  // @ts-ignore
  return Menu.buildFromTemplate(submenu)
}

// TODO: separate to single file

const handleRestoreState = (item: string, name: string): void => {
  if (item === 'uploader') {
    const current = picgo.getConfig('picBed.current')
    if (current === name) {
      picgo.saveConfig({
        'picBed.current': 'smms',
        'picBed.uploader': 'smms'
      })
    }
  }
  if (item === 'transformer') {
    const current = picgo.getConfig('picBed.transformer')
    if (current === name) {
      picgo.saveConfig({
        'picBed.transformer': 'path'
      })
    }
  }
}

const buildPluginPageMenu = (plugin: IPicGoPlugin) => {
  const menu = [{
    label: T('ENABLE_PLUGIN'),
    enabled: !plugin.enabled,
    click () {
      picgo.saveConfig({
        [`picgoPlugins.${plugin.fullName}`]: true
      })
      const window = windowManager.get(IWindowList.SETTING_WINDOW)!
      window.webContents.send(PICGO_TOGGLE_PLUGIN, plugin.fullName, true)
    }
  }, {
    label: T('DISABLE_PLUGIN'),
    enabled: plugin.enabled,
    click () {
      picgo.saveConfig({
        [`picgoPlugins.${plugin.fullName}`]: false
      })
      const window = windowManager.get(IWindowList.SETTING_WINDOW)!
      window.webContents.send(PICGO_HANDLE_PLUGIN_ING, plugin.fullName)
      window.webContents.send(PICGO_TOGGLE_PLUGIN, plugin.fullName, false)
      if (plugin.config.transformer.name) {
        handleRestoreState('transformer', plugin.config.transformer.name)
      }
      if (plugin.config.uploader.name) {
        handleRestoreState('uploader', plugin.config.uploader.name)
      }
    }
  }, {
    label: T('UNINSTALL_PLUGIN'),
    click () {
      const window = windowManager.get(IWindowList.SETTING_WINDOW)!
      window.webContents.send(PICGO_HANDLE_PLUGIN_ING, plugin.fullName)
      picgoCoreIPC.handlePluginUninstall(plugin.fullName)
    }
  }, {
    label: T('UPDATE_PLUGIN'),
    click () {
      const window = windowManager.get(IWindowList.SETTING_WINDOW)!
      window.webContents.send(PICGO_HANDLE_PLUGIN_ING, plugin.fullName)
      picgoCoreIPC.handlePluginUpdate(plugin.fullName)
    }
  }]
  for (const i in plugin.config) {
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
      label: `${currentTransformer === pluginTransformer ? T('DISABLE') : T('ENABLE')}transformer - ${plugin.config.transformer.name}`,
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
          // ipcRenderer.send('pluginActions', plugin.fullName, i.label)
          const picgPlugin = picgo.pluginLoader.getPlugin(plugin.fullName)
          if (picgPlugin?.guiMenu?.(picgo)?.length) {
            const menu: GuiMenuItem[] = picgPlugin.guiMenu(picgo)
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
  buildUploadPageMenu,
  buildPluginPageMenu
}
