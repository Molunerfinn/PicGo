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

class DB {
  constructor () {
    const adapter = new FileSync(path.join(STORE_PATH, '/data.json'))

    this.db = Datastore(adapter)
    this.db._.mixin(LodashId)

    if (!this.db.has('uploaded').value()) {
      this.db.set('uploaded', []).write()
    }

    if (!this.db.has('picBed').value()) {
      this.db.set('picBed', {
        current: 'weibo'
      }).write()
    }

    if (!this.db.has('settings.shortKey').value()) {
      this.db.set('settings.shortKey[picgo:upload]', {
        enable: true,
        key: 'CommandOrControl+Shift+P',
        name: 'picgo:upload',
        label: '快捷上传'
      }).write()
    }
  }
  read () {
    return this.db.read()
  }
  get (key = '') {
    return this.read().get(key).value()
  }
  set (key, value) {
    return this.read().set(key, value).write()
  }
  has (key) {
    return this.read().has(key).value()
  }
  insert (key, value) {
    return this.read().get(key).insert(value).write()
  }
}

export default new DB()
