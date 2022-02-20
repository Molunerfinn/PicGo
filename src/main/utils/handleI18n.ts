import db from '~/main/apis/core/datastore'
import { i18n } from '#/i18n'
export const initI18n = () => {
  const currentLanguage = db.get('settings.language') || 'zh-CN'
  i18n.setLanguage(currentLanguage)
}
