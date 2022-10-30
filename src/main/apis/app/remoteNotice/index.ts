// get notice from remote
// such as some notices for users; some updates for users
import fs from 'fs-extra'
import { app, clipboard, dialog, shell } from 'electron'
import { IRemoteNoticeActionType, IRemoteNoticeTriggerCount, IRemoteNoticeTriggerHook } from '#/types/enum'
import { lte, gte } from 'semver'
import path from 'path'

import axios from 'axios'
import windowManager from '../window/windowManager'
import { showNotification } from '~/main/utils/common'
import { isDev } from '~/universal/utils/common'

// for test
const REMOTE_NOTICE_URL = isDev ? 'http://localhost:8181/remote-notice.json' : 'https://picgo-1251750343.cos.accelerate.myqcloud.com/remote-notice.yml'

const REMOTE_NOTICE_LOCAL_STORAGE_FILE = 'picgo-remote-notice.json'

const STORE_PATH = app.getPath('userData')

const REMOTE_NOTICE_LOCAL_STORAGE_PATH = path.join(STORE_PATH, REMOTE_NOTICE_LOCAL_STORAGE_FILE)

class RemoteNoticeHandler {
  private remoteNotice: IRemoteNotice | null = null
  private remoteNoticeLocalCountStorage: IRemoteNoticeLocalCountStorage | null = null

  async init () {
    this.remoteNotice = await this.getRemoteNoticeInfo()
    this.initLocalCountStorage()
  }

  private initLocalCountStorage () {
    const localCountStorage = {}
    if (!fs.existsSync(REMOTE_NOTICE_LOCAL_STORAGE_PATH)) {
      fs.writeFileSync(REMOTE_NOTICE_LOCAL_STORAGE_PATH, JSON.stringify({}))
    }
    try {
      const localCountStorage: IRemoteNoticeLocalCountStorage = fs.readJSONSync(REMOTE_NOTICE_LOCAL_STORAGE_PATH, 'utf8')
      this.remoteNoticeLocalCountStorage = localCountStorage
    } catch (e) {
      console.log(e)
      this.remoteNoticeLocalCountStorage = localCountStorage
    }
  }

  private saveLocalCountStorage (newData?: IRemoteNoticeLocalCountStorage) {
    if (newData) {
      this.remoteNoticeLocalCountStorage = newData
    }
    fs.writeFileSync(REMOTE_NOTICE_LOCAL_STORAGE_PATH, JSON.stringify(this.remoteNoticeLocalCountStorage))
  }

  private async getRemoteNoticeInfo (): Promise<IRemoteNotice | null> {
    try {
      const noticeInfo = await axios({
        method: 'get',
        url: REMOTE_NOTICE_URL,
        responseType: 'json'
      }).then(res => res.data) as IRemoteNotice
      return noticeInfo
    } catch {
      return null
    }
  }

  /**
   * if the notice is not shown or is always shown, then show the notice
   * @param action
   */
  private checkActionCount (action: IRemoteNoticeAction) {
    try {
      if (!this.remoteNoticeLocalCountStorage) {
        return true
      }
      const actionCount = this.remoteNoticeLocalCountStorage[action.id]
      if (actionCount === undefined) {
        if (action.triggerCount === IRemoteNoticeTriggerCount.ALWAYS) {
          this.remoteNoticeLocalCountStorage[action.id] = 1 // if always, count number
        } else {
          this.remoteNoticeLocalCountStorage[action.id] = true
        }
        return true
      } else {
        // here is the count of action
        // if not always show, then can't show
        if (action.triggerCount !== IRemoteNoticeTriggerCount.ALWAYS) {
          return false
        } else {
          const preCount = this.remoteNoticeLocalCountStorage[action.id]
          if (typeof preCount !== 'number') {
            this.remoteNoticeLocalCountStorage[action.id] = true
            return true
          } else {
            this.remoteNoticeLocalCountStorage[action.id] = preCount + 1
          }
          return true
        }
      }
    } finally {
      this.saveLocalCountStorage()
    }
  }

  private async doActions (actions: IRemoteNoticeAction[]) {
    for (const action of actions) {
      if (this.checkActionCount(action)) {
        switch (action.type) {
          case IRemoteNoticeActionType.SHOW_DIALOG: {
          // SHOW DIALOG
            const currentWindow = windowManager.getAvailableWindow()
            dialog.showOpenDialog(currentWindow, action.data?.options)
            break
          }
          case IRemoteNoticeActionType.SHOW_NOTICE:
            showNotification({
              title: action.data?.title || '',
              body: action.data?.content || '',
              clickToCopy: !!action.data?.copyToClipboard,
              copyContent: action.data?.copyToClipboard || '',
              clickFn () {
                if (action.data?.url) {
                  shell.openExternal(action.data.url)
                }
              }
            })
            break
          case IRemoteNoticeActionType.OPEN_URL:
          // OPEN URL
            shell.openExternal(action.data?.url || '')
            break
          case IRemoteNoticeActionType.COMMON:
          // DO COMMON CASE
            if (action.data?.copyToClipboard) {
              clipboard.writeText(action.data.copyToClipboard)
            }
            if (action.data?.url) {
              shell.openExternal(action.data.url)
            }
            break
          case IRemoteNoticeActionType.SHOW_MESSAGE_BOX: {
            const currentWindow = windowManager.getAvailableWindow()
            dialog.showMessageBox(currentWindow, {
              title: action.data?.title || '',
              message: action.data?.content || '',
              type: 'info',
              buttons: action.data?.buttons?.map(item => item.label) || ['Yes']
            }).then(res => {
              const button = action.data?.buttons?.[res.response]
              if (button?.type === 'cancel') {
              // do nothing
              } else {
                if (button?.action) {
                  this.doActions([button?.action])
                }
              }
            })
            break
          }
        }
      }
    }
  }

  triggerHook (hook: IRemoteNoticeTriggerHook) {
    if (!this.remoteNotice || !this.remoteNotice.list) {
      return
    }
    const actions = this.remoteNotice.list
      .filter(item => {
        if (item.versionMatch) {
          switch (item.versionMatch) {
            case 'exact':
              return item.versions.includes(app.getVersion())
            case 'gte':
              return item.versions.some(version => {
                // appVersion >= version
                return gte(app.getVersion(), version)
              })
            case 'lte':
              return item.versions.some(version => {
                // appVersion <= version
                return lte(app.getVersion(), version)
              })
          }
        }
        return item.versions.includes(app.getVersion())
      })
      .map(item => item.actions)
      .reduce((pre, cur) => pre.concat(cur), [])
      .filter(item => item.hooks.includes(hook))
    this.doActions(actions)
  }
}

const remoteNoticeHandler = new RemoteNoticeHandler()

export {
  remoteNoticeHandler
}
