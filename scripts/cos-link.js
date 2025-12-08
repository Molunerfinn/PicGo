const pkg = require('../package.json')
const version = pkg.version

const generateURL = (arch, ext, prefix = 'PicGo-') => `https://release.picgo.app/${version}/${prefix}${version}${arch}${ext}`

const windows = [
  { label: '32 bit', arch: '-ia32', ext: '.exe' },
  { label: '64 bit', arch: '-x64', ext: '.exe' },
  { label: 'ARM64', arch: '-arm64', ext: '.exe' }
]

const macos = [
  { label: 'Intel', arch: '-x64', ext: '.dmg' },
  { label: 'Apple Silicon', arch: '-arm64', ext: '.dmg' }
]

const linux = {
  AppImage: [
    { label: '64 bit', arch: '-x64', ext: '.AppImage' },
    { label: 'ARM64', arch: '-arm64', ext: '.AppImage' }
  ],
  Deb: [
    { label: '64 bit', arch: '-x64', ext: '.deb' },
    { label: 'ARM64', arch: '-arm64', ext: '.deb' }
  ],
  Snap: [
    { label: '64 bit', arch: '-x64', ext: '.snap' }
  ]
}

const renderLine = (items) => items.map(({ label, arch, ext }) => `[${label}](${generateURL(arch, ext)})`).join(' | ')

const sections = [
  `### Windows\n- ${renderLine(windows)}`,
  `### macOS\n- ${renderLine(macos)}`,
  `### Linux\n- AppImage: ${renderLine(linux.AppImage)}\n- Deb: ${renderLine(linux.Deb)}\n- Snap: ${renderLine(linux.Snap)}`
]

console.log(sections.join('\n\n'))
