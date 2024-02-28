export const isUrl = (url: string): boolean => (url.startsWith('http://') || url.startsWith('https://'))
export const isUrlEncode = (url: string): boolean => {
  url = url || ''
  try {
    return url !== decodeURI(url)
  } catch (e) {
    // if some error caught, try to let it go
    return false
  }
}

export const handleUrlEncode = (url: string): string => {
  if (!isUrlEncode(url)) {
    url = encodeURI(url)
  }
  return url
}

/**
 * streamline the full plugin name to a simple one
 * for example:
 * 1. picgo-plugin-xxx -> xxx
 * 2. @xxx/picgo-plugin-yyy -> yyy
 * @param name pluginFullName
 */
export const handleStreamlinePluginName = (name: string) => {
  if (/^@[^/]+\/picgo-plugin-/.test(name)) {
    return name.replace(/^@[^/]+\/picgo-plugin-/, '')
  } else {
    return name.replace(/picgo-plugin-/, '')
  }
}

/**
 * for just simple clone an object
 */
export const simpleClone = (obj: any) => {
  return JSON.parse(JSON.stringify(obj))
}

export const enforceNumber = (num: number | string) => {
  return isNaN(Number(num)) ? 0 : Number(num)
}

export const isDev = process.env.NODE_ENV === 'development'

export const trimValues = (obj: IStringKeyMap) => {
  const newObj = {} as IStringKeyMap
  Object.keys(obj).forEach(key => {
    newObj[key] = typeof obj[key] === 'string' ? obj[key].trim() : obj[key]
  })
  return newObj
}

export const isMacOS = process.platform === 'darwin'
export const isWindows = process.platform === 'win32'
export const isLinux = process.platform === 'linux'
