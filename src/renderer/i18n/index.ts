import { ipcRenderer } from 'electron'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { parse } from 'yaml'
import { GET_CURRENT_LANGUAGE, SET_CURRENT_LANGUAGE } from '#/events/constants'
import { builtinI18nList } from '#/i18n'
import enRaw from '../../../public/i18n/en.yml?raw'
import zhCNRaw from '../../../public/i18n/zh-CN.yml?raw'
import zhTWRaw from '../../../public/i18n/zh-TW.yml?raw'

type TranslationMap = Record<string, string>

function parseLocale (raw: string): TranslationMap {
  return parse(raw) as TranslationMap
}

function applyLanguage (lang: string) {
  const nextLanguage = ['en', 'zh-CN', 'zh-TW'].includes(lang) ? lang : 'en'
  return i18n.changeLanguage(nextLanguage).catch(() => {
    return i18n.changeLanguage('en')
  })
}

let initializePromise: Promise<typeof i18n> | null = null

export function initializeI18n () {
  if (initializePromise) {
    return initializePromise
  }

  initializePromise = i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: parseLocale(enRaw) },
        'zh-CN': { translation: parseLocale(zhCNRaw) },
        'zh-TW': { translation: parseLocale(zhTWRaw) }
      },
      lng: 'en',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
        prefix: '${',
        suffix: '}'
      }
    })
    .then(async () => {
      ipcRenderer.send(GET_CURRENT_LANGUAGE)
      ipcRenderer.once(GET_CURRENT_LANGUAGE, (_event, lang: string) => {
        applyLanguage(lang)
      })
      ipcRenderer.on(SET_CURRENT_LANGUAGE, (_event, lang: string) => {
        applyLanguage(lang)
      })
      return i18n
    })

  return initializePromise
}

export function setCurrentLanguage (lang: string) {
  ipcRenderer.send(SET_CURRENT_LANGUAGE, lang)
}

export function getLanguageList () {
  return builtinI18nList
}

export default i18n
