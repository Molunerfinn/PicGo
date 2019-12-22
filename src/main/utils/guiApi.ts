import {
  dialog,
  BrowserWindow,
  clipboard,
  Notification,
  WebContents,
  ipcMain
} from 'electron'
import db from '#/datastore'
import Uploader from './uploader'
import pasteTemplate from '#/utils/pasteTemplate'
const WEBCONTENTS = Symbol('WEBCONTENTS')

class GuiApi implements IGuiApi {
  private [WEBCONTENTS]: WebContents
  constructor (webcontents: WebContents) {
    this[WEBCONTENTS] = webcontents
  }

  private async showSettingWindow () {
    const settingWindow = BrowserWindow.fromWebContents(this[WEBCONTENTS])
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

  async showInputBox (options: IShowInputBoxOption = {
    title: '',
    placeholder: ''
  }) {
    await this.showSettingWindow()
    this[WEBCONTENTS].send('showInputBox', options)
    return new Promise<string>((resolve, reject) => {
      ipcMain.once('showInputBox', (event: Event, value: string) => {
        resolve(value)
      })
    })
  }

  showFileExplorer (options: IShowFileExplorerOption = {}) {
    return new Promise<string>((resolve, reject) => {
      dialog.showOpenDialog(BrowserWindow.fromWebContents(this[WEBCONTENTS]), options, (filename: string) => {
        resolve(filename)
      })
    })
  }

  async upload (input: IUploadOption) {
    const imgs = await new Uploader(input, this[WEBCONTENTS]).upload()
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
      clipboard.writeText(pasteText)
      this[WEBCONTENTS].send('uploadFiles', imgs)
      this[WEBCONTENTS].send('updateGallery')
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
    return new Promise<IShowMessageBoxResult>((resolve, reject) => {
      dialog.showMessageBox(
        BrowserWindow.fromWebContents(this[WEBCONTENTS]),
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
