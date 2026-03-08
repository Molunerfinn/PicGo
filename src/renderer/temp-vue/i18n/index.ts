import { ipcRenderer } from 'electron'
import { ObjectAdapter, I18n } from '@picgo/i18n'
import { GET_CURRENT_LANGUAGE, SET_CURRENT_LANGUAGE, FORCE_UPDATE, GET_LANGUAGE_LIST } from '#/events/constants'
import bus from '@/utils/bus'
import { builtinI18nList } from '#/i18n'

export class I18nManager {
  private i18n: I18n | null = null
  private i18nFileList: II18nItem[] = builtinI18nList

  private getLanguageList () {
    ipcRenderer.send(GET_LANGUAGE_LIST)
    ipcRenderer.once(GET_LANGUAGE_LIST, (event, list: II18nItem[]) => {
      this.i18nFileList = list
    })
  }

  private getCurrentLanguage () {
    ipcRenderer.send(GET_CURRENT_LANGUAGE)
    ipcRenderer.once(GET_CURRENT_LANGUAGE, (event, lang: string, locales: ILocales) => {
      this.setLocales(lang, locales)
      bus.emit(FORCE_UPDATE)
    })
  }

  private setLocales (lang: string, locales: ILocales) {
    const objectAdapter = new ObjectAdapter({
      [lang]: locales
    })
    this.i18n = new I18n({
      adapter: objectAdapter,
      defaultLanguage: lang
    })
  }

  constructor () {
    this.getCurrentLanguage()
    this.getLanguageList()
    ipcRenderer.on(SET_CURRENT_LANGUAGE, (event, lang: string, locales: ILocales) => {
      this.setLocales(lang, locales)
      bus.emit(FORCE_UPDATE)
    })
  }

  T (key: ILocalesKey, args: IStringKeyMap = {}): string {
    return this.i18n?.translate(key, args) || key
  }

  setCurrentLanguage (lang: string) {
    ipcRenderer.send(SET_CURRENT_LANGUAGE, lang)
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
