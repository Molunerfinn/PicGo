import { GET_CURRENT_LANGUAGE, SET_CURRENT_LANGUAGE, FORCE_UPDATE, GET_LANGUAGE_LIST } from '#/events/constants'
import bus from '@/utils/bus'
import { builtinI18nList } from '#/i18n'
import { ipc, picgoI18n } from '@/utils/bridge'

export class I18nManager {
  private i18n: BridgeI18nInstance | null = null
  private i18nFileList: II18nItem[] = builtinI18nList

  private getLanguageList () {
    ipc.send(GET_LANGUAGE_LIST)
    ipc.once(GET_LANGUAGE_LIST, (list: II18nItem[]) => {
      this.i18nFileList = list
    })
  }

  private getCurrentLanguage () {
    ipc.send(GET_CURRENT_LANGUAGE)
    ipc.once(GET_CURRENT_LANGUAGE, (lang: string, locales: ILocales) => {
      this.setLocales(lang, locales)
      bus.emit(FORCE_UPDATE)
    })
  }

  private setLocales (lang: string, locales: ILocales) {
    this.i18n = picgoI18n.I18n.createFromLocales({
      [lang]: locales
    }, lang)
  }

  constructor () {
    this.getCurrentLanguage()
    this.getLanguageList()
    ipc.on(SET_CURRENT_LANGUAGE, (lang: string, locales: ILocales) => {
      this.setLocales(lang, locales)
      bus.emit(FORCE_UPDATE)
    })
  }

  T (key: ILocalesKey, args: IStringKeyMap = {}): string {
    return this.i18n?.translate(key, args) || key
  }

  setCurrentLanguage (lang: string) {
    ipc.send(SET_CURRENT_LANGUAGE, lang)
  }

  get languageList () {
    return this.i18nFileList
  }
}

const i18nManager = new I18nManager()

const T = (key: ILocalesKey, args: IStringKeyMap = {}): string => {
  return i18nManager.T(key, args)
}

export {
  i18nManager,
  T
}
