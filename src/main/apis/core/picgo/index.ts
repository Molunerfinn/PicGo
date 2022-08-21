import { dbChecker, dbPathChecker } from 'apis/core/datastore/dbChecker'
import pkg from 'root/package.json'
import { PicGo } from 'picgo'
import db from 'apis/core/datastore'
import debounce from 'lodash/debounce'

const CONFIG_PATH = dbPathChecker()

dbChecker()

const picgo = new PicGo(CONFIG_PATH)
picgo.saveConfig({
  debug: true,
  PICGO_ENV: 'GUI'
})

global.PICGO_GUI_VERSION = pkg.version
picgo.GUI_VERSION = global.PICGO_GUI_VERSION

const originPicGoSaveConfig = picgo.saveConfig.bind(picgo)

function flushDB () {
  db.flush()
}

const debounced = debounce(flushDB, 1000)

picgo.saveConfig = (config: IStringKeyMap) => {
  originPicGoSaveConfig(config)
  // flush electron's db
  debounced()
}

export default picgo
