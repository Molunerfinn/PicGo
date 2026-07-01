import path from 'path'
import fs from 'fs-extra'
import { DBStore } from '@picgo/store'
import { getAlbumDBPath } from './dbChecker'

const DB_PATH: string = getAlbumDBPath().dbPath
fs.ensureDirSync(path.dirname(DB_PATH))

class AlbumDB {
  private static instance: DBStore
  private constructor () {}

  public static getInstance (): DBStore {
    if (!AlbumDB.instance) {
      // Keep the namespace 'gallery' for @picgo/store to preserve existing user data on disk.
      AlbumDB.instance = new DBStore(DB_PATH, 'gallery')
    }
    return AlbumDB.instance
  }
}

export {
  AlbumDB
}
