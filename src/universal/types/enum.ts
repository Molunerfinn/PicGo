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
