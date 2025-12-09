// different platform has different format

// macos (dmg, x64 + arm64)
const darwin = [{
  appNameWithPrefix: 'PicGo',
  ext: 'dmg',
  arch: 'arm64',
  'version-file': 'latest-mac.yml'
}, {
  appNameWithPrefix: 'PicGo',
  ext: 'dmg',
  arch: 'x64',
  'version-file': 'latest-mac.yml'
}]

// linux (AppImage, deb, snap)
const linux = [{
  appNameWithPrefix: 'PicGo',
  ext: 'AppImage',
  arch: 'arm64',
  'version-file': 'latest-linux-arm64.yml'
}, {
  appNameWithPrefix: 'PicGo',
  ext: 'AppImage',
  arch: 'x86_64',
  'version-file': 'latest-linux.yml'
}, {
  appNameWithPrefix: 'PicGo',
  ext: 'deb',
  arch: 'arm64',
  'version-file': 'latest-linux-arm64.yml'
}, {
  appNameWithPrefix: 'PicGo',
  ext: 'deb',
  arch: 'amd64',
  'version-file': 'latest-linux.yml'
}, {
  appNameWithPrefix: 'PicGo',
  ext: 'snap',
  arch: 'amd64',
  'version-file': 'latest-linux.yml'
}]

// windows (nsis, x64 + ia32 + arm64)
const win32 = [{
  appNameWithPrefix: 'PicGo',
  ext: 'exe',
  arch: 'ia32',
  'version-file': 'latest.yml'
}, {
  appNameWithPrefix: 'PicGo',
  ext: 'exe',
  arch: 'x64',
  'version-file': 'latest.yml'
}, {
  appNameWithPrefix: 'PicGo',
  ext: 'exe',
  arch: 'arm64',
  'version-file': 'latest.yml'
}]

module.exports = {
  darwin,
  linux,
  win32
}
