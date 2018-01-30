import keycode from 'keycode'

const isSpecialKey = (keyCode) => {
  const keyArr = [
    16, // Shift
    17, // Ctrl
    18, // Alt
    91, // Left Meta
    93 // Right Meta
  ]

  return keyArr.includes(keyCode)
}

const keyDetect = (event) => {
  const meta = process.platform === 'darwin' ? 'Cmd' : 'Super'
  let specialKey = {
    Ctrl: event.ctrlKey,
    Shift: event.shiftKey,
    Alt: event.altKey
  }
  specialKey[meta] = event.metaKey

  let pressKey = []

  for (let i in specialKey) {
    if (specialKey[i]) {
      pressKey.push(i)
    }
  }

  if (!isSpecialKey(event.keyCode)) {
    pressKey.push(keycode(event.keyCode).toUpperCase())
  }
  return pressKey
}

export default keyDetect
