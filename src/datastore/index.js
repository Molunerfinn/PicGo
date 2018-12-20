import Datastore from 'lowdb'
import LodashId from 'lodash-id'
import FileSync from 'lowdb/adapters/FileSync'
import path from 'path'
import fs from 'fs-extra'
import { remote, app } from 'electron'

if (process.env.NODE_ENV !== 'development') {
  global.__static = path.join(__dirname, '/static').replace(/\\/g, '\\\\')
}
if (process.env.DEBUG_ENV === 'debug') {
  global.__static = path.join(__dirname, '../../static').replace(/\\/g, '\\\\')
}

const APP = process.type === 'renderer' ? remote.app : app
const STORE_PATH = APP.getPath('userData')

if (process.type !== 'renderer') {
  if (!fs.pathExistsSync(STORE_PATH)) {
    fs.mkdirpSync(STORE_PATH)
  }
}

const adapter = new FileSync(path.join(STORE_PATH, '/data.json'))

const db = Datastore(adapter)
db._.mixin(LodashId)

if (!db.has('uploaded').value()) {
  db.set('uploaded', []).write()
}

if (!db.has('picBed').value()) {
  db.set('picBed', {
    current: 'weibo'
  }).write()
}

if (!db.has('settings.shortKey').value()) {
  db.set('settings.shortKey', {
    upload: 'CommandOrControl+Shift+P'
  }).write()
}

// init generate clipboard image files
if (!fs.pathExistsSync(path.join(STORE_PATH, 'windows.ps1'))) {
  fs.copySync(path.join(__static, '/linux.sh'), path.join(STORE_PATH, '/linux.sh'))
  fs.copySync(path.join(__static, '/mac.applescript'), path.join(STORE_PATH, '/mac.applescript'))
  fs.copySync(path.join(__static, '/windows.ps1'), path.join(STORE_PATH, '/windows.ps1'))
}

export default db
