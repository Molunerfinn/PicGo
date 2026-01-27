import { APP_CONFIG_UPDATED } from '#/events/constants'
import { IWindowList } from '#/types/enum'
import windowManager from 'apis/app/window/windowManager'

const TARGET_WINDOWS: IWindowList[] = [
  IWindowList.SETTING_WINDOW,
  IWindowList.TRAY_WINDOW,
  IWindowList.MINI_WINDOW
]

export const notifyAppConfigUpdated = (): void => {
  TARGET_WINDOWS.forEach((windowType) => {
    if (!windowManager.has(windowType)) return
    windowManager.get(windowType)?.webContents.send(APP_CONFIG_UPDATED)
  })
}
