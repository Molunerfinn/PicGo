import chalk from 'chalk'
import dayjs from 'dayjs'
import fs from 'fs-extra'
import path from 'path'
import util from 'util'
import db from '#/datastore'
import { app } from 'electron'
import { IChalkType } from '#/types/enum'
const baseDir = app.getPath('userData')

class Logger {
  private level = {
    success: IChalkType.success,
    info: IChalkType.info,
    warn: IChalkType.warn,
    error: IChalkType.error
  }
  protected handleLog (type: ILogType, msg: ILoggerType): ILoggerType {
    // if configPath is invalid then this.ctx.config === undefined
    // if not then check config.silent
    const log = chalk[this.level[type]](`[PicGo ${type.toUpperCase()}]:`)
    console.log(log, msg)
    process.nextTick(() => {
      this.handleWriteLog(type, msg)
    })
    return msg
  }

  protected handleWriteLog (type: string, msg: ILoggerType): void {
    try {
      const logLevel = db.get('settings.logLevel')
      const logPath = db.get('settings.logPath') || path.join(baseDir, './picgo.log')
      if (this.checkLogLevel(type, logLevel)) {
        const picgoLog = fs.createWriteStream(logPath, { flags: 'a', encoding: 'utf8' })
        let log = `${dayjs().format('YYYY-MM-DD HH:mm:ss')} [PicGo ${type.toUpperCase()}] ${msg}`
        const logger = new console.Console(picgoLog)
        if (typeof msg === 'object' && type === 'error') {
          log += `\n------Error Stack Begin------\n${util.format(msg.stack)}\n-------Error Stack End-------`
        }
        logger.log(log)
        picgoLog.destroy()
      }
    } catch (e) {
      console.log(e)
    }
  }

  protected checkLogLevel (type: string, level: undefined | string | string[]): boolean {
    if (level === undefined || level === 'all') {
      return true
    }
    if (Array.isArray(level)) {
      return level.some((item: string) => (item === type || item === 'all'))
    } else {
      return type === level
    }
  }

  success (msg: ILoggerType): ILoggerType {
    return this.handleLog('success', msg)
  }

  info (msg: ILoggerType): ILoggerType {
    return this.handleLog('info', msg)
  }

  error (msg: ILoggerType): ILoggerType {
    return this.handleLog('error', msg)
  }

  warn (msg: ILoggerType): ILoggerType {
    return this.handleLog('warn', msg)
  }
}

export default new Logger()
