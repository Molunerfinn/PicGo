const isDevelopment = process.env.NODE_ENV !== 'production'
import { buildRendererUrl } from '~/main/utils/env'

export const TRAY_WINDOW_URL = buildRendererUrl()

export const SETTING_WINDOW_URL = buildRendererUrl('main-page/upload')

export const MINI_WINDOW_URL = buildRendererUrl('mini-page')

export const RENAME_WINDOW_URL = buildRendererUrl('rename-page')

export const TOOLBOX_WINDOW_URL = buildRendererUrl('toolbox-page')
