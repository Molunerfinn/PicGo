import path from 'path'
import fs from 'fs-extra'
import { DBStore } from '@picgo/store'
import { getGalleryDBPath } from './dbChecker'

const DB_PATH: string = getGalleryDBPath().dbPath
fs.ensureDirSync(path.dirname(DB_PATH))

class GalleryDB {
  private static instance: DBStore
  private constructor () {}

  public static getInstance (): DBStore {
    if (!GalleryDB.instance) {
      GalleryDB.instance = new DBStore(DB_PATH, 'gallery')
    }
    return GalleryDB.instance
  }
}

export {
  GalleryDB
}
