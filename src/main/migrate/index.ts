import { DBStore } from '@picgo/store'
import ConfigStore from '~/main/apis/core/datastore'
import path from 'path'
import fse from 'fs-extra'
import { PicGo as PicGoCore } from 'picgo'
import { T } from '~/main/i18n'
import { SHORTKEY_COMMAND_UPLOAD } from 'apis/core/bus/constants'
// from v2.1.2
const updateShortKeyFromVersion212 = (db: typeof ConfigStore, shortKeyConfig: IShortKeyConfigs | IOldShortKeyConfigs) => {
  // #557 极端情况可能会出现配置不存在，需要重新写入
  if (shortKeyConfig === undefined) {
    const defaultShortKeyConfig = {
      enable: true,
      key: 'CommandOrControl+Shift+P',
      name: 'upload',
      label: T('QUICK_UPLOAD')
    }
    db.set('settings.shortKey[picgo:upload]', defaultShortKeyConfig)
    return true
  }
  if (shortKeyConfig.upload) {
    // @ts-ignore
    shortKeyConfig[SHORTKEY_COMMAND_UPLOAD] = {
      enable: true,
      key: shortKeyConfig.upload,
      name: 'upload',
      label: T('QUICK_UPLOAD')
    }
    // @ts-ignore
    delete shortKeyConfig.upload
    db.set('settings.shortKey', shortKeyConfig)
    return true
  }
  return false
}

const migrateGalleryFromVersion230 = async (configDB: typeof ConfigStore, galleryDB: DBStore, picgo: PicGoCore) => {
  const originGallery: ImgInfo[] = picgo.getConfig('uploaded')
  // if hasMigrate, we don't need to migrate
  const hasMigrate: boolean = configDB.get('__migrateUploaded')
  if (hasMigrate) {
    return
  }
  const configPath = configDB.getConfigPath()
  const configBakPath = path.join(path.dirname(configPath), 'config.bak.json')
  // migrate gallery from config to gallery db
  if (originGallery && Array.isArray(originGallery) && originGallery?.length > 0) {
    if (fse.existsSync(configBakPath)) {
      fse.copyFileSync(configPath, configBakPath)
    }
    await galleryDB.insertMany(originGallery)
    picgo.saveConfig({
      uploaded: [],
      __migrateUploaded: true
    })
  }
}

export {
  updateShortKeyFromVersion212,
  migrateGalleryFromVersion230
}
