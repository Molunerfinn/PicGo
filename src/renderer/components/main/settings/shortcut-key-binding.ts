import { parseShortcutKeys } from './utils'

const modifierCodes = new Set([
  'ShiftLeft',
  'ShiftRight',
  'ControlLeft',
  'ControlRight',
  'AltLeft',
  'AltRight',
  'MetaLeft',
  'MetaRight',
])

const keyTokenMap: Record<string, string> = {
  ' ': 'Space',
  Enter: 'Return',
  NumpadEnter: 'Return',
  Escape: 'Esc',
  Esc: 'Esc',
  Backspace: 'Backspace',
  Tab: 'Tab',
  CapsLock: 'Capslock',
  NumLock: 'Numlock',
  ScrollLock: 'Scrolllock',
  Delete: 'Delete',
  Insert: 'Insert',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
  PrintScreen: 'PrintScreen',
  Minus: '-',
  Equal: 'Plus',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
  Backquote: '`',
  MediaPlayPause: 'MediaPlayPause',
  MediaStop: 'MediaStop',
  MediaTrackNext: 'MediaNextTrack',
  MediaTrackPrevious: 'MediaPreviousTrack',
  AudioVolumeUp: 'VolumeUp',
  AudioVolumeDown: 'VolumeDown',
  AudioVolumeMute: 'VolumeMute',
}

const keyAliasMap: Record<string, string> = {
  Shift: 'Shift',
  Control: 'Ctrl',
  Ctrl: 'Ctrl',
  Meta: 'Command',
  Alt: 'Alt',
}

function normalizeSingleCharacterToken(key: string) {
  if (key.length !== 1) {
    return null
  }

  const char = key.toUpperCase()
  return char === '+' ? 'Plus' : char
}

function resolveMainKey(event: KeyboardEvent) {
  if (modifierCodes.has(event.code)) {
    return null
  }

  if (event.code.startsWith('Key')) {
    return event.code.slice(3).toUpperCase()
  }

  if (event.code.startsWith('Digit')) {
    return event.code.slice(5)
  }

  if (event.code.startsWith('Numpad')) {
    const numpadToken = event.code.slice(6)
    if (/^\d$/.test(numpadToken)) {
      return `num${numpadToken}`
    }

    if (numpadToken === 'Decimal') {
      return 'numdec'
    }

    if (numpadToken === 'Add') {
      return 'numadd'
    }

    if (numpadToken === 'Subtract') {
      return 'numsub'
    }

    if (numpadToken === 'Multiply') {
      return 'nummult'
    }

    if (numpadToken === 'Divide') {
      return 'numdiv'
    }

    return null
  }

  if (/^F\d{1,2}$/.test(event.code)) {
    return event.code
  }

  const mappedByCode = keyTokenMap[event.code]
  if (mappedByCode) {
    return mappedByCode
  }

  const normalizedSingleChar = normalizeSingleCharacterToken(event.key)
  if (normalizedSingleChar) {
    return normalizedSingleChar
  }

  const mappedByKey = keyTokenMap[event.key]
  if (mappedByKey) {
    return mappedByKey
  }

  const aliasKey = keyAliasMap[event.key]
  if (aliasKey) {
    return aliasKey
  }

  return event.key
}

export function buildShortcutFromKeyboardEvent(event: KeyboardEvent) {
  const keys: string[] = []

  if (event.metaKey) {
    keys.push('Command')
  }

  if (event.ctrlKey) {
    keys.push('Ctrl')
  }

  if (event.shiftKey) {
    keys.push('Shift')
  }

  if (event.altKey) {
    keys.push('Alt')
  }

  const mainKey = resolveMainKey(event)
  if (mainKey && !keys.includes(mainKey)) {
    keys.push(mainKey)
  }

  if (keys.length <= 4) {
    return keys
  }

  if (mainKey && keys.includes(mainKey)) {
    const modifiers = keys.filter((key) => key !== mainKey).slice(0, 3)
    return [...modifiers, mainKey]
  }

  return keys.slice(0, 4)
}

export function formatShortcutTokenForDisplay(token: string) {
  if (token === 'CommandOrControl' || token === 'CommandOrCtrl' || token === 'CmdOrCtrl') {
    return 'CommandOrCtrl'
  }

  if (token === 'Control') {
    return 'Ctrl'
  }

  return token
}

export function formatShortcutValueForDisplay(value: string) {
  return parseShortcutKeys(value).map(formatShortcutTokenForDisplay)
}
