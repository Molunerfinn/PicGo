import { Menu, MenuItemConstructorOptions } from 'electron'
import windowManager from '~/main/apis/app/window/windowManager'
import { IRPCActionType, IWindowList } from '~/universal/types/enum'

class GalleryMenuListManager {
  private menuList: MenuItemConstructorOptions[] = []
  private menu: Menu | null = null

  private getBuiltInMenuList (): MenuItemConstructorOptions[] {
    const openChangeHostDialog: MenuItemConstructorOptions = {
      label: 'Change URL Host',
      click () {
        const win = windowManager.get(IWindowList.SETTING_WINDOW)!
        win.webContents.send(IRPCActionType.OPEN_CHANGE_HOST_DIALOG)
      }
    }
    this.menuList.push(openChangeHostDialog)

    return this.menuList
  }

  private getMenuItemList (): MenuItemConstructorOptions[] {
    if (this.menuList.length === 0) {
      this.getBuiltInMenuList()
    }
    return this.menuList
  }

  public getMenu (): Menu {
    if (!this.menu) {
      this.menu = Menu.buildFromTemplate(this.getMenuItemList())
    }
    return this.menu
  }
}

const galleryMenuListManager = new GalleryMenuListManager()

export {
  galleryMenuListManager
}
