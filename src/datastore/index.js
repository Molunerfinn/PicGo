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
let clipboardFiles = getClipboardFiles()
if (!fs.pathExistsSync(path.join(STORE_PATH, 'windows10.ps1'))) {
  clipboardFiles.forEach(item => {
    fs.copyFileSync(item.origin, item.dest)
  })
} else {
  clipboardFiles.forEach(item => {
    diffFilesAndUpdate(item.origin, item.dest)
  })
}

function diffFilesAndUpdate (filePath1, filePath2) {
  let file1 = fs.readFileSync(filePath1)
  let file2 = fs.readFileSync(filePath2)

  if (!file1.equals(file2)) {
    fs.copyFileSync(filePath1, filePath2)
  }
}

function getClipboardFiles () {
  let files = [
    '/linux.sh',
    '/mac.applescript',
    '/windows.ps1',
    '/windows10.ps1'
  ]

  return files.map(item => {
    return {
      origin: path.join(__static, item),
      dest: path.join(STORE_PATH, item)
    }
  })
}

export default db
