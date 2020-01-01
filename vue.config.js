const path = require('path')
function resolve (dir) {
  return path.join(__dirname, dir)
}
module.exports = {
  chainWebpack: config => {
    config.resolve.alias
      .set('@', resolve('src/renderer'))
      .set('~', resolve('src'))
      .set('root', resolve('./'))
      .set('#', resolve('src/universal'))
  },
  pluginOptions: {
    electronBuilder: {
      customFileProtocol: 'picgo://./',
      externals: ['picgo'],
      chainWebpackMainProcess: config => {
        config.resolve.alias
          .set('@', resolve('src/renderer'))
          .set('~', resolve('src'))
          .set('root', resolve('./'))
          .set('#', resolve('src/universal'))
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
            LSUIElement: 1
          }
        },
        win: {
          icon: 'build/icons/icon.ico',
          target: 'nsis'
        },
        nsis: {
          shortcutName: 'PicGo',
          oneClick: false,
          allowToChangeInstallationDirectory: true
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
