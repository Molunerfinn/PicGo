import {
  dialog,
  BrowserWindow,
  Notification,
  ipcMain
} from 'electron'
import db from '#/datastore'
import uploader from 'apis/app/uploader'
import pasteTemplate from '#/utils/pasteTemplate'
import { handleCopyUrl } from '~/main/utils/common'
import {
  getWindowId,
  getSettingWindowId
} from '@core/bus/apis'
import {
  SHOW_INPUT_BOX
} from '~/universal/events/constants'

// Cross-process support may be required in the future
class GuiApi implements IGuiApi {
  private windowId: number = -1
  private settingWindowId: number = -1
  private async showSettingWindow () {
    this.settingWindowId = await getSettingWindowId()
    const settingWindow = BrowserWindow.fromId(this.settingWindowId)
    if (settingWindow.isVisible()) {
      return true
    }
    settingWindow.show()
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve()
      }, 1000) // TODO: a better way to wait page loaded.
    })
  }

  private getWebcontentsByWindowId (id: number) {
    return BrowserWindow.fromId(id).webContents
  }

  async showInputBox (options: IShowInputBoxOption = {
    title: '',
    placeholder: ''
  }) {
    await this.showSettingWindow()
    this.getWebcontentsByWindowId(this.settingWindowId)
      .send(SHOW_INPUT_BOX, options)
    return new Promise<string>((resolve, reject) => {
      ipcMain.once(SHOW_INPUT_BOX, (event: Event, value: string) => {
        resolve(value)
      })
    })
  }

  showFileExplorer (options: IShowFileExplorerOption = {}) {
    return new Promise<string>(async (resolve, reject) => {
      this.windowId = await getWindowId()
      dialog.showOpenDialog(BrowserWindow.fromId(this.windowId), options, (filename: string) => {
        resolve(filename)
      })
    })
  }

  async upload (input: IUploadOption) {
    this.windowId = await getWindowId()
    const webContents = this.getWebcontentsByWindowId(this.windowId)
    const imgs = await uploader.setWebContents(webContents).upload(input)
    if (imgs !== false) {
      const pasteStyle = db.get('settings.pasteStyle') || 'markdown'
      let pasteText = ''
      for (let i = 0; i < imgs.length; i++) {
        pasteText += pasteTemplate(pasteStyle, imgs[i]) + '\r\n'
        const notification = new Notification({
          title: '上传成功',
          body: imgs[i].imgUrl as string,
          icon: imgs[i].imgUrl
        })
        setTimeout(() => {
          notification.show()
        }, i * 100)
        db.insert('uploaded', imgs[i])
      }
      handleCopyUrl(pasteText)
      webContents.send('uploadFiles', imgs)
      webContents.send('updateGallery')
      return imgs
    }
    return []
  }

  showNotification (options: IShowNotificationOption = {
    title: '',
    body: ''
  }) {
    const notification = new Notification({
      title: options.title,
      body: options.body
    })
    notification.show()
  }

  showMessageBox (options: IShowMessageBoxOption = {
    title: '',
    message: '',
    type: 'info',
    buttons: ['Yes', 'No']
  }) {
    return new Promise<IShowMessageBoxResult>(async (resolve, reject) => {
      this.windowId = await getWindowId()
      dialog.showMessageBox(
        BrowserWindow.fromId(this.windowId),
        options
      ).then((res) => {
        resolve({
          result: res.response,
          checkboxChecked: res.checkboxChecked
        })
      })
    })
  }
}

export default GuiApi
