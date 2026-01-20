import type { Configuration } from 'electron-builder'
import dotenv from 'dotenv'
 
dotenv.config()

const shouldNotarize = process.env.SKIP_NOTARIZE !== 'true'

const config: Configuration = {
  appId: 'com.molunerfinn.picgo',
  productName: 'PicGo',
  afterSign: shouldNotarize ? 'scripts/notarize.js' : undefined,
  // publish: [
  //   {
  //     provider: 'github',
  //     owner: 'Molunerfinn',
  //     repo: 'PicGo',
  //     releaseType: 'draft'
  //   }
  // ],
  // temporarily disable auto update feature
  publish: [],
  files: [
    'dist_electron/**/*',
    'public/**/*',
    'package.json',
    '!node_modules/@babel/**/*',
    "!**/node_modules/typescript{,/**}"
  ],
  extraResources: [
    {
      from: 'public',
      to: 'public'
    }
  ],
  dmg: {
    contents: [
      {
        x: 410,
        y: 150,
        type: 'link',
        path: '/Applications'
      },
      {
        x: 130,
        y: 150,
        type: 'file'
      }
    ]
  },
  mac: {
    icon: 'build/icons/icon.icns',
    extendInfo: {
      LSUIElement: 0
    },
    target: [
      {
        target: 'dmg',
        arch: ['arm64', 'x64']
      }
    ],
    artifactName: 'PicGo-${version}-${arch}.${ext}',
    hardenedRuntime: true,
    entitlements: 'build/entitlements.mac.plist',
    entitlementsInherit: 'build/entitlements.mac.plist',
    notarize: false
  },
  win: {
    icon: 'build/icons/icon.ico',
    artifactName: 'PicGo-${version}-${arch}.exe',
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      },
      {
        target: 'nsis',
        arch: ['ia32']
      },
      {
        target: 'nsis',
        arch: ['arm64']
      }
    ]
  },
  nsis: {
    shortcutName: 'PicGo',
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    buildUniversalInstaller: false,
    include: 'build/installer.nsh'
  },
  linux: {
    executableName: 'PicGo',
    icon: 'build/icons/512x512.png',
    artifactName: 'PicGo-${version}-${arch}.${ext}',
    target: [
      {
        target: 'AppImage',
        arch: ['x64', 'arm64']
      },
      {
        target: 'deb',
        arch: ['x64', 'arm64']
      },
      {
        target: 'snap',
        arch: ['x64'],
      }
    ],
    maintainer: 'Molunerfinn',
    category: 'Utility',
    publish: []
  },
  snap: {
    publish: []
  }
}

export default config
