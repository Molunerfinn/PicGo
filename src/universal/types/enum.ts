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
  RENAME_WINDOW = 'RENAME_WINDOW'
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
