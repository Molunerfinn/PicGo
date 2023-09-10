import { Menu, MenuItemConstructorOptions } from 'electron'
import { builtInGalleryToolboxMenu } from './builtIn'
import picgo from '@core/picgo'
import GuiApi from 'apis/gui'
import windowManager from '~/main/apis/app/window/windowManager'
import { IRPCActionType, IWindowList } from '~/universal/types/enum'
import logger from '~/main/apis/core/picgo/logger'

class GalleryMenuListManager {
  private menuList: MenuItemConstructorOptions[] = []
  private menu: Menu | null = null

  private getBuiltInMenuList (selectedList: IGalleryItem[]): MenuItemConstructorOptions[] {
    const builtInMenu = builtInGalleryToolboxMenu().map(item => {
      return {
        label: item.label,
        async click () {
          try {
            await item.handle(picgo, GuiApi.getInstance(), selectedList)
          } catch (e: any) {
            logger.error(e)
          } finally {
            windowManager.get(IWindowList.SETTING_WINDOW)?.webContents.send(IRPCActionType.UPDATE_GALLERY)
          }
        }
      }
    }) as MenuItemConstructorOptions[]
    this.menuList = [...builtInMenu]

    return this.menuList
  }

  private getMenuItemList (selectedList: IGalleryItem[]) {
    // current only support built-in menu
    return this.getBuiltInMenuList(selectedList)
  }

  public getMenu (selectedList: IGalleryItem[]): Menu {
    this.menu = Menu.buildFromTemplate(this.getMenuItemList(selectedList))
    return this.menu
  }
}

const galleryMenuListManager = new GalleryMenuListManager()

export {
  galleryMenuListManager
}
