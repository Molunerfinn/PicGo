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

interface PicBedType {
  type: string
  name: string
  visible: boolean
}

// Config Settings
interface ShortKeyConfig {
  enable: boolean
  key: string // 按键
  name: string
  label: string
}

interface ShortKeyConfigs {
  [propName: string]: ShortKeyConfig
}

interface OldShortKeyConfigs {
  upload: string
}

// Main process
interface BrowserWindowOptions {
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

interface FileWithPath {
  path: string
  name?: string
}

interface Bounds {
  x: number
  y: number
}

declare enum PasteStyle {
  MARKDOWN = 'markdown',
  HTML = 'HTML',
  URL = 'URL',
  UBB = 'UBB',
  CUSTOM = 'Custom'
}

// global value
declare var __static: string

// PicGo Types
declare enum PicGoHelperType {
  afterUploadPlugins = 'afterUploadPlugins',
  beforeTransformPlugins = 'beforeTransformPlugins',
  beforeUploadPlugins = 'beforeUploadPlugins',
  uploader = 'uploader',
  transformer = 'transformer'
}

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
