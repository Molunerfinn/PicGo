import Datastore from 'lowdb'
// @ts-ignore
import LodashId from 'lodash-id'
import FileSync from 'lowdb/adapters/FileSync'
import fs from 'fs-extra'
import path from 'path'
import { app } from 'electron'
import { dbPathChecker } from './dbChecker'
import { DBStore } from '@picgo/store'

const APP = app
const STORE_PATH = APP.getPath('userData')

if (!fs.pathExistsSync(STORE_PATH)) {
  fs.mkdirpSync(STORE_PATH)
}
const CONFIG_PATH: string = dbPathChecker()
const CONFIG_DIR = path.dirname(CONFIG_PATH)
const DB_PATH = path.join(CONFIG_DIR, 'picgo.db')

// TODO: use JSONStore with @picgo/store
class ConfigStore {
  private db: Datastore.LowdbSync<Datastore.AdapterSync>
  constructor () {
    const adapter = new FileSync(CONFIG_PATH)

    this.db = Datastore(adapter)
    this.db._.mixin(LodashId)

    if (!this.db.has('uploaded').value()) {
      this.db.set('uploaded', []).write()
    }

    if (!this.db.has('picBed').value()) {
      this.db.set('picBed', {
        current: 'smms', // deprecated
        uploader: 'smms',
        smms: {
          token: ''
        }
      }).write()
    }

    if (!this.db.has('settings.shortKey').value()) {
      this.db.set('settings.shortKey[picgo:upload]', {
        enable: true,
        key: 'CommandOrControl+Shift+P',
        name: 'upload',
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
  set (key: string, value: any) {
    return this.read().set(key, value).write()
  }
  has (key: string) {
    return this.read().has(key).value()
  }
  insert (key: string, value: any): void {
    // @ts-ignore
    return this.read().get(key).insert(value).write()
  }
  unset (key: string, value: any): boolean {
    return this.read().get(key).unset(value).value()
  }
  getById (key: string, id: string) {
    // @ts-ignore
    return this.read().get(key).getById(id).value()
  }
  removeById (key: string, id: string) {
    // @ts-ignore
    return this.read().get(key).removeById(id).write()
  }
}

export default new ConfigStore()

// v2.3.0 add gallery db
const dbStore = new DBStore(DB_PATH, 'gallery')

export {
  dbStore
}
