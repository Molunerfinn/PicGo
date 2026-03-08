import fs from 'fs-extra'
import path from 'path'
import { STORE_PATH } from '~/main/utils/env'

interface IMainWindowState {
  width: number
  height: number
  isMaximized: boolean
}

const DEFAULT_MAIN_WINDOW_STATE: IMainWindowState = {
  width: 800,
  height: 450,
  isMaximized: false
}

interface IWindowStateStorage {
  mainWindow: IMainWindowState
}

const WINDOW_STATE_PATH = path.join(STORE_PATH, 'window-state.json')

function normalizeMainWindowState (value: unknown): IMainWindowState {
  if (!value || typeof value !== 'object') {
    return DEFAULT_MAIN_WINDOW_STATE
  }

  const {
    width,
    height,
    isMaximized
  } = value as Partial<IMainWindowState>

  return {
    width: typeof width === 'number' && width >= DEFAULT_MAIN_WINDOW_STATE.width
      ? width
      : DEFAULT_MAIN_WINDOW_STATE.width,
    height: typeof height === 'number' && height >= DEFAULT_MAIN_WINDOW_STATE.height
      ? height
      : DEFAULT_MAIN_WINDOW_STATE.height,
    isMaximized: isMaximized === true
  }
}

function normalizeWindowStateStorage (value: unknown): IWindowStateStorage {
  if (!value || typeof value !== 'object') {
    return {
      mainWindow: DEFAULT_MAIN_WINDOW_STATE
    }
  }

  const mainWindow = 'mainWindow' in value
    ? (value as { mainWindow?: unknown }).mainWindow
    : undefined

  return {
    mainWindow: normalizeMainWindowState(mainWindow)
  }
}

function readWindowStateStorage (): IWindowStateStorage {
  try {
    if (fs.existsSync(WINDOW_STATE_PATH)) {
      const raw = fs.readFileSync(WINDOW_STATE_PATH, 'utf8')
      return normalizeWindowStateStorage(JSON.parse(raw))
    }
  } catch (error) {
    console.error(error)
  }

  return {
    mainWindow: DEFAULT_MAIN_WINDOW_STATE
  }
}

export function getMainWindowState (): IMainWindowState {
  return readWindowStateStorage().mainWindow
}

export function saveMainWindowState (state: IMainWindowState): void {
  try {
    const currentState = readWindowStateStorage()

    fs.writeJsonSync(WINDOW_STATE_PATH, {
      ...currentState,
      mainWindow: normalizeMainWindowState(state)
    })
  } catch (error) {
    console.error(error)
  }
}
