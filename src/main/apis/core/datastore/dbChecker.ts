import fs from 'fs-extra'
import path from 'path'
import { remote, app } from 'electron'
import dayjs from 'dayjs'
const APP = process.type === 'renderer' ? remote.app : app
const STORE_PATH = APP.getPath('userData')
const configFilePath = path.join(STORE_PATH, 'data.json')
const configFileBackupPath = path.join(STORE_PATH, 'data.bak.json')

const errorMsg = {
  broken: 'PicGo 配置文件损坏，已经恢复为默认配置',
  brokenButBackup: 'PicGo 配置文件损坏，已经恢复为备份配置'
}

function dbChecker () {
  if (process.type !== 'renderer') {
    if (!global.notificationList) global.notificationList = []
    if (!fs.existsSync(configFilePath)) {
      return
    }
    let configFile: string = '{}'
    let optionsTpl = {
      title: '注意',
      body: ''
    }
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
          global.notificationList.push(optionsTpl)
          return
        } catch (e) {
          optionsTpl.body = errorMsg.broken
          global.notificationList.push(optionsTpl)
          return
        }
      }
      optionsTpl.body = errorMsg.broken
      global.notificationList.push(optionsTpl)
      return
    }
    fs.writeFileSync(configFileBackupPath, configFile, { encoding: 'utf-8' })
  }
}

/**
 * Get config path
 */
function dbPathChecker (): string {
  const defaultConfigPath = configFilePath
  if (process.type !== 'renderer') {
    // if defaultConfig path is not exit
    // do not parse the content of config
    if (!fs.existsSync(defaultConfigPath)) {
      return defaultConfigPath
    }
    try {
      const configString = fs.readFileSync(configFilePath, { encoding: 'utf-8' })
      const config = JSON.parse(configString)
      const userConfigPath: string = config.configPath || ''
      if (userConfigPath) {
        if (fs.existsSync(userConfigPath) && userConfigPath.endsWith('.json')) {
          return userConfigPath
        }
      }
      return defaultConfigPath
    } catch (e) {
      // TODO: local logger is needed
      console.error(e)
      return defaultConfigPath
    }
  }
  return defaultConfigPath
}

export const defaultConfigPath = configFilePath

export {
  dbChecker,
  dbPathChecker
}
