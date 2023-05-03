import { IRPCActionType, IToolboxItemType } from '~/universal/types/enum'
import { RPCRouter } from '../../router'
import { checkFileMap, fixFileMap } from './checkFile'
import { checkClipboardUploadMap, fixClipboardUploadMap } from './checkClipboardUpload'
import { checkProxyMap } from './checkProxy'

const toolboxRouter = new RPCRouter()

const toolboxCheckMap: Partial<IToolboxCheckerMap<IToolboxItemType>> = {
  ...checkFileMap,
  ...checkClipboardUploadMap,
  ...checkProxyMap
}

const toolboxFixMap: Partial<IToolboxFixMap<IToolboxItemType>> = {
  ...fixFileMap,
  ...fixClipboardUploadMap
}

toolboxRouter
  .add(IRPCActionType.TOOLBOX_CHECK, async (args, event) => {
    const [type] = args as IToolboxCheckArgs
    if (type) {
      const handler = toolboxCheckMap[type]
      if (handler) {
        handler(event)
      }
    } else {
      // do check all
      for (const key in toolboxCheckMap) {
        const handler = toolboxCheckMap[key as IToolboxItemType]
        if (handler) {
          handler(event)
        }
      }
    }
  })
  .add(IRPCActionType.TOOLBOX_CHECK_FIX, async (args, event) => {
    const [type] = args as IToolboxCheckArgs
    const handler = toolboxFixMap[type]
    if (handler) {
      return await handler(event)
    }
  })

export {
  toolboxRouter
}
