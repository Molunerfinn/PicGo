import {
  BrowserWindow
} from 'electron'
import {
  IWindowList
} from 'apis/app/window/constants'

declare interface IWindowListItem {
  isValid: boolean
  multiple: boolean
  options: () => IBrowserWindowOptions,
  callback: (window: BrowserWindow, windowManager: IWindowManager) => void
}

declare interface IWindowManager {
  create: (name: IWindowList) => BrowserWindow | null
  get: (name: IWindowList) => BrowserWindow | null
  has: (name: IWindowList) => boolean
  // delete: (name: IWindowList) => void
  deleteById: (id: number) => void
  getAvailableWindow: () => BrowserWindow
}

// https://stackoverflow.com/questions/35074713/extending-typescript-global-object-in-node-js/44387594#44387594
declare global {
  namespace NodeJS {
    interface Global {
      PICGO_GUI_VERSION: string
      PICGO_CORE_VERSION: string
      notificationList: IAppNotification[]
    }
  }
}
