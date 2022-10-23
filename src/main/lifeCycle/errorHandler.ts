import path from 'path'
import { app } from 'electron'
import { getLogger } from 'apis/core/utils/localLogger'
const STORE_PATH = app.getPath('userData')
const LOG_PATH = path.join(STORE_PATH, 'picgo-gui-local.log')

const logger = getLogger(LOG_PATH)

// since the error may occur in picgo-core
// so we can't use the log from picgo

const handleProcessError = (error: Error) => {
  logger('error', error)
}

process.on('uncaughtException', error => {
  handleProcessError(error)
})

process.on('unhandledRejection', (error: any) => {
  handleProcessError(error)
})
