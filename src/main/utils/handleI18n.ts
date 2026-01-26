import picgo from '@core/picgo'
import { i18nManager } from '~/main/i18n'
export const initI18n = () => {
  const currentLanguage = picgo.getConfig<string>('settings.language') || 'en'
  i18nManager.setCurrentLanguage(currentLanguage)
}
