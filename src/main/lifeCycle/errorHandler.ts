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
  let log = `${dayjs().format('YYYY-MM-DD HH:mm:ss')} [PicGo ERROR] startup error`
  if (error?.stack) {
    log += `\n------Error Stack Begin------\n${util.format(error.stack)}\n-------Error Stack End-------\n`
  } else {
    const msg = JSON.stringify(error)
    log += `${msg}\n`
  }
  fse.appendFileSync(LOG_PATH, log)
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
