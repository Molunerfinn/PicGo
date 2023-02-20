interface ISettingForm {
  updateHelper: boolean
  showPicBedList: string[]
  autoStart: boolean
  rename: boolean
  autoRename: boolean
  uploadNotification: boolean
  miniWindowOntop: boolean
  logLevel: string[]
  autoCopyUrl: boolean
  checkBetaUpdate: boolean
  useBuiltinClipboard: boolean
  language: string
  logFileSizeLimit: number
  encodeOutputURL: boolean
}

interface IShortKeyMap {
  [propName: string]: string
}

interface IToolboxItem {
  id: import('#/types/enum').IToolboxItemType
  title: string
  status: 'loading' | 'success' | 'error' | 'init'
  errorTips?: string[]
}
