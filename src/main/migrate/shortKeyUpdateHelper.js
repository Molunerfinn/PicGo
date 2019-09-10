// from v2.1.2
const updateShortKeyFromVersion212 = (db, shortKeyConfig) => {
  let needUpgrade = false
  Object.keys(shortKeyConfig).forEach(item => {
    if (typeof shortKeyConfig[item] === 'string') {
      needUpgrade = true
      shortKeyConfig[item] = {
        enable: true,
        key: shortKeyConfig[item],
        name: `picgo:${item}`,
        lable: '快捷上传'
      }
    }
  })
  if (needUpgrade) {
    db.read().set('settings.shortKey', shortKeyConfig).write()
    return shortKeyConfig
  } else {
    return false
  }
}

export {
  updateShortKeyFromVersion212
}
