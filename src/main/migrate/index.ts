import DB from '#/datastore'
// from v2.1.2
const updateShortKeyFromVersion212 = (db: typeof DB, shortKeyConfig: IShortKeyConfigs | IOldShortKeyConfigs) => {
  // #557 极端情况可能会出现配置不存在，需要重新写入
  if (shortKeyConfig === undefined) {
    const defaultShortKeyConfig = {
      enable: true,
      key: 'CommandOrControl+Shift+P',
      name: 'upload',
      label: '快捷上传'
    }
    db.set('settings.shortKey[picgo:upload]', defaultShortKeyConfig)
    return true
  }
  if (shortKeyConfig.upload) {
    // @ts-ignore
    shortKeyConfig['picgo:upload'] = {
      enable: true,
      key: shortKeyConfig.upload,
      name: 'upload',
      label: '快捷上传'
    }
    delete shortKeyConfig.upload
    db.set('settings.shortKey', shortKeyConfig)
    return true
  }
  return false
}

export {
  updateShortKeyFromVersion212
}
