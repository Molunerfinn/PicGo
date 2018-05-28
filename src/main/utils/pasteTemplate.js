import db from '../../datastore'

export default (style, url) => {
  const customLink = db.read().get('customLink').value() || '$url'
  const tpl = {
    'markdown': `![](${url})`,
    'HTML': `<img src="${url}"/>`,
    'URL': url,
    'UBB': `[IMG]${url}[/IMG]`,
    'Custom': customLink.replace(/\$url/g, url)
  }
  return tpl[style]
}
