import { ZH_CN } from './zh-CN'
import { ObjectAdapter, I18n } from '@picgo/i18n'

const languageList = {
  'zh-CN': ZH_CN
}

const objectAdapter = new ObjectAdapter(languageList)

const i18n = new I18n({
  adapter: objectAdapter,
  defaultLanguage: 'zh-CN'
})

const T = (key: ILocalesKey, args: IStringKeyMap = {}): string => {
  return i18n.translate(key, args) || ''
}

export { i18n, T }
