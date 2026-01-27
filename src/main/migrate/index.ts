import { DBStore } from '@picgo/store'
import path from 'path'
import fse from 'fs-extra'
import { PicGo as PicGoCore } from 'picgo'
import { T } from '~/main/i18n'
import { SHORTKEY_COMMAND_UPLOAD } from 'apis/core/bus/constants'
// from v2.1.2
const updateShortKeyFromVersion212 = (picgo: PicGoCore) => {
  const shortKeyConfig = picgo.getConfig<IShortKeyConfigs | IOldShortKeyConfigs | undefined>('settings.shortKey')
  // #557 极端情况可能会出现配置不存在，需要重新写入
  if (shortKeyConfig === undefined) {
    const defaultShortKeyConfig = {
      enable: true,
      key: 'CommandOrControl+Shift+U',
      name: 'upload',
      label: T('QUICK_UPLOAD')
    }
    picgo.saveConfig({
      [`settings.shortKey[${SHORTKEY_COMMAND_UPLOAD}]`]: defaultShortKeyConfig
    })
    return true
  }
  if (typeof (shortKeyConfig as IOldShortKeyConfigs).upload === 'string') {
    const oldKey = (shortKeyConfig as IOldShortKeyConfigs).upload
    const nextConfig = Object.fromEntries(
      Object.entries(shortKeyConfig).filter(([key]) => key !== 'upload')
    ) as IShortKeyConfigs
    nextConfig[SHORTKEY_COMMAND_UPLOAD] = {
      enable: true,
      key: oldKey,
      name: 'upload',
      label: T('QUICK_UPLOAD')
    }
    picgo.saveConfig({
      'settings.shortKey': nextConfig
    })
    return true
  }
  return false
}

const migrateGalleryFromVersion230 = async (galleryDB: DBStore, picgo: PicGoCore) => {
  const originGallery = picgo.getConfig<ImgInfo[] | undefined>('uploaded')
  // if hasMigrate, we don't need to migrate
  const hasMigrate = picgo.getConfig<boolean | undefined>('__migrateUploaded') === true
  if (hasMigrate) {
    return
  }
  const configPath = picgo.configPath
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
