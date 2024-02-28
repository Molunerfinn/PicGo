interface ISettingForm {
  showUpdateTip: boolean
  showPicBedList: string[]
  autoStart: boolean
  rename: boolean
  autoRename: boolean
  uploadNotification: boolean
  miniWindowOnTop: boolean
  logLevel: string[]
  autoCopyUrl: boolean
  checkBetaUpdate: boolean
  useBuiltinClipboard: boolean
  language: string
  logFileSizeLimit: number
  encodeOutputURL: boolean
  showDockIcon: boolean
  customLink: string
  npmProxy: string
  npmRegistry: string
  server: {
    port: number
    host: string
    enable: boolean
  }
  startupMode: import('#/types/enum').IStartupMode
}

interface IShortKeyMap {
  [propName: string]: string
}

interface IToolboxItem {
  title: string
  status: import('#/types/enum').IToolboxItemCheckStatus
  msg?: string
  value?: any // for handler
  hasNoFixMethod?: boolean
  handler?: (value: any) => Promise<void> | void
  handlerText?: string
}

type IToolboxMap = {
  [id in import('#/types/enum').IToolboxItemType]: IToolboxItem
}

interface IFormInstance {
  validate: () => Promise<IStringKeyMap | false>
}
