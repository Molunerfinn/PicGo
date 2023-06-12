import { IRPCActionType } from '~/universal/types/enum'
import { RPCRouter } from '../router'
import { deleteUploaderConfig, getUploaderConfigList, selectUploaderConfig, updateUploaderConfig } from '~/main/utils/handleUploaderConfig'

const configRouter = new RPCRouter()

configRouter
  .add(IRPCActionType.GET_PICBED_CONFIG_LIST, async (args) => {
    const [type] = args as IGetUploaderConfigListArgs
    const config = getUploaderConfigList(type)
    return config
  })
  .add(IRPCActionType.DELETE_PICBED_CONFIG, async (args) => {
    const [type, id] = args as IDeleteUploaderConfigArgs
    const config = deleteUploaderConfig(type, id)
    return config
  })
  .add(IRPCActionType.SELECT_UPLOADER, async (args) => {
    const [type, id] = args as ISelectUploaderConfigArgs
    selectUploaderConfig(type, id)
    return true
  })
  .add(IRPCActionType.UPDATE_UPLOADER_CONFIG, async (args) => {
    const [type, id, config] = args as IUpdateUploaderConfigArgs
    updateUploaderConfig(type, id, config)
    return true
  })

export {
  configRouter
}
