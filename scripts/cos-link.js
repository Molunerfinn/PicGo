const pkg = require('../package.json')
const version = pkg.version
// TODO: use the same name format
const generateURL = (platform, ext, prefix = 'PicGo-') => {
  return `https://picgo-release.molunerfinn.com/${version}/${prefix}${version}${platform}${ext}`
}

const platformExtList = [
  ['-arm64', '.dmg', 'PicGo-'],
  ['-x64', '.dmg', 'PicGo-'],
  ['', '.AppImage', 'PicGo-'],
  ['-ia32', '.exe', 'PicGo-Setup-'],
  ['-x64', '.exe', 'PicGo-Setup-'],
  ['', '.exe', 'PicGo-Setup-'],
  ['_amd64', '.snap', 'picgo_']
]

const links = platformExtList.map(([arch, ext, prefix]) => {
  const markdownLink = `[${prefix}${version}${arch}${ext}](${generateURL(arch, ext, prefix)})`
  return markdownLink
})

console.log(links.join('\n'))
