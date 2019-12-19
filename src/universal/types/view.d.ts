interface ISettingForm {
  updateHelper: boolean
  showPicBedList: string[]
  autoStart: boolean
  rename: boolean
  autoRename: boolean
  uploadNotification: boolean
  miniWindowOntop: boolean
  logLevel: string[]
}

interface ShortKeyMap {
  [propName: string]: string
}
