import { IPasteStyle } from '#/types/enum'
import db from 'apis/core/datastore'
import { handleUrlEncode } from '~/universal/utils/common'

const formatCustomLink = (customLink: string, item: ImgInfo) => {
  const fileName = item.fileName!.replace(new RegExp(`\\${item.extname}$`), '')
  const url = item.url || item.imgUrl
  const extName = item.extname
  const formatObj = {
    url,
    fileName,
    extName
  }
  const keys = Object.keys(formatObj) as ['url', 'fileName', 'extName']
  keys.forEach(item => {
    if (customLink.indexOf(`$${item}`) !== -1) {
      const reg = new RegExp(`\\$${item}`, 'g')
      customLink = customLink.replace(reg, formatObj[item])
    }
  })
  return customLink
}

export default (style: IPasteStyle, item: ImgInfo, customLink: string | undefined) => {
  let url = item.url || item.imgUrl
  if (db.get('settings.encodeOutputURL') !== false) {
    url = handleUrlEncode(url)
  }
  const _customLink = customLink || '$url'
  const tpl = {
    markdown: `![](${url})`,
    HTML: `<img src="${url}"/>`,
    URL: url,
    UBB: `[IMG]${url}[/IMG]`,
    Custom: formatCustomLink(_customLink, item)
  }
  return tpl[style]
}
