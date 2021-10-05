// global
interface IObj {
  [propName: string]: any
}

interface IObjT<T> {
  [propName: string]: T
}

declare interface ErrnoException extends Error {
  errno?: number | string
  code?: string
  path?: string
  syscall?: string
  stack?: string
}

declare let __static: string

declare type ILogType = 'success' | 'info' | 'warn' | 'error'

// Server
type routeHandler = (ctx: IServerCTX) => Promise<void>

type IHttpResponse = import('http').ServerResponse

interface IServerCTX {
  response: IHttpResponse
  [propName: string]: any
}

interface IServerConfig {
  port: number | string
  host: string
  enable: boolean
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
  id?: string
  type?: string
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
  from?: string
}

interface IPluginShortKeyConfig {
  key: string
  name: string
  label: string
  handle: IShortKeyHandler
}

interface IShortKeyConfigs {
  [propName: string]: IShortKeyConfig
}

interface IOldShortKeyConfigs {
  upload: string
}

interface IKeyCommandType {
  key: string
  command: string
}

// Main process
interface IBrowserWindowOptions {
  height: number
  width: number
  show: boolean
  fullscreenable: boolean
  resizable: boolean
  webPreferences: {
    nodeIntegration: boolean
    nodeIntegrationInWorker: boolean
    backgroundThrottling: boolean
    webSecurity?: boolean
  }
  vibrancy?: string | any
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

// PicGo Types

interface IPicGoPlugin {
  name: string
  fullName: string
  author: string
  description: string
  logo: string
  version: string | number
  gui: boolean
  config:
    | {
        plugin: IPluginMenuConfig
        uploader: IPluginMenuConfig
        transformer: IPluginMenuConfig
        [index: string]: IPluginMenuConfig
      }
    | {
        [propName: string]: any
      }
  enabled?: boolean
  homepage: string
  guiMenu?: any[]
  ing: boolean
  hasInstall?: boolean
}

interface IPicGoPluginConfig {
  name: string
  type: string
  required: boolean
  default?: any
  [propName: string]: any
}

interface IPluginMenuConfig {
  name: string
  fullName?: string
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

type IDispose = () => void

// GuiApi
interface IGuiApi {
  showInputBox: (options: IShowInputBoxOption) => Promise<string>
  showFileExplorer: (options: IShowFileExplorerOption) => Promise<string>
  upload: (input: IUploadOption) => Promise<ImgInfo[]>
  showNotification: (options?: IShowNotificationOption) => void
  showMessageBox: (
    options?: IShowMessageBoxOption
  ) => Promise<IShowMessageBoxResult>
}
interface IShowInputBoxOption {
  value?: string
  title: string
  placeholder: string
}

type IShowFileExplorerOption = IObj

type IUploadOption = string[]

interface IShowNotificationOption {
  title: string
  body: string
  icon?: string | import('electron').NativeImage
}

interface IPrivateShowNotificationOption extends IShowNotificationOption {
  /**
   * click notification to copy the body
   */
  clickToCopy?: boolean
}

interface IShowMessageBoxOption {
  title: string
  message: string
  type: string
  buttons: string[]
}

interface IShowMessageBoxResult {
  result: number
  checkboxChecked: boolean
}

interface IShortKeyHandlerObj {
  handle: IShortKeyHandler
  key: string
  label: string
}

type IShortKeyHandler = (ctx: PicGo, guiApi?: IGuiApi) => Promise<void | PicGo>

interface shortKeyHandlerMap {
  from: string
  handle: IShortKeyHandler
}

// PicBeds
interface IAliYunConfig {
  accessKeyId: string
  accessKeySecret: string
  bucket: string
  area: string
  path: string
  customUrl: string
  options: string
}

interface IGitHubConfig {
  repo: string
  token: string
  path: string
  customUrl: string
  branch: string
}

interface IImgurConfig {
  clientId: string
  proxy: string
}

interface IQiniuConfig {
  accessKey: string
  secretKey: string
  bucket: string
  url: string
  area: string
  options: string
  path: string
}

interface ISMMSConfig {
  token: string
}

interface ITcYunConfig {
  secretId: string
  secretKey: string
  bucket: string
  appId: string
  area: string
  path: string
  customUrl: string
  version: 'v4' | 'v5'
}

interface IUpYunConfig {
  bucket: string
  operator: string
  password: string
  options: string
  path: string
}

type ILoggerType = string | Error | boolean | number | undefined

interface IAppNotification {
  title: string
  body: string
  icon?: string
}

interface ITalkingDataOptions {
  EventId: string
  Label?: string
  MapKv?: IStringKeyMap
}

interface IAnalyticsData {
  fromClipboard: boolean
  type: string
  count: number
  duration?: number // 耗时
}

interface IStringKeyMap {
  [propName: string]: any
}

type ILogArgvType = string | number

type ILogArgvTypeWithError = ILogArgvType | Error

interface IGalleryDB {
  get<T>(filter?: IFilter): Promise<IGetResult<T>>
  insert<T>(value: T): Promise<IResult<T>>
  insertMany<T>(value: T[]): Promise<IResult<T>[]>
  updateById(id: string, value: IObject): Promise<boolean>
  getById<T>(id: string): Promise<IResult<T> | undefined>
  removeById(id: string): Promise<void>
}
