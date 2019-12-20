import db from '#/datastore'
import { IPasteStyle } from '#/types/enum'

const formatCustomLink = (customLink: string, item: ImgInfo) => {
  let fileName = item.fileName!.replace(new RegExp(`\\${item.extname}$`), '')
  let url = item.url || item.imgUrl
  const formatObj = {
    url,
    fileName
  }
  const keys = Object.keys(formatObj) as ['url', 'fileName']
  keys.forEach(item => {
    if (customLink.indexOf(`$${item}`) !== -1) {
      let reg = new RegExp(`\\$${item}`, 'g')
      customLink = customLink.replace(reg, formatObj[item])
    }
  })
  return customLink
}

export default (style: IPasteStyle, item: ImgInfo) => {
  let url = item.url || item.imgUrl
  const customLink = db.get('settings.customLink') || '$url'
  const tpl = {
    'markdown': `![](${url})`,
    'HTML': `<img src="${url}"/>`,
    'URL': url,
    'UBB': `[IMG]${url}[/IMG]`,
    'Custom': formatCustomLink(customLink, item)
  }
  return tpl[style]
}
