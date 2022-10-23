import fs from 'fs-extra'
import dayjs from 'dayjs'
import util from 'util'

const checkLogFileIsLarge = (logPath: string): {
  isLarge: boolean
  logFileSize?: number
  logFileSizeLimit?: number
} => {
  try {
    if (fs.existsSync(logPath)) {
      const logFileSize = fs.statSync(logPath).size
      const logFileSizeLimit = 10 * 1024 * 1024 // 10 MB default
      return {
        isLarge: logFileSize > logFileSizeLimit,
        logFileSize,
        logFileSizeLimit
      }
    }
    return {
      isLarge: false
    }
  } catch (e) {
    // why throw error???
    console.log(e)
    return {
      isLarge: true
    }
  }
}

const recreateLogFile = (logPath: string): void => {
  try {
    if (fs.existsSync(logPath)) {
      fs.unlinkSync(logPath)
      fs.createFileSync(logPath)
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * for local log before picgo inited
 */
const getLogger = (logPath: string) => {
  let hasUncathcedError = false
  try {
    if (!fs.existsSync(logPath)) {
      fs.ensureFileSync(logPath)
    }
    if (checkLogFileIsLarge(logPath).isLarge) {
      recreateLogFile(logPath)
    }
  } catch (e) {
    console.log(e)
    hasUncathcedError = true
  }
  return (type: string, ...msg: any[]) => {
    if (hasUncathcedError) {
      if (checkLogFileIsLarge(logPath).isLarge) {
        recreateLogFile(logPath)
      }
      return
    }
    try {
      let log = `${dayjs().format('YYYY-MM-DD HH:mm:ss')} [PicGo ${type.toUpperCase()}] `
      msg.forEach((item: ILogArgvTypeWithError) => {
        if (typeof item === 'object' && type === 'error') {
          log += `\n------Error Stack Begin------\n${util.format(item.stack)}\n-------Error Stack End------- `
        } else {
          if (typeof item === 'object') {
            item = JSON.stringify(item)
          }
          log += `${item} `
        }
      })
      log += '\n'
      console.log(log)
      // A synchronized approach to avoid log msg sequence errors
      if (checkLogFileIsLarge(logPath).isLarge) {
        recreateLogFile(logPath)
      }
      if (!hasUncathcedError) {
        fs.appendFileSync(logPath, log)
      }
    } catch (e) {
      console.log(e)
      hasUncathcedError = true
    }
  }
}

export {
  getLogger
}
