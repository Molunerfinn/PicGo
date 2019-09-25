import bus from './eventBus'
let isInModifiedMode = false // 修改快捷键模式
bus.on('toggleShortKeyModifiedMode', flag => {
  isInModifiedMode = flag
})
/**
 *
 * @param {string} name
 */
const shortKeyHandler = (name) => {
  if (isInModifiedMode) {
    return
  }
  if (name.includes('picgo:')) {
    bus.emit(name)
  } else if (name.includes('picgo-plugin-')) {
    // TODO: 处理插件快捷键
  }
}

/**
 * 用于更新快捷键绑定
 * @param {globalShortcut} globalShortcut
 * @param {keyObject} item
 * @param {string} oldKey
 */
const shortKeyUpdater = (globalShortcut, item, oldKey) => {
  // 如果提供了旧key，则解绑
  if (oldKey) {
    globalShortcut.unregister(oldKey)
  }
  if (item.enable === false) {
    globalShortcut.unregister(item.key)
  } else {
    globalShortcut.register(item.key, () => {
      shortKeyHandler(item.name)
    })
  }
}

// 初始化阶段的注册
const initShortKeyRegister = (globalShortcut, shortKeys) => {
  let errorList = []
  for (let i in shortKeys) {
    try {
      if (shortKeys[i].enable) {
        globalShortcut.register(shortKeys[i].key, () => {
          shortKeyHandler(shortKeys[i].name)
        })
      }
    } catch (e) {
      errorList.push(shortKeys[i])
    }
  }
}

export {
  shortKeyUpdater,
  initShortKeyRegister
}
