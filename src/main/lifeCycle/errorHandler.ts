import fse from 'fs-extra'
import path from 'path'
import dayjs from 'dayjs'
import util from 'util'
import { dbPathDir } from 'apis/core/datastore/dbChecker'
const STORE_PATH = dbPathDir()
const LOG_PATH = path.join(STORE_PATH, '/picgo.log')

// since the error may occur in picgo-core
// so we can't use the log from picgo
export const loggerWriter = (error: Error) => {
  try {
    const time = dayjs().format('YYYY-MM-DD HH:mm:ss')
    let log = `${time} [PicGo ERROR] process error begin`
    if (error?.stack) {
      log += `\n------Error Stack Begin------\n${util.format(error.stack)}\n-------Error Stack End-------\n`
    } else {
      const msg = JSON.stringify(error)
      log += `${msg}\n`
    }
    log += `${time} [PicGo ERROR] process error end`
    if (!fse.existsSync(LOG_PATH)) {
      fse.ensureFileSync(LOG_PATH)
    }
    fse.appendFileSync(LOG_PATH, log)
  } catch (e) {
    console.error(e)
  }
}

const handleProcessError = (error: Error) => {
  console.error(error)
  loggerWriter(error)
}

process.on('uncaughtException', error => {
  handleProcessError(error)
})

process.on('unhandledRejection', (error: any) => {
  handleProcessError(error)
})
