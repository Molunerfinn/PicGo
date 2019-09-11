import bus from '../utils/eventBus'
/**
 *
 * @param {string} name
 */
const shortKeyHandler = (name) => {
  if (name.includes('picgo:')) {
    bus.emit(name)
  } else if (name.includes('picgo-plugin-')) {
    // TODO: 处理插件快捷键
  }
}

const shortKeyUpdater = (globalShortcut, item) => {
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
