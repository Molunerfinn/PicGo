import { contextBridge, webUtils } from 'electron'

const getFilePath = (file: File): string => webUtils.getPathForFile(file)

const electronApi = {
  getFilePath
}

contextBridge.exposeInMainWorld('electronApi', electronApi)

export type ElectronApi = typeof electronApi
