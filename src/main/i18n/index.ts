import yaml from 'js-yaml'
import { ObjectAdapter, I18n } from '@picgo/i18n'
import path from 'path'
import fs from 'fs-extra'
import { builtinI18nList } from '#/i18n'

class I18nManager {
  private i18n: I18n | null = null
  private builtinI18nFolder = path.join(__static, 'i18n')
  private outerI18nFolder = ''
  private localesMap: Map<string, ILocales> = new Map()
  private currentLanguage: string = 'zh-CN'
  readonly defaultLanguage: string = 'zh-CN'
  private i18nFileList: II18nItem[] = builtinI18nList

  setOuterI18nFolder (folder: string) {
    this.outerI18nFolder = folder
  }

  addI18nFile (file: string, label: string) {
    this.i18nFileList.push({
      label,
      value: file
    })
  }

  private getLocales (lang: string): ILocales {
    if (this.localesMap.has(lang)) {
      return this.localesMap.get(lang)!
    }
    let localesPath = path.join(this.builtinI18nFolder, `${lang}.yml`)
    if (!fs.existsSync(localesPath)) {
      localesPath = path.join(this.outerI18nFolder, `${lang}.yml`)
      if (!fs.existsSync(localesPath)) {
        localesPath = path.join(this.builtinI18nFolder, `${this.defaultLanguage}.yml`)
      }
    }
    try {
      const localesString = fs.readFileSync(localesPath, 'utf8')
      const locales = yaml.load(localesString) as unknown as ILocales
      this.localesMap.set(lang, locales)
      return locales
    } catch (e) {
      console.error(e)
      // if error, use default language
      localesPath = path.join(this.builtinI18nFolder, `${this.defaultLanguage}.yml`)
      const localesString = fs.readFileSync(localesPath, 'utf8')
      const locales = yaml.load(localesString) as unknown as ILocales
      this.localesMap.set(lang, locales)
      return locales
    }
  }

  setCurrentLanguage (lang: string) {
    const locales = this.getLocales(lang)
    this.currentLanguage = lang
    this.initI18n(lang, locales)
  }

  private initI18n (lang: string = this.defaultLanguage, locales: ILocales) {
    const objectAdapter = new ObjectAdapter({
      [lang]: locales
    })
    this.i18n = new I18n({
      adapter: objectAdapter,
      defaultLanguage: lang
    })
  }

  T (key: ILocalesKey, args: IStringKeyMap = {}): string {
    return this.i18n?.translate(key, args) || key
  }

  get languageList () {
    return this.i18nFileList
  }

  getCurrentLocales () {
    return {
      lang: this.currentLanguage,
      locales: this.getLocales(this.currentLanguage)
    }
  }
}

export const T = (key: ILocalesKey, args: IStringKeyMap = {}): string => {
  return i18nManager.T(key, args)
}

export const i18nManager = new I18nManager()
