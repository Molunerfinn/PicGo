import {
  dialog,
  BrowserWindow,
  Notification,
  ipcMain
} from 'electron'
import path from 'path'
import db, { GalleryDB } from 'apis/core/datastore'
import { dbPathChecker, defaultConfigPath, getGalleryDBPath } from 'apis/core/datastore/dbChecker'
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
import { DBStore } from '@picgo/store'
type PromiseResType<T> = T extends Promise<infer R> ? R : T

// Cross-process support may be required in the future
class GuiApi implements IGuiApi {
  private static instance: GuiApi
  private windowId: number = -1
  private settingWindowId: number = -1
  private constructor () {
    console.log('init guiapi')
  }
  public static getInstance (): GuiApi {
    if (!GuiApi.instance) {
      GuiApi.instance = new GuiApi()
    }
    return GuiApi.instance
  }
  private async showSettingWindow () {
    this.settingWindowId = await getSettingWindowId()
    const settingWindow = BrowserWindow.fromId(this.settingWindowId)
    if (settingWindow.isVisible()) {
      return true
    }
    settingWindow.show()
    return new Promise<void>((resolve, reject) => {
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
      const pasteText: string[] = []
      for (let i = 0; i < imgs.length; i++) {
        pasteText.push(pasteTemplate(pasteStyle, imgs[i], db.get('settings.customLink')))
        const notification = new Notification({
          title: '上传成功',
          body: imgs[i].imgUrl as string,
          icon: imgs[i].imgUrl
        })
        setTimeout(() => {
          notification.show()
        }, i * 100)
        await GalleryDB.getInstance().insert(imgs[i])
      }
      handleCopyUrl(pasteText.join('\n'))
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

  /**
   * get picgo config/data path
   */
  async getConfigPath () {
    const currentConfigPath = dbPathChecker()
    const galleryDBPath = getGalleryDBPath().dbPath
    return {
      defaultConfigPath,
      currentConfigPath,
      galleryDBPath
    }
  }

  get galleryDB (): DBStore {
    return new Proxy<DBStore>(GalleryDB.getInstance(), {
      get (target, prop: keyof DBStore) {
        if (prop === 'removeById') {
          return new Proxy(GalleryDB.getInstance().removeById, {
            apply (target, ctx, args) {
              return new Promise((resolve) => {
                const guiApi = GuiApi.getInstance()
                guiApi.showMessageBox({
                  title: '警告',
                  message: '有插件正在试图删除一些相册图片，是否继续',
                  type: 'info',
                  buttons: ['Yes', 'No']
                }).then(res => {
                  if (res.result === 0) {
                    resolve(Reflect.apply(target, ctx, args))
                  } else {
                    resolve(undefined)
                  }
                })
              })
            }
          })
        }
        return Reflect.get(target, prop)
      }
    })
  }
}

export default GuiApi
