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

declare var PICGO_GUI_VERSION: string
declare var PICGO_CORE_VERSION: string
declare var notificationList: IAppNotification[]
declare var TDAPP: {
  onEvent: (EventId: string, Label?: string, MapKv?: IStringKeyMap) => void
}
