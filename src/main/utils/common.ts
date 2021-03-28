import db from '#/datastore'
import { clipboard, Notification } from 'electron'

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
    body: options.body
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
