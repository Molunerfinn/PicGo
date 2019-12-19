import DB from '#/datastore'
// from v2.1.2
const updateShortKeyFromVersion212 = (db: typeof DB, shortKeyConfig: ShortKeyConfigs | OldShortKeyConfigs) => {
  let needUpgrade = false
  if (shortKeyConfig.upload) {
    needUpgrade = true
    // @ts-ignore
    shortKeyConfig['picgo:upload'] = {
      enable: true,
      key: shortKeyConfig.upload,
      name: 'picgo:upload',
      label: '快捷上传'
    }
    delete shortKeyConfig.upload
  }
  if (needUpgrade) {
    db.set('settings.shortKey', shortKeyConfig)
    return shortKeyConfig
  } else {
    return false
  }
}

export {
  updateShortKeyFromVersion212
}
