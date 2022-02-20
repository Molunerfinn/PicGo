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
}

interface IShortKeyMap {
  [propName: string]: string
}
