// global

type FN = (...args: any) => any

interface IObj {
  [propName: string]: any
}

interface IObjT<T> {
  [propName: string]: T
}

declare interface ErrnoException extends Error {
  errno?: number | string;
  code?: string;
  path?: string;
  syscall?: string;
  stack?: string;
}

declare namespace NodeJS {
  interface ProcessEnv {
    STATIC_PATH?: string
  }
}

declare const __static: string

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
  /**
   * will be deleted after uploading.
   */
  buffer?: Buffer
  /**
   * will be deleted after uploading.
   */
  base64Image?: string
  fileName?: string
  width?: number
  height?: number
  extname?: string
  /**
   * basic url for image item.
   */
  imgUrl?: string
  /**
   * originImgUrl is used for some special cases, such as url rewrite. we will keep the original url in originalImgUrl and do the url rewrite in imgUrl, so that we can use the original url when we need it.
   */
  originImgUrl?: string
  /**
   * if item is a file not image, this will be the file url for downloading
   */
  url?: string
  /**
   * unique id. if item saved in db, it will have an id
   */
  id?: string
  /**
   * uploader type. such as "picgo-cloud", "smms", "github", etc
   */
  type?: string
  /**
   * uploaded time, Date.now().
   */
  createdAt?: number | string | Date
  /**
   * updated time, Date.now(). if item is updated, such as url rewrite, this will be updated. otherwise, it will be the same as createdAt.
   */
  updatedAt?: number | string | Date
  [propName: string]: any
}

interface IAlbumItem extends ImgInfo {
  src: string
  key: string
  intro: string
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
  key: string,
  command: string
}

// Main process
interface IBrowserWindowOptions {
  height: number,
  width: number,
  minHeight?: number,
  minWidth?: number,
  show: boolean,
  fullscreenable: boolean,
  resizable: boolean,
  webPreferences: {
    preload?: string
    nodeIntegration: boolean,
    nodeIntegrationInWorker: boolean,
    contextIsolation: boolean,
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

// PicGo Types
type ICtx = import('picgo').PicGo
interface IPicGoPlugin {
  name: string
  fullName: string
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

interface IPicGoPluginConfig {
  name: string
  type: string
  required: boolean
  default?: any
  alias?: string
  choices?: {
    name?: string
    value?: any
  }[]
  /** support markdown */
  tips?: string
  /** Names of fields this field's choices/default depend on. */
  dependsOn?: string[]
  [propName: string]: any
}

interface IPicGoPluginShowConfigDialogOption {
  title: string
  config: IPicGoPluginConfig[]
  tips?: string
  confirmText?: string
  cancelText?: string
  /**
   * default to 500
   */
  width?: number
}

type IPicGoPluginOriginChoice = string | {
  name?: string
  value?: any
  checked?: boolean
}

interface IPicGoPluginOriginConfig {
  name: string
  type: string
  required: boolean
  default?: any | ((answers: Record<string, unknown>) => any)
  alias?: string
  choices?: IPicGoPluginOriginChoice[] | ((answers: Record<string, unknown>) => IPicGoPluginOriginChoice[])
  dependsOn?: string[]
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
    maintainers: Array<{
      email: string
      username: string
    }>
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
  showFileExplorer: (options: IShowFileExplorerOption) => Promise<string[]>
  upload: (input: IUploadOption) => Promise<ImgInfo[]>
  showNotification: (options?: IShowNotificationOption) => void
  showMessageBox: (options?: IShowMessageBoxOption) => Promise<IShowMessageBoxResult>
  showConfigDialog: <T extends IStringKeyMap>(options: IPicGoPluginShowConfigDialogOption) => Promise<T | false>
  albumDB: import('@picgo/store').DBStore
  /** @deprecated Use `albumDB` instead. */
  galleryDB: import('@picgo/store').DBStore
}
interface IShowInputBoxOption {
  value?: string
  title: string
  placeholder: string
  inputType?: 'text' | 'textarea' | 'password'
  /**
   * Optional confirm input rendered in the same dialog.
   * Commonly used for password/PIN setup to avoid user typos.
   */
  confirm?: {
    value?: string
    placeholder?: string
  }
  /**
   * default to 400
   */
  width?: number
}

type IShowFileExplorerOption = IObj

type IUploadOption = string[] | ImgInfo[]

interface IShowNotificationOption {
  title: string
  body: string
  /**
   * will log text
   */
  text?: string
}

interface IPrivateShowNotificationOption extends IShowNotificationOption{
  /**
   * click notification to copy the body
   */
  clickToCopy?: boolean
  copyContent?: string // something to copy
  callback?: () => void
}

interface IShowMessageBoxOption {
  title: string
  message: string
  type: import('electron').MessageBoxOptions['type']
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

type IShortKeyHandler = (ctx: ICtx, guiApi?: IGuiApi) => Promise<void | ICtx>

interface shortKeyHandlerMap {
  from: string
  handle: IShortKeyHandler
}

// PicBeds
interface IAliYunConfig {
  accessKeyId: string
  accessKeySecret: string,
  bucket: string,
  area: string,
  path: string,
  customUrl: string
  options: string
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

interface ISMMSConfig {
  token: string
}

interface ITcYunConfig {
  secretId: string,
  secretKey: string,
  bucket: string,
  appId: string,
  area: string,
  path: string,
  customUrl: string,
  version: 'v4' | 'v5',
  options: string
}

interface IUpYunConfig {
  bucket: string,
  operator: string,
  password: string,
  options: string,
  path: string
}

type ILoggerType = string | Error | boolean | number | undefined

interface IAppNotification {
  title: string
  body: string
  text?: string
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

interface IMiniWindowPos {
  x: number,
  y: number,
  height: number,
  width: number
}

type PromiseResType<T> = T extends Promise<infer R> ? R : T

// type ILocalesKey = import('#/i18n/zh-CN').ILocalesKey

interface II18nItem {
  label: string
  value: string
}

interface IRemoteNotice {
  version: number
  list: Array<{
    versions: string[] // matched picgo version
    actions: IRemoteNoticeAction[]
    versionMatch?: 'exact' | 'gte' | 'lte'
  }>
}

interface IRemoteNoticeAction {
  type: import('#/types/enum').IRemoteNoticeActionType
  // trigger time
  hooks: import('#/types/enum').IRemoteNoticeTriggerHook[]
  id: string
  // trigger count: always or once; default: once
  triggerCount: import('#/types/enum').IRemoteNoticeTriggerCount

  data?: {
    title?: string
    content?: string
    desc?: string // action desc
    buttons?: IRemoteNoticeButton[]
    url?: string
    copyToClipboard?: string
    options: any // for other case
  }
}

interface IRemoteNoticeButton {
  label: string
  labelEN?: string
  type: 'confirm' | 'cancel' | 'other'
  action: IRemoteNoticeAction
}

interface IRemoteNoticeLocalCountStorage {
  [id: string]: true | number
}

interface IUploaderListItemMetaInfo {
  _id: string
  _configName: string
  _updatedAt: number
  _createdAt: number
}

interface IUploaderConfig { 
  [picBedType: string]: IUploaderConfigItem
}

interface IUploaderConfigItem {
  configList: IUploaderConfigListItem[]
  defaultId: string
}

type IUploaderConfigListItem = IStringKeyMap & IUploaderListItemMetaInfo

type ISwitchValueType = boolean | string | number
