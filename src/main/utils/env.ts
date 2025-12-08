import path from 'path'
import { app } from 'electron'
import { pathToFileURL } from 'url'

export const isDev = !app.isPackaged

const defaultStaticPath = process.env.STATIC_PATH || (isDev
  ? path.join(process.cwd(), 'public')
  : path.join(process.resourcesPath, 'public'))

process.env.STATIC_PATH = defaultStaticPath

const rendererHtmlPath = path.join(__dirname, '../renderer/index.html')

export const initStaticPath = () => defaultStaticPath

export const getRendererBaseUrl = () => {
  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    return process.env.ELECTRON_RENDERER_URL
  }
  return pathToFileURL(rendererHtmlPath).toString()
}

export const buildRendererUrl = (hash?: string) => {
  const base = getRendererBaseUrl()
  if (!hash) return base
  const cleanedHash = hash.startsWith('#') ? hash : `#${hash}`
  return `${base}${cleanedHash}`
}

export const getStaticPath = () => process.env.STATIC_PATH || defaultStaticPath
