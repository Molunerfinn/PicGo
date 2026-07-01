import path from 'path'
import fs from 'fs-extra'
import picgo from '@core/picgo'
import { evaluatePluginConfig } from 'picgo'
import { RPCRouter } from '../router'
import { fail, ok } from '../utils'
import { IRPCActionType } from '~/universal/types/enum'
import shortKeyHandler from 'apis/app/shortKey/shortKeyHandler'
import { T } from '~/main/i18n'
import { showNotification } from '~/main/utils/common'
import { notifyAppConfigUpdated } from '~/main/utils/appConfigNotifier'
import { dialog } from 'electron'
import windowManager from '~/main/apis/app/window/windowManager'
import { IWindowList } from '#/types/enum'

const README_FILE_CANDIDATES = ['README.md', 'readme.md', 'Readme.md'] as const

function handleRestoreState (fullName: string) {
  const plugin = picgo.pluginLoader.getPlugin(fullName)

  if (!plugin) {
    return
  }

  const currentUploader =
    picgo.getConfig<string>('picBed.uploader') ||
    picgo.getConfig<string>('picBed.current') ||
    'smms'
  const currentTransformer = picgo.getConfig<string>('picBed.transformer') || 'path'
  const uploaderName = plugin.uploader || ''
  const transformerName = plugin.transformer || ''
  const configToRestore: Record<string, string> = {}

  if (uploaderName && currentUploader === uploaderName) {
    configToRestore['picBed.current'] = 'smms'
    configToRestore['picBed.uploader'] = 'smms'
  }

  if (transformerName && currentTransformer === transformerName) {
    configToRestore['picBed.transformer'] = 'path'
  }

  if (Object.keys(configToRestore).length > 0) {
    picgo.saveConfig(configToRestore)
  }
}

const pluginsRouter = new RPCRouter()

pluginsRouter
  .add(IRPCActionType.INSTALL_PLUGIN, async (args) => {
    const [fullName] = args as [string]
    const result = await picgo.pluginHandler.install([fullName])

    if (!result.success) {
      showNotification({
        title: T('PLUGIN_INSTALL_FAILED'),
        body: result.body as string
      })
      return fail(new Error(result.body as string))
    }

    shortKeyHandler.registerPluginShortKey(result.body[0])
    return ok(result.body[0])
  })
  .add(IRPCActionType.IMPORT_LOCAL_PLUGIN, async () => {
    try {
      const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)

      if (!settingWindow) {
        throw new Error('Setting window not found')
      }

      const dialogResult = await dialog.showOpenDialog(settingWindow, {
        properties: ['openDirectory']
      })

      const filePaths = dialogResult.filePaths

      if (filePaths.length === 0) {
        return ok(null)
      }

      const result = await picgo.pluginHandler.install(filePaths)

      if (!result.success) {
        showNotification({
          title: T('PLUGIN_IMPORT_FAILED'),
          body: result.body as string
        })
        return fail(new Error(result.body as string))
      }

      shortKeyHandler.registerPluginShortKey(result.body[0])
      return ok(result.body[0])
    } catch (e) {
      return fail(e)
    }
  })
  .add(IRPCActionType.UNINSTALL_PLUGIN, async (args) => {
    const [fullName] = args as [string]
    handleRestoreState(fullName)
    const result = await picgo.pluginHandler.uninstall([fullName])

    if (!result.success) {
      showNotification({
        title: T('PLUGIN_UNINSTALL_FAILED'),
        body: result.body as string
      })
      return fail(new Error(result.body as string))
    }

    shortKeyHandler.unregisterPluginShortKey(result.body[0])
    picgo.saveConfig({
      needReload: true
    })
    notifyAppConfigUpdated()
    return ok(result.body[0])
  })
  .add(IRPCActionType.UPDATE_PLUGIN, async (args) => {
    const [fullName] = args as [string]
    const result = await picgo.pluginHandler.update([fullName])

    if (!result.success) {
      showNotification({
        title: T('PLUGIN_UPDATE_FAILED'),
        body: result.body as string
      })
      return fail(new Error(result.body as string))
    }

    picgo.saveConfig({
      needReload: true
    })
    notifyAppConfigUpdated()
    return ok(result.body[0])
  })
  .add(IRPCActionType.ENABLE_PLUGIN, async (args) => {
    try {
      const [fullName] = args as [string]

      picgo.saveConfig({
        [`picgoPlugins.${fullName}`]: true,
        needReload: true
      })

      notifyAppConfigUpdated()
      return ok(fullName)
    } catch (e) {
      return fail(e)
    }
  })
  .add(IRPCActionType.DISABLE_PLUGIN, async (args) => {
    try {
      const [fullName] = args as [string]

      handleRestoreState(fullName)
      picgo.saveConfig({
        [`picgoPlugins.${fullName}`]: false,
        needReload: true
      })

      notifyAppConfigUpdated()
      return ok(fullName)
    } catch (e) {
      return fail(e)
    }
  })
  .add(IRPCActionType.GET_INSTALLED_PLUGIN_README, async (args) => {
    try {
      const [fullName] = args as [string]
      if (typeof fullName !== 'string' || fullName.length === 0) {
        return ok('')
      }

      const pluginDir = path.join(picgo.baseDir, 'node_modules', fullName)

      for (const candidate of README_FILE_CANDIDATES) {
        const readmePath = path.join(pluginDir, candidate)
        if (await fs.pathExists(readmePath)) {
          const content = await fs.readFile(readmePath, 'utf-8')
          return ok(content)
        }
      }

      return ok('')
    } catch (e) {
      return fail(e)
    }
  })
  .add(IRPCActionType.REFRESH_CONFIG_SCHEMA, async (args) => {
    try {
      const [payload] = args as [IRefreshConfigSchemaArgs]
      const draftValues = payload.draftValues ?? {}
      let rawSchema: unknown[] | null = null

      if (payload.target === 'plugin') {
        const plugin = picgo.pluginLoader.getPlugin(payload.pluginFullName)
        if (plugin?.config) {
          rawSchema = plugin.config(picgo)
        }
      } else if (payload.target === 'transformer') {
        const transformerName = picgo.pluginLoader.getPlugin(payload.pluginFullName)?.transformer
        if (transformerName) {
          const handler = picgo.helper.transformer.get(transformerName)
          if (handler?.config) {
            rawSchema = handler.config(picgo)
          }
        }
      } else if (payload.target === 'uploader') {
        const handler = picgo.helper.uploader.get(payload.uploaderName)
        if (handler?.config) {
          rawSchema = handler.config(picgo)
        }
      }

      if (!rawSchema) {
        picgo.log.warn(`[plugin-config] refresh target not found: ${JSON.stringify(payload)}`)
        return ok([])
      }

      const resolved = evaluatePluginConfig(rawSchema as Parameters<typeof evaluatePluginConfig>[0], draftValues, {
        onError: (fieldName, kind, error) => {
          const message = error instanceof Error ? error.message : String(error)
          picgo.log.warn(`[plugin-config] ${fieldName}.${kind} threw during refresh: ${message}`)
        }
      })

      return ok(resolved)
    } catch (e) {
      return fail(e)
    }
  })

type IRefreshConfigSchemaArgs =
  | { target: 'plugin', pluginFullName: string, draftValues?: Record<string, unknown> }
  | { target: 'transformer', pluginFullName: string, draftValues?: Record<string, unknown> }
  | { target: 'uploader', uploaderName: string, draftValues?: Record<string, unknown> }

export {
  pluginsRouter
}
