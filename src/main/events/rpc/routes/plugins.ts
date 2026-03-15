import picgo from '@core/picgo'
import { RPCRouter } from '../router'
import { fail, ok } from '../utils'
import { IRPCActionType } from '~/universal/types/enum'
import shortKeyHandler from 'apis/app/shortKey/shortKeyHandler'
import { T } from '~/main/i18n'
import { showNotification } from '~/main/utils/common'
import { notifyAppConfigUpdated } from '~/main/utils/appConfigNotifier'

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

export {
  pluginsRouter
}
