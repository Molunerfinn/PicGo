import { ZH_CN } from './zh-CN'
import { ObjectAdapter, I18n } from '@picgo/i18n'

const languageList = {
  'zh-CN': ZH_CN
}

const lowercaseKeys = (obj: any) =>
  Object.keys(obj).reduce((acc: any, key: string) => {
    acc[key.toLowerCase()] = obj[key]
    return acc
  }, {})

// FIXME: @picgo/i18n no lowecase
const objectAdapter = new ObjectAdapter(lowercaseKeys(languageList))

const i18n = new I18n({
  adapter: objectAdapter,
  defaultLanguage: 'zh-cn'
})

// FIXME: @picgo/i18n args should be optional
const T = (key: ILocalesKey, args: IStringKeyMap = {}): string => {
  return i18n.translate(key, args)!
}

export { i18n, T }
