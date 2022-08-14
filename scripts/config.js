// different platform has different format

// macos
const darwin = [{
  appNameWithPrefix: 'PicGo-',
  ext: '.dmg',
  arch: '-arm64',
  'version-file': 'latest-mac.yml'
}, {
  appNameWithPrefix: 'PicGo-',
  ext: '.dmg',
  arch: '-x64',
  'version-file': 'latest-mac.yml'
}]

const linux = [{
  appNameWithPrefix: 'PicGo-',
  ext: '.AppImage',
  arch: '',
  'version-file': 'latest-linux.yml'
}, {
  appNameWithPrefix: 'picgo_',
  ext: '.snap',
  arch: '_amd64',
  'version-file': 'latest-linux.yml'
}]

// windows
const win32 = [{
  appNameWithPrefix: 'PicGo-Setup-',
  ext: '.exe',
  arch: '-ia32',
  'version-file': 'latest.yml'
}, {
  appNameWithPrefix: 'PicGo-Setup-',
  ext: '.exe',
  arch: '-x64',
  'version-file': 'latest.yml'
}, {
  appNameWithPrefix: 'PicGo-Setup-',
  ext: '.exe',
  arch: '', // 32 & 64
  'version-file': 'latest.yml'
}]

module.exports = {
  darwin,
  linux,
  win32
}
