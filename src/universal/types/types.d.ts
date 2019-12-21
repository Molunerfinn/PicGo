// global
interface Obj {
  [propName: string]: any
}

interface ObjT<T> {
  [propName: string]: T
}

// Image && PicBed
interface ImgInfo {
  buffer?: Buffer
  base64Image?: string
  fileName?: string
  width?: number
  height?: number
  extname?: string
  imgUrl?: string
  [propName: string]: any
}

interface IPicBedType {
  type: string
  name: string
  visible: boolean
}

// Config Settings
interface IShortKeyConfig {
  enable: boolean
  key: string // 按键
  name: string
  label: string
}

interface IShortKeyConfigs {
  [propName: string]: IShortKeyConfig
}

interface IOldShortKeyConfigs {
  upload: string
}

// Main process
interface IBrowserWindowOptions {
  height: number,
  width: number,
  show: boolean,
  fullscreenable: boolean,
  resizable: boolean,
  webPreferences: {
    nodeIntegration: boolean,
    nodeIntegrationInWorker: boolean,
    backgroundThrottling: boolean
    webSecurity?: boolean
  },
  vibrancy?: string | any,
  frame?: boolean
  center?: boolean
  title?: string
  titleBarStyle?: string | any
  backgroundColor?: string
  autoHideMenuBar?: boolean
  transparent?: boolean
  icon?: string
  skipTaskbar?: boolean
  alwaysOnTop?: boolean
}

interface IFileWithPath {
  path: string
  name?: string
}

interface IBounds {
  x: number
  y: number
}

declare type ILogType = 'success' | 'info' | 'warn' | 'error'

// global value
declare var __static: string

// PicGo Types

interface IPicGoPlugin {
  name: string
  author: string
  description: string
  logo: string
  version: string | number
  gui: boolean
  config: {
    plugin: IPluginMenuConfig
    uploader: IPluginMenuConfig
    transformer: IPluginMenuConfig
    [index: string]: IPluginMenuConfig
  } | {
    [propName: string]: any
  }
  enabled?: boolean
  homepage: string
  guiMenu?: any[]
  ing: boolean
  hasInstall?: boolean
}

interface IPluginMenuConfig {
  name: string
  config: any[]
}

interface INPMSearchResult {
  data: {
    objects: INPMSearchResultObject[]
  }
}

interface INPMSearchResultObject {
  package: {
    name: string
    scope: string
    version: string
    description: string
    keywords: string[]
    author: {
      name: string
    }
    links: {
      npm: string
      homepage: string
    }
  }
}

// GuiApi

interface IShowInputBoxOption {
  title: string
  placeholder: string
}

// PicBeds

interface IAliYunConfig {
  accessKeyId: string
  accessKeySecret: string,
  bucket: string,
  area: string,
  path: string,
  customUrl: string
}

interface IGitHubConfig {
  repo: string,
  token: string,
  path: string,
  customUrl: string,
  branch: string
}

interface IImgurConfig {
  clientId: string,
  proxy: string
}

interface IQiniuConfig {
  accessKey: string,
  secretKey: string,
  bucket: string,
  url: string,
  area: string,
  options: string,
  path: string
}

interface ITcYunConfig {
  secretId: string,
  secretKey: string,
  bucket: string,
  appId: string,
  area: string,
  path: string,
  customUrl: string,
  version: 'v4' | 'v5'
}

interface IUpYunConfig {
  bucket: string,
  operator: string,
  password: string,
  options: string,
  path: string
}
