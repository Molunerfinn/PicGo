import {
  dialog,
  BrowserWindow,
  clipboard,
  Notification,
  IpcMain,
  WebContents
} from 'electron'
import db from '#/datastore'
import Uploader from './uploader'
import pasteTemplate from '#/utils/pasteTemplate'
import PicGoCore from '~/universal/types/picgo'
const WEBCONTENTS = Symbol('WEBCONTENTS')
const IPCMAIN = Symbol('IPCMAIN')
const PICGO = Symbol('PICGO')

class GuiApi {
  private [WEBCONTENTS]: WebContents
  private [IPCMAIN]: IpcMain
  private [PICGO]: PicGoCore
  constructor (ipcMain: IpcMain, webcontents: WebContents, picgo: PicGoCore) {
    this[WEBCONTENTS] = webcontents
    this[IPCMAIN] = ipcMain
    this[PICGO] = picgo
  }

  /**
   * for plugin showInputBox
   * @param {object} options
   * return type is string or ''
   */
  showInputBox (options: IShowInputBoxOption) {
    if (options === undefined) {
      options = {
        title: '',
        placeholder: ''
      }
    }
    this[WEBCONTENTS].send('showInputBox', options)
    return new Promise((resolve, reject) => {
      this[IPCMAIN].once('showInputBox', (event: Event, value: string) => {
        resolve(value)
      })
    })
  }

  /**
   * for plugin show file explorer
   * @param {object} options
   */
  showFileExplorer (options: {}) {
    if (options === undefined) {
      options = {}
    }
    return new Promise((resolve, reject) => {
      dialog.showOpenDialog(BrowserWindow.fromWebContents(this[WEBCONTENTS]), options, (filename: string) => {
        resolve(filename)
      })
    })
  }

  /**
   * for plugin to upload file
   * @param {array} input
   */
  async upload (input: []) {
    const imgs = await new Uploader(input, this[WEBCONTENTS], this[PICGO]).upload()
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

  /**
   * For notification
   * @param {Object} options
   */
  showNotification (options = {
    title: '',
    body: ''
  }) {
    const notification = new Notification({
      title: options.title,
      body: options.body
    })
    notification.show()
  }

  /**
   *
   * @param {Object} options
   */
  showMessageBox (options = {
    title: '',
    message: '',
    type: 'info',
    buttons: ['Yes', 'No']
  }) {
    return new Promise((resolve, reject) => {
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
