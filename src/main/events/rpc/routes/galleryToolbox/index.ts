import { IRPCActionType, IWindowList } from '~/universal/types/enum'
import { RPCRouter } from '../../router'
import windowManager from '~/main/apis/app/window/windowManager'
import { galleryMenuListManager } from './menuListManager'

const galleryToolboxRouter = new RPCRouter()

galleryToolboxRouter.add(IRPCActionType.GET_GALLERY_MENU_LIST, async (args) => {
  const [selectedList] = args as IGetGalleryMenuListArgs
  const win = windowManager.get(IWindowList.SETTING_WINDOW)!
  const menu = galleryMenuListManager.getMenu(selectedList)

  menu.popup({
    window: win
  })
})

export {
  galleryToolboxRouter
}
