// from v2.1.2
const updateShortKeyFromVersion212 = (db, shortKeyConfig) => {
  let needUpgrade = false
  if (shortKeyConfig.upload) {
    needUpgrade = true
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
