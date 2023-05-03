import { IRPCActionType } from '~/universal/types/enum'
import { RPCRouter } from '../router'
import { getLatestVersion } from '~/main/utils/getLatestVersion'

const versionRouter = new RPCRouter()

versionRouter
  .add(IRPCActionType.GET_LATEST_VERSION, async (args) => {
    const [type] = args as IGetLatestVersionArgs
    const config = await getLatestVersion(type)
    return config
  })

export {
  versionRouter
}
