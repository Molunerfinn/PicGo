import { i18n } from '~/universal/i18n'

export const handleURLParams = () => {
  const url = new URL(location.href)
  const search = new URLSearchParams(url.search)
  if (search.has('lang')) {
    const lang = search.get('lang') || 'zh-CN'
    i18n.setLanguage(lang)
  }
}
