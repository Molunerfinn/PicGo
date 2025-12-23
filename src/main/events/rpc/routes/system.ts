import { IRPCActionType, IWindowList } from '~/universal/types/enum'
import { RPCRouter } from '../router'
import { app, clipboard, shell } from 'electron'
import windowManager from '~/main/apis/app/window/windowManager'
import { handleMenubarIcon } from '~/main/apis/app/system'

const systemRouter = new RPCRouter()

systemRouter
  .add(IRPCActionType.RELOAD_APP, async () => {
    app.relaunch()
    app.exit(0)
  })
  .add(IRPCActionType.OPEN_FILE, async (args) => {
    const [filePath] = args as IOpenFileArgs
    shell.openPath(filePath)
  })
  .add(IRPCActionType.COPY_TEXT, async (args) => {
    const [text] = args as ICopyTextArgs
    return clipboard.writeText(text)
  })
  .add(IRPCActionType.SHOW_DOCK_ICON, async (args) => {
    const [visible] = args as IShowDockIconArgs
    app.dock?.[visible ? 'show' : 'hide']()
    const win = windowManager.get(IWindowList.SETTING_WINDOW)
    if (!visible) {
      win?.show()
      win?.focus()
      win?.setSkipTaskbar(true)
    } else {
      win?.setSkipTaskbar(false)
    }
  })
  .add(IRPCActionType.SHOW_MENUBAR_ICON, async (args) => {
    const [visible] = args as IShowMenubarIconArgs
    handleMenubarIcon(visible)
  })

export {
  systemRouter
}
