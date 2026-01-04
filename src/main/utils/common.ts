import fs from 'fs-extra'
import db from '~/main/apis/core/datastore'
import logger from '@core/picgo/logger'
import { clipboard, Notification, dialog } from 'electron'
import { handleUrlEncode } from '~/universal/utils/common'
import { readClipboardFilePaths } from 'clip-filepaths'
import crypto from 'node:crypto'
import picgo from '@core/picgo'

export const handleCopyUrl = (str: string): void => {
  if (db.get('settings.autoCopyUrl') !== false) {
    clipboard.writeText(str)
  }
}

/**
 * show notification
 * @param options
 */
export const showNotification = (options: IPrivateShowNotificationOption = {
  title: '',
  body: '',
  text: '',
  clickToCopy: false,
  copyContent: '',
  callback: () => {}
}) => {
  if (options.text) {
    logger.info('[PicGo Notification]', options.text)
  }

  const title = options.title || ''
  const body = options.body || options.text || ''
  const silent = picgo.getConfig('settings.notificationSound') === false
  const notification = new Notification({
    title,
    body,
    silent
    // icon: options.icon || undefined
  })
  const handleClick = () => {
    if (options.clickToCopy) {
      clipboard.writeText(options.copyContent || body)
    }
    if (options.callback) {
      options.callback()
    }
  }
  notification.once('click', handleClick)
  notification.once('close', () => {
    notification.removeListener('click', handleClick)
  })
  notification.show()
}

export const showMessageBox = (options: any) => {
  return new Promise<IShowMessageBoxResult>(async (resolve) => {
    dialog.showMessageBox(
      options
    ).then((res) => {
      resolve({
        result: res.response,
        checkboxChecked: res.checkboxChecked
      })
    })
  })
}

export const calcUploadProcessDurationRange = (duration: number) => {
  if (duration < 1000) {
    return 500
  } else if (duration < 1500) {
    return 1000
  } else if (duration < 3000) {
    return 2000
  } else if (duration < 5000) {
    return 3000
  } else if (duration < 7000) {
    return 5000
  } else if (duration < 10000) {
    return 8000
  } else if (duration < 12000) {
    return 10000
  } else if (duration < 20000) {
    return 15000
  } else if (duration < 30000) {
    return 20000
  }
  // max range
  return 100000
}

// 1 2 3 4 5 6 7 8 9 10 20 30 40 50 60 70 80 90 100 200 300 ...
export const calcUploadBigFileSizeRange = (fileSizeMB: number) => {
  if (fileSizeMB < 10) {
    // 3.2 -> 3, 3.6 -> 4
    const result = Math.round(fileSizeMB);
    return result === 0 && fileSizeMB > 0 ? 1 : result; 
  } 
  else if (fileSizeMB < 100) {
    // 13 -> 1.3 -> 1 -> 10
    // 17 -> 1.7 -> 2 -> 20
    return Math.round(fileSizeMB / 10) * 10;
  } 
  else {
    // 135 -> 1.35 -> 1 -> 100
    // 160 -> 1.60 -> 2 -> 200
    return Math.round(fileSizeMB / 100) * 100;
  }
}

// 1 2 3 4 5 6 7 8 9 10 20 30 40 50 60 70 80 90 100 200 300 ...
export const calcVideoDurationRange = (durationSec: number) => {
  if (durationSec < 10) {
    // 3.2 -> 3, 3.6 -> 4
    const result = Math.round(durationSec);
    return result === 0 && durationSec > 0 ? 1 : result; 
  } 
  else if (durationSec < 100) {
    // 13 -> 1.3 -> 1 -> 10
    // 17 -> 1.7 -> 2 -> 20
    return Math.round(durationSec / 10) * 10;
  } 
  else {
    // 135 -> 1.35 -> 1 -> 100
    // 160 -> 1.60 -> 2 -> 200
    return Math.round(durationSec / 100) * 100;
  }
}

/**
 * macOS public.file-url will get encoded file path,
 * so we need to decode it
 */
export const ensureFilePath = (filePath: string, prefix = 'file://'): string => {
  filePath = filePath.replace(prefix, '')
  if (fs.existsSync(filePath)) {
    return `${prefix}${filePath}`
  }
  filePath = decodeURIComponent(filePath)
  if (fs.existsSync(filePath)) {
    return `${prefix}${filePath}`
  }
  return ''
}

/**
 * for builtin clipboard to get image path from clipboard
 * @returns
 */
export const getClipboardFilePathList = (): string[] => {
  const { filePaths } = readClipboardFilePaths()
  return filePaths
}

export const handleUrlEncodeWithSetting = (url: string) => {
  if (db.get('settings.encodeOutputURL') === true) {
    url = handleUrlEncode(url)
  }
  return url
}

export const replaceHost = (url: string, oldHost: string, newHost: string) => {
  try {
    const parsedUrl = new URL(url)
    if (parsedUrl.host === oldHost) {
      parsedUrl.host = newHost
    }
    return parsedUrl.toString()
  } catch {
    return url
  }
}

export const getHost = (url: string = '') => {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.host
  } catch {
    return ''
  }
}

/**
 * remove protocol and suffix
 */
export const removeProtocolAndSuffix = (url: string = '') => {
  return url.replace(/^(https?:\/\/)?/, '').replace(/\/$/, '')
}

export const md5 = (str: string): string => {
  return crypto.createHash('md5').update(str).digest('hex')
}
