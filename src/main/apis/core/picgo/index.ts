import { dbChecker, dbPathChecker } from 'apis/core/datastore/dbChecker'
import pkg from 'root/package.json'
import { PicGo } from 'picgo'

const CONFIG_PATH = dbPathChecker()

dbChecker()

const picgo = new PicGo(CONFIG_PATH)
picgo.saveConfig({
  debug: true,
  PICGO_ENV: 'GUI'
})

global.PICGO_GUI_VERSION = pkg.version
picgo.GUI_VERSION = global.PICGO_GUI_VERSION

export default picgo
