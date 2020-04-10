import PicGoCore from '~/universal/types/picgo'
import {
  app
} from 'electron'
import path from 'path'
// eslint-disable-next-line
const requireFunc = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require
const PicGo = requireFunc('picgo') as typeof PicGoCore
const STORE_PATH = app.getPath('userData')

const CONFIG_PATH = path.join(STORE_PATH, '/data.json')

const picgo = new PicGo(CONFIG_PATH)
picgo.saveConfig({
  debug: true,
  PICGO_ENV: 'GUI'
})

export default picgo as PicGoCore
