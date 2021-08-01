import PicGoCore from '~/universal/types/picgo'
import { dbChecker, dbPathChecker } from 'apis/core/datastore/dbChecker'
import fs from 'fs-extra'
// eslint-disable-next-line
const requireFunc = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require
const PicGo = requireFunc('picgo') as typeof PicGoCore

const CONFIG_PATH = dbPathChecker()

dbChecker()

const picgo = new PicGo(CONFIG_PATH)
picgo.saveConfig({
  debug: true,
  PICGO_ENV: 'GUI'
})

picgo.GUI_VERSION = global.PICGO_GUI_VERSION

export default picgo! as PicGoCore
