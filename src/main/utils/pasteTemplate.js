import db from '../../datastore'

const formatCustomLink = (customLink, item) => {
  let fileName = item.fileName.replace(new RegExp(`\\${item.extname}$`), '')
  let url = item.url || item.imgUrl
  let formatObj = {
    url,
    fileName
  }
  let keys = Object.keys(formatObj)
  keys.forEach(item => {
    if (customLink.indexOf(`$${item}`) !== -1) {
      let reg = new RegExp(`\\$${item}`, 'g')
      customLink = customLink.replace(reg, formatObj[item])
    }
  })
  return customLink
}

export default (style, item) => {
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
