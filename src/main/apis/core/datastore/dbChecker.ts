import fs from 'fs-extra'
import path from 'path'
import { remote, app } from 'electron'
import dayjs from 'dayjs'
import { getLogger } from '@core/utils/localLogger'
const APP = process.type === 'renderer' ? remote.app : app
const STORE_PATH = APP.getPath('userData')
const configFilePath = path.join(STORE_PATH, 'data.json')
const configFileBackupPath = path.join(STORE_PATH, 'data.bak.json')
export const defaultConfigPath = configFilePath
let _configFilePath = ''
let hasCheckPath = false

const errorMsg = {
  broken: 'PicGo 配置文件损坏，已经恢复为默认配置',
  brokenButBackup: 'PicGo 配置文件损坏，已经恢复为备份配置'
}

/** ensure notification list */
if (!global.notificationList) global.notificationList = []

function dbChecker () {
  if (process.type !== 'renderer') {
    // db save bak
    try {
      const { dbPath, dbBackupPath } = getGalleryDBPath()
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, dbBackupPath)
      }
    } catch (e) {
      console.error(e)
    }

    const configFilePath = dbPathChecker()
    if (!fs.existsSync(configFilePath)) {
      return
    }
    let configFile: string = '{}'
    let optionsTpl = {
      title: '注意',
      body: ''
    }
    // config save bak
    try {
      configFile = fs.readFileSync(configFilePath, { encoding: 'utf-8' })
      JSON.parse(configFile)
    } catch (e) {
      fs.unlinkSync(configFilePath)
      if (fs.existsSync(configFileBackupPath)) {
        try {
          configFile = fs.readFileSync(configFileBackupPath, { encoding: 'utf-8' })
          JSON.parse(configFile)
          fs.writeFileSync(configFilePath, configFile, { encoding: 'utf-8' })
          const stats = fs.statSync(configFileBackupPath)
          optionsTpl.body = `${errorMsg.brokenButBackup}\n备份文件版本：${dayjs(stats.mtime).format('YYYY-MM-DD HH:mm:ss')}`
          global.notificationList?.push(optionsTpl)
          return
        } catch (e) {
          optionsTpl.body = errorMsg.broken
          global.notificationList?.push(optionsTpl)
          return
        }
      }
      optionsTpl.body = errorMsg.broken
      global.notificationList?.push(optionsTpl)
      return
    }
    fs.writeFileSync(configFileBackupPath, configFile, { encoding: 'utf-8' })
  }
}

/**
 * Get config path
 */
function dbPathChecker (): string {
  if (_configFilePath) {
    return _configFilePath
  }
  // defaultConfigPath
  _configFilePath = defaultConfigPath
  // if defaultConfig path is not exit
  // do not parse the content of config
  if (!fs.existsSync(defaultConfigPath)) {
    return _configFilePath
  }
  try {
    const configString = fs.readFileSync(defaultConfigPath, { encoding: 'utf-8' })
    const config = JSON.parse(configString)
    const userConfigPath: string = config.configPath || ''
    if (userConfigPath) {
      if (fs.existsSync(userConfigPath) && userConfigPath.endsWith('.json')) {
        _configFilePath = userConfigPath
        return _configFilePath
      }
    }
    return _configFilePath
  } catch (e) {
    const picgoLogPath = path.join(defaultConfigPath, 'picgo.log')
    const logger = getLogger(picgoLogPath)
    if (!hasCheckPath) {
      let optionsTpl = {
        title: '注意',
        body: '自定义文件解析出错，请检查路径内容是否正确'
      }
      global.notificationList?.push(optionsTpl)
      hasCheckPath = true
    }
    logger('error', e)
    console.error(e)
    _configFilePath = defaultConfigPath
    return _configFilePath
  }
}

function dbPathDir () {
  return path.dirname(dbPathChecker())
}

function getGalleryDBPath (): {
  dbPath: string
  dbBackupPath: string
} {
  const configPath = dbPathChecker()
  const dbPath = path.join(path.dirname(configPath), 'picgo.db')
  const dbBackupPath = path.join(path.dirname(dbPath), 'picgo.bak.db')
  return {
    dbPath,
    dbBackupPath
  }
}

export {
  dbChecker,
  dbPathChecker,
  dbPathDir,
  getGalleryDBPath
}
