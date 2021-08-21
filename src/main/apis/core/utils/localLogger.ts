import fs from 'fs-extra'
import dayjs from 'dayjs'
import util from 'util'

/**
 * for local log before picgo inited
 */
const getLogger = (logPath: string) => {
  if (!fs.existsSync(logPath)) {
    fs.ensureFileSync(logPath)
  }
  return (type: string, ...msg: any[]) => {
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
    // A synchronized approach to avoid log msg sequence errors
    fs.appendFileSync(logPath, log)
  }
}

export {
  getLogger
}
