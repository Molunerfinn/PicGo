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
}

interface IShortKeyMap {
  [propName: string]: string
}
