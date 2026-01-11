export const isUrl = (url: string): boolean => (url.startsWith('http://') || url.startsWith('https://'))

export interface IParseNewlineSeparatedUrlsResult {
  urls: string[]
  invalidLines: string[]
}

export interface IParseNewlineSeparatedUrlsOptions {
  source?: 'plain' | 'uri-list'
}

export const parseNewlineSeparatedUrls = (
  input: string,
  options: IParseNewlineSeparatedUrlsOptions = {}
): IParseNewlineSeparatedUrlsResult => {
  const source = options.source || 'plain'
  const urls: string[] = []
  const invalidLines: string[] = []
  const seen = new Set<string>()

  const splitConcatenatedUrls = (line: string): string[] => {
    const indexes: number[] = []
    const re = /https?:\/\//g
    let match: RegExpExecArray | null = null
    while ((match = re.exec(line))) {
      const index = match.index
      if (index === 0) {
        indexes.push(index)
        continue
      }
      const prevChar = line[index - 1]
      if (prevChar === '=' || prevChar === '?' || prevChar === '&' || prevChar === '#') continue
      indexes.push(index)
    }

    if (indexes.length <= 1) return [line]

    return indexes.map((startIndex, i) => {
      const endIndex = indexes[i + 1] || line.length
      return line.slice(startIndex, endIndex)
    })
  }

  const normalizedInput = input
    .split('\u0000').join('\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')

  normalizedInput.split('\n').forEach((rawLine) => {
    const line = rawLine.trim()
    if (!line) return
    if (source === 'uri-list' && line.startsWith('#')) return

    if (!isUrl(line)) {
      invalidLines.push(rawLine)
      return
    }

    const parts = splitConcatenatedUrls(line)
    parts.forEach((part) => {
      if (seen.has(part)) return
      urls.push(part)
      seen.add(part)
    })
  })

  return {
    urls,
    invalidLines
  }
}

export const extractHttpUrlsFromText = (text: string): string[] => {
  const urls: string[] = []
  const seen = new Set<string>()
  const matches = text.match(/https?:\/\/[^\s<>"']+/g) || []

  matches.forEach((match) => {
    const maybeUrl = match.replace(/[)\]}>.,;:!?]+$/, '')

    if (seen.has(maybeUrl)) return
    if (!isUrl(maybeUrl)) return

    urls.push(maybeUrl)
    seen.add(maybeUrl)
  })

  return urls
}
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
