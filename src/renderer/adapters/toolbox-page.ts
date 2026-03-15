import { IRPCActionType, IToolboxItemType } from '~/universal/types/enum'
import { invokeRPC, sendRPC } from '@/utils/dataSender'

export const toolboxPageAdapter = {
  runCheck () {
    sendRPC(IRPCActionType.TOOLBOX_CHECK)
  },
  async fixItem (type: IToolboxItemType) {
    const result = await invokeRPC<IToolboxCheckRes>(
      IRPCActionType.TOOLBOX_CHECK_FIX,
      type
    )

    if (!result.success) {
      throw new Error(result.error || 'Toolbox fix failed')
    }

    return result.data
  },
  openFile (path: string) {
    sendRPC(IRPCActionType.OPEN_FILE, path)
  },
  reloadApp () {
    sendRPC(IRPCActionType.RELOAD_APP)
  }
}
