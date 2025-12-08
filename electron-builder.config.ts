/* eslint-disable no-template-curly-in-string */
import type { Configuration } from 'electron-builder'

const config: Configuration = {
  appId: 'com.molunerfinn.picgo',
  productName: 'PicGo',
  publish: [
    {
      provider: 'github',
      owner: 'Molunerfinn',
      repo: 'PicGo',
      releaseType: 'draft'
    }
  ],
  files: [
    'dist_electron/**/*',
    'node_modules/**/*',
    'public/**/*',
    'package.json',
    'LICENSE',
    'README.md'
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
    icon: 'build/icons/512x512.png',
    extendInfo: {
      LSUIElement: 0
    },
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64']
      }
    ],
    artifactName: 'PicGo-${version}-${arch}.${ext}'
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
        arch: ['x64']
      }
    ],
    maintainer: 'Molunerfinn',
    category: 'Utility'
  }
}

export default config
