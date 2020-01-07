import {
  BrowserWindow
} from 'electron'
import {
  IWindowList
} from '~/main/apis/window/constants'

declare interface IWindowListItem {
  isValid: boolean
  multiple: boolean
  options: () => IBrowserWindowOptions,
  callback: (window: BrowserWindow | null) => void
}

declare interface IWindowManager {
  create: (name: IWindowList) => BrowserWindow | null
  get: (name: IWindowList) => BrowserWindow | null
  delete: (name: IWindowList) => void
  getAvailableWindow: () => BrowserWindow
}
