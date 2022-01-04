import db from '~/main/apis/core/datastore'
import { clipboard, Notification, dialog } from 'electron'

export const handleCopyUrl = (str: string): void => {
  if (db.get('settings.autoCopy') !== false) {
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
  clickToCopy: false
}) => {
  const notification = new Notification({
    title: options.title,
    body: options.body,
    icon: options.icon || undefined
  })
  const handleClick = () => {
    if (options.clickToCopy) {
      clipboard.writeText(options.body)
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

export const calcDurationRange = (duration: number) => {
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
