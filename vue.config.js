const path = require('path')
function resolve (dir) {
  return path.join(__dirname, dir)
}

const config = {
  configureWebpack: {
    devtool: 'nosources-source-map'
  },
  chainWebpack: config => {
    config.resolve.alias
      .set('@', resolve('src/renderer'))
      .set('~', resolve('src'))
      .set('root', resolve('./'))
      .set('#', resolve('src/universal'))
    // define
    // config.plugin('define')
    //   .tap(args => {
    //     return args
    //   })
  },
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true, // will remove in the future
      customFileProtocol: 'picgo://./',
      externals: ['picgo'],
      chainWebpackMainProcess: config => {
        config.resolve.alias
          .set('@', resolve('src/renderer'))
          .set('~', resolve('src'))
          .set('root', resolve('./'))
          .set('#', resolve('src/universal'))
          .set('apis', resolve('src/main/apis'))
          .set('@core', resolve('src/main/apis/core'))
        config.resolve.mainFields
          .clear()
          .add('main') // fix some modules will use browser target
          .add('module')
      },
      builderOptions: {
        productName: 'PicGo',
        appId: 'com.molunerfinn.picgo',
        publish: [
          {
            provider: 'github',
            owner: 'Molunerfinn',
            repo: 'PicGo',
            releaseType: 'draft'
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
          target: [{
            target: 'dmg',
            arch: [
              'x64',
              'arm64'
            ]
          }],
          // eslint-disable-next-line no-template-curly-in-string
          artifactName: 'PicGo-${version}-${arch}.dmg'
        },
        win: {
          icon: 'build/icons/icon.ico',
          // eslint-disable-next-line no-template-curly-in-string
          artifactName: 'PicGo-Setup-${version}-${arch}.exe',
          target: [{
            target: 'nsis',
            arch: [
              'x64',
              'ia32'
            ]
          }]
        },
        nsis: {
          shortcutName: 'PicGo',
          oneClick: false,
          allowToChangeInstallationDirectory: true,
          include: 'build/installer.nsh'
        },
        linux: {
          icon: 'build/icons/'
        },
        snap: {
          publish: ['github']
        }
      }
    }
  }
}

if (process.env.NODE_ENV === 'development') {
  config.configureWebpack = {
    devtool: 'source-map'
  }
  // for dev main process hot reload
  config.pluginOptions.electronBuilder.mainProcessWatch = ['src/main/**/*']
}

module.exports = {
  ...config
}
