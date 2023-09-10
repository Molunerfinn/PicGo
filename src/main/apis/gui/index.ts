import {
  dialog,
  BrowserWindow,
  Notification,
  ipcMain
} from 'electron'
import db, { GalleryDB } from 'apis/core/datastore'
import { dbPathChecker, defaultConfigPath, getGalleryDBPath } from 'apis/core/datastore/dbChecker'
import uploader from 'apis/app/uploader'
import pasteTemplate from '~/main/utils/pasteTemplate'
import { handleCopyUrl } from '~/main/utils/common'
import {
  getWindowId,
  getSettingWindowId
} from '@core/bus/apis'
import {
  SHOW_INPUT_BOX
} from '~/universal/events/constants'
import { DBStore } from '@picgo/store'
import { T } from '~/main/i18n'
import { IRPCActionType } from '~/universal/types/enum'

// Cross-process support may be required in the future
class GuiApi implements IGuiApi {
  // eslint-disable-next-line no-use-before-define
  private static instance: GuiApi
  private windowId: number = -1
  private settingWindowId: number = -1
  private constructor () {
    console.log('init gui api')
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
    if (settingWindow?.isVisible()) {
      return true
    }
    settingWindow?.show()
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve()
      }, 1000) // TODO: a better way to wait page loaded.
    })
  }

  private getWebContentsByWindowId (id: number) {
    return BrowserWindow.fromId(id)?.webContents
  }

  async showInputBox (options: IShowInputBoxOption = {
    title: '',
    placeholder: ''
  }) {
    await this.showSettingWindow()
    this.getWebContentsByWindowId(this.settingWindowId)?.send(SHOW_INPUT_BOX, options)
    return new Promise<string>((resolve) => {
      ipcMain.once(SHOW_INPUT_BOX, (event: Event, value: string) => {
        resolve(value)
      })
    })
  }

  async showFileExplorer (options: IShowFileExplorerOption = {}) {
    this.windowId = await getWindowId()
    const res = await dialog.showOpenDialog(BrowserWindow.fromId(this.windowId)!, options)
    return res.filePaths || []
  }

  async upload (input: IUploadOption) {
    this.windowId = await getWindowId()
    const webContents = this.getWebContentsByWindowId(this.windowId)
    const imgs = await uploader.setWebContents(webContents!).upload(input)
    if (imgs !== false) {
      const pasteStyle = db.get('settings.pasteStyle') || 'markdown'
      const pasteText: string[] = []
      for (let i = 0; i < imgs.length; i++) {
        pasteText.push(pasteTemplate(pasteStyle, imgs[i], db.get('settings.customLink')))
        const notification = new Notification({
          title: T('UPLOAD_SUCCEED'),
          body: imgs[i].imgUrl as string
          // icon: imgs[i].imgUrl
        })
        setTimeout(() => {
          notification.show()
        }, i * 100)
        await GalleryDB.getInstance().insert(imgs[i])
      }
      handleCopyUrl(pasteText.join('\n'))
      webContents?.send('uploadFiles', imgs)
      webContents?.send(IRPCActionType.UPDATE_GALLERY)
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
    return new Promise<IShowMessageBoxResult>(async (resolve) => {
      this.windowId = await getWindowId()
      dialog.showMessageBox(
        BrowserWindow.fromId(this.windowId)!,
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
   * v2.4.0+
   * @param options
   */
  async showConfigDialog<T extends IStringKeyMap> (options: IPicGoPluginShowConfigDialogOption) {
    await this.showSettingWindow()
    this.getWebContentsByWindowId(this.settingWindowId)?.send(IRPCActionType.OPEN_CONFIG_DIALOG, options)
    return new Promise<T | false>((resolve) => {
      ipcMain.once(IRPCActionType.OPEN_CONFIG_DIALOG, (event: Event, value: T | false) => {
        resolve(value)
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
        if (prop === 'overwrite') {
          return new Proxy(GalleryDB.getInstance().overwrite, {
            apply (target, ctx, args) {
              return new Promise((resolve) => {
                const guiApi = GuiApi.getInstance()
                guiApi.showMessageBox({
                  title: T('TIPS_WARNING'),
                  message: T('TIPS_PLUGIN_REMOVE_GALLERY_ITEM'),
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
        if (prop === 'removeById') {
          return new Proxy(GalleryDB.getInstance().removeById, {
            apply (target, ctx, args) {
              return new Promise((resolve) => {
                const guiApi = GuiApi.getInstance()
                guiApi.showMessageBox({
                  title: T('TIPS_WARNING'),
                  message: T('TIPS_PLUGIN_REMOVE_GALLERY_ITEM'),
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
