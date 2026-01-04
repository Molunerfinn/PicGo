import { ipcRenderer } from 'electron'
import { v4 as uuid } from 'uuid'
import { sendRPC } from './dataSender'
import { PICGO_NOTIFICATION_CLICKED } from '~/universal/events/constants'
import { IRPCActionType } from '~/universal/types/enum'

const notificationCallbacks = new Map<string, () => void>()
const MAX_CALLBACK_LIMIT = 10

const handleNotificationClick = (_event: Electron.IpcRendererEvent, id: string) => {
  const callback = notificationCallbacks.get(id)
  if (!callback) return
  try {
    callback()
  } finally {
    notificationCallbacks.delete(id)
  }
}

// HMR Protection: Remove existing listener before adding a new one
ipcRenderer.removeAllListeners(PICGO_NOTIFICATION_CLICKED)
ipcRenderer.on(PICGO_NOTIFICATION_CLICKED, handleNotificationClick)

interface NotificationOptions {
  title: string
  body: string
  callback?: () => void
}

export const showNotification = (options: NotificationOptions) => {
  const id = uuid()

  if (options.callback) {
    if (notificationCallbacks.size >= MAX_CALLBACK_LIMIT) {
      const oldestId = notificationCallbacks.keys().next().value
      if (oldestId) {
        notificationCallbacks.delete(oldestId)
      }
    }
    notificationCallbacks.set(id, options.callback)
  }

  sendRPC(IRPCActionType.SHOW_NOTIFICATION, options.title, options.body, id)
}
