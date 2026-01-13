import { IRPCActionType } from '~/universal/types/enum'
import { RPCRouter } from '../router'
import picgo from '@core/picgo'
import { T } from '~/main/i18n'

const configRouter = new RPCRouter()

const errorToMessage = (e: unknown): string => {
  if (e instanceof Error) return e.message
  return String(e)
}

const ok = <T>(data: T): IRPCResult<T> => ({
  success: true,
  data
})

const fail = <T>(e: unknown): IRPCResult<T> => ({
  success: false,
  error: errorToMessage(e)
})

configRouter
  .add(IRPCActionType.GET_PICBED_CONFIG_LIST, async (args) => {
    try {
      const [type] = args as IGetUploaderConfigListArgs
      const configList = picgo.uploaderConfig.getConfigList(type)
      const activeConfig = picgo.uploaderConfig.getActiveConfig(type)
      return ok({
        configList,
        defaultId: activeConfig?._id ?? ''
      })
    } catch (e) {
      return fail(e)
    }
  })
  .add(IRPCActionType.DELETE_PICBED_CONFIG, async (args) => {
    try {
      const [type, configName] = args as IDeleteUploaderConfigArgs
      const existing = picgo.uploaderConfig.getConfigList(type)
      if (existing.length <= 1) {
        throw new Error(T('TIPS_UPLOADER_CONFIG_CANNOT_DELETE_LAST'))
      }
      picgo.uploaderConfig.remove(type, configName)
      const configList = picgo.uploaderConfig.getConfigList(type)
      const activeConfig = picgo.uploaderConfig.getActiveConfig(type)
      return ok({
        configList,
        defaultId: activeConfig?._id ?? ''
      })
    } catch (e) {
      return fail(e)
    }
  })
  .add(IRPCActionType.COPY_UPLOADER_CONFIG, async (args) => {
    try {
      const [type, configName, newConfigName] = args as ICopyUploaderConfigArgs
      picgo.uploaderConfig.copy(type, configName, newConfigName)
      const configList = picgo.uploaderConfig.getConfigList(type)
      const activeConfig = picgo.uploaderConfig.getActiveConfig(type)
      return ok({
        configList,
        defaultId: activeConfig?._id ?? ''
      })
    } catch (e) {
      return fail(e)
    }
  })
  .add(IRPCActionType.SELECT_UPLOADER, async (args) => {
    try {
      const [type, configName] = args as ISelectUploaderConfigArgs
      const activeConfig = picgo.uploaderConfig.use(type, configName)
      return ok(activeConfig._id)
    } catch (e) {
      return fail(e)
    }
  })
  .add(IRPCActionType.UPDATE_UPLOADER_CONFIG, async (args) => {
    try {
      const [type, configId, config] = args as IUpdateUploaderConfigArgs
      const configName = typeof config._configName === 'string' ? config._configName : ''
      if (configId && !configName) {
        throw new Error(T('TIPS_UPLOADER_CONFIG_NAME_EMPTY'))
      }

      let oldConfigName = ''
      if (configId) {
        const configList = picgo.uploaderConfig.getConfigList(type)
        const existConfig = configList.find(item => item._id === configId)
        if (!existConfig) {
          throw new Error(T('TIPS_UPLOADER_CONFIG_NOT_FOUND'))
        }
        oldConfigName = existConfig._configName
      }

      if (oldConfigName && oldConfigName !== configName) {
        picgo.uploaderConfig.rename(type, oldConfigName, configName)
      }
      picgo.uploaderConfig.createOrUpdate(type, configName, config)
      return ok(true)
    } catch (e) {
      return fail(e)
    }
  })

export {
  configRouter
}
