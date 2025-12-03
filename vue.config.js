const path = require('path')
function resolve (dir) {
  return path.join(__dirname, dir)
}

module.exports = {
  configureWebpack: {
    devtool: process.env.NODE_ENV === 'development' ? 'source-map' : 'nosources-source-map'
  },
  chainWebpack: config => {
    config.resolve.alias
      .set('@', resolve('src/renderer'))
      .set('~', resolve('src'))
      .set('root', resolve('./'))
      .set('#', resolve('src/universal'))
  }
}
