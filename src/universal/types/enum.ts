export enum IChalkType {
  success = 'green',
  info = 'blue',
  warn = 'yellow',
  error = 'red'
}

export enum IPicGoHelperType {
  afterUploadPlugins = 'afterUploadPlugins',
  beforeTransformPlugins = 'beforeTransformPlugins',
  beforeUploadPlugins = 'beforeUploadPlugins',
  uploader = 'uploader',
  transformer = 'transformer'
}

export enum IPasteStyle {
  MARKDOWN = 'markdown',
  HTML = 'HTML',
  URL = 'URL',
  UBB = 'UBB',
  CUSTOM = 'Custom'
}

export enum IWindowList {
  SETTING_WINDOW = 'SETTING_WINDOW',
  TRAY_WINDOW = 'TRAY_WINDOW',
  MINI_WINDOW = 'MINI_WINDOW',
  RENAME_WINDOW = 'RENAME_WINDOW',
  TOOLBOX_WINDOW = 'TOOLBOX_WINDOW'
}

export enum IRemoteNoticeActionType {
  OPEN_URL = 'OPEN_URL',
  SHOW_NOTICE = 'SHOW_NOTICE', // notification
  SHOW_DIALOG = 'SHOW_DIALOG', // dialog notice
  COMMON = 'COMMON',
  VOID = 'VOID', // do nothing
  SHOW_MESSAGE_BOX = 'SHOW_MESSAGE_BOX'
}

export enum IRemoteNoticeTriggerHook {
  APP_START = 'APP_START',
  SETTING_WINDOW_OPEN = 'SETTING_WINDOW_OPEN',
}

export enum IRemoteNoticeTriggerCount {
  ONCE = 'ONCE', // default
  ALWAYS = 'ALWAYS'
}

/**
 * renderer trigger action from main
 */
export enum IRPCActionType {
  // config rpc
  GET_PICBED_CONFIG_LIST = 'GET_PICBED_CONFIG_LIST',
  DELETE_PICBED_CONFIG = 'DELETE_PICBED_CONFIG',
  CHANGE_CURRENT_UPLOADER = 'CHANGE_CURRENT_UPLOADER',
  SELECT_UPLOADER = 'SELECT_UPLOADER',
  UPDATE_UPLOADER_CONFIG = 'UPDATE_UPLOADER_CONFIG',

  // version rpc
  GET_LATEST_VERSION = 'GET_LATEST_VERSION',

  // toolbox rpc
  TOOLBOX_CHECK = 'TOOLBOX_CHECK',
  TOOLBOX_CHECK_RES = 'TOOLBOX_CHECK_RES',
  TOOLBOX_CHECK_FIX = 'TOOLBOX_CHECK_FIX',

  // system rpc
  RELOAD_APP = 'RELOAD_APP',
  OPEN_FILE = 'OPEN_FILE',
  COPY_TEXT = 'COPY_TEXT',
  SHOW_DOCK_ICON = 'SHOW_DOCK_ICON',

  // gallery and toolbox rpc
  UPDATE_GALLERY = 'UPDATE_GALLERY',
  GET_GALLERY_MENU_LIST = 'GET_GALLERY_MENU_LIST',
  OPEN_CONFIG_DIALOG = 'OPEN_CONFIG_DIALOG',
}

export enum IToolboxItemType {
  IS_CONFIG_FILE_BROKEN = 'IS_CONFIG_FILE_BROKEN',
  IS_GALLERY_FILE_BROKEN = 'IS_GALLERY_FILE_BROKEN',
  HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD = 'HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD',
  HAS_PROBLEM_WITH_PROXY = 'HAS_PROBLEM_WITH_PROXY',
}

export enum IToolboxItemCheckStatus {
  INIT = 'init',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

export enum IStartupMode {
  SHOW_MAIN_WINDOW = 'SHOW_SETTING_WINDOW',
  SHOW_MINI_WINDOW = 'SHOW_MINI_WINDOW',
  HIDE = 'HIDE'
}
