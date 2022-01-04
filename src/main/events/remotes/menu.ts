import windowManager from 'apis/app/window/windowManager'
import { IWindowList } from 'apis/app/window/constants'
import { Menu, BrowserWindow, app, dialog } from 'electron'
import getPicBeds from '~/main/utils/getPicBeds'
import picgo from '@core/picgo'
import {
  uploadClipboardFiles
} from '~/main/apis/app/uploader/apis'
import { privacyManager } from '~/main/utils/privacyManager'
import pkg from 'root/package.json'
import GuiApi from 'apis/gui'
import PicGoCore from '~/universal/types/picgo'
import { PICGO_CONFIG_PLUGIN, PICGO_HANDLE_PLUGIN_ING, PICGO_TOGGLE_PLUGIN } from '~/universal/events/constants'
import picgoCoreIPC from '~/main/events/picgoCoreIPC'

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
      label: '打开详细窗口',
      click () {
        windowManager.get(IWindowList.SETTING_WINDOW)!.show()
        if (windowManager.has(IWindowList.MINI_WINDOW)) {
          windowManager.get(IWindowList.MINI_WINDOW)!.hide()
        }
      }
    },
    {
      label: '选择默认图床',
      type: 'submenu',
      submenu
    },
    {
      label: '剪贴板图片上传',
      click () {
        uploadClipboardFiles()
      }
    },
    {
      label: '隐藏窗口',
      click () {
        BrowserWindow.getFocusedWindow()!.hide()
      }
    },
    {
      label: '隐私协议',
      click () {
        privacyManager.show(false)
      }
    },
    {
      label: '重启应用',
      click () {
        app.relaunch()
        app.exit(0)
      }
    },
    {
      role: 'quit',
      label: '退出'
    }
  ]
  // @ts-ignore
  return Menu.buildFromTemplate(template)
}

const buildMainPageMenu = () => {
  const template = [
    {
      label: '关于',
      click () {
        dialog.showMessageBox({
          title: 'PicGo',
          message: 'PicGo',
          detail: `Version: ${pkg.version}\nAuthor: Molunerfinn\nGithub: https://github.com/Molunerfinn/PicGo`
        })
      }
    },
    {
      label: '赞助PicGo',
      click () {
        // TODO: show donation
      }
    },
    {
      label: '生成图床配置二维码',
      click () {
        // TODO: qrcode
        // _this.qrcodeVisible = true
      }
    },
    {
      label: '隐私协议',
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
    label: '启用插件',
    enabled: !plugin.enabled,
    click () {
      picgo.saveConfig({
        [`picgoPlugins.${plugin.fullName}`]: true
      })
      const window = windowManager.get(IWindowList.SETTING_WINDOW)!
      window.webContents.send(PICGO_TOGGLE_PLUGIN, plugin.fullName, true)
    }
  }, {
    label: '禁用插件',
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
    label: '卸载插件',
    click () {
      const window = windowManager.get(IWindowList.SETTING_WINDOW)!
      window.webContents.send(PICGO_HANDLE_PLUGIN_ING, plugin.fullName)
      picgoCoreIPC.handlePluginUninstall(plugin.fullName)
    }
  }, {
    label: '更新插件',
    click () {
      const window = windowManager.get(IWindowList.SETTING_WINDOW)!
      window.webContents.send(PICGO_HANDLE_PLUGIN_ING, plugin.fullName)
      picgoCoreIPC.handlePluginUpdate(plugin.fullName)
    }
  }]
  for (const i in plugin.config) {
    if (plugin.config[i].config.length > 0) {
      const obj = {
        label: `配置${i} - ${plugin.config[i].fullName || plugin.config[i].name}`,
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
      label: `${currentTransformer === pluginTransformer ? '禁用' : '启用'}transformer - ${plugin.config.transformer.name}`,
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
