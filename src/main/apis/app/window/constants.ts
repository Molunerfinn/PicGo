const isDevelopment = process.env.NODE_ENV !== 'production'

export const TRAY_WINDOW_URL = isDevelopment
  ? (process.env.WEBPACK_DEV_SERVER_URL as string)
  : 'picgo://./index.html'

export const SETTING_WINDOW_URL = isDevelopment
  ? `${(process.env.WEBPACK_DEV_SERVER_URL as string)}#main-page/upload`
  : 'picgo://./index.html#main-page/upload'

export const MINI_WINDOW_URL = isDevelopment
  ? `${(process.env.WEBPACK_DEV_SERVER_URL as string)}#mini-page`
  : 'picgo://./index.html#mini-page'

export const RENAME_WINDOW_URL = process.env.NODE_ENV === 'development'
  ? `${(process.env.WEBPACK_DEV_SERVER_URL as string)}#rename-page`
  : 'picgo://./index.html#rename-page'

export const TOOLBOX_WINDOW_URL = process.env.NODE_ENV === 'development'
  ? `${(process.env.WEBPACK_DEV_SERVER_URL as string)}#toolbox-page`
  : 'picgo://./index.html#toolbox-page'
