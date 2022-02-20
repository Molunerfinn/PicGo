import { ZH_CN } from './zh-CN'
import { EN } from './en'
import { ObjectAdapter, I18n } from '@picgo/i18n'

const languageMap = {
  'zh-CN': ZH_CN,
  en: EN
}

const objectAdapter = new ObjectAdapter(languageMap)

const i18n = new I18n({
  adapter: objectAdapter,
  defaultLanguage: 'zh-CN'
})

const T = (key: ILocalesKey, args: IStringKeyMap = {}): string => {
  return i18n.translate(key, args) || ''
}

const languageList = Object.keys(languageMap)

export { i18n, T, languageList }
