import { IRPCActionType, IWindowList } from '~/universal/types/enum'
import { AlbumSource } from '#/types/cloudAlbum'
import { RPCRouter } from '../../router'
import windowManager from '~/main/apis/app/window/windowManager'
import { galleryMenuListManager } from './menuListManager'
import logger from 'apis/core/picgo/logger'

const galleryToolboxRouter = new RPCRouter()

galleryToolboxRouter.add(IRPCActionType.GET_GALLERY_MENU_LIST, async (args) => {
  const [selectedList] = args as IGetGalleryMenuListArgs
  const win = windowManager.get(IWindowList.SETTING_WINDOW)!
  const menu = galleryMenuListManager.getMenu(selectedList)

  menu.popup({
    window: win
  })
})

/** Broadcast album source changes to all renderer windows except the sender. */
const SYNC_TARGET_WINDOWS: IWindowList[] = [
  IWindowList.SETTING_WINDOW,
  IWindowList.TRAY_WINDOW,
  IWindowList.MINI_WINDOW
]

galleryToolboxRouter.add(IRPCActionType.SYNC_ALBUM_SOURCE, async (args, event) => {
  const [source] = args as [AlbumSource]
  logger.debug('[Gallery][syncAlbumSource]', `source=${source}`)
  const senderWebContents = event.sender
  for (const windowType of SYNC_TARGET_WINDOWS) {
    if (!windowManager.has(windowType)) continue
    const win = windowManager.get(windowType)
    if (win?.webContents && win.webContents !== senderWebContents) {
      win.webContents.send(IRPCActionType.SYNC_ALBUM_SOURCE, source)
    }
  }
})

export {
  galleryToolboxRouter
}
