import fs from 'fs-extra'
import path from 'path'
import { dbPathChecker, defaultConfigPath } from '~/main/apis/core/datastore/dbChecker'
import { IToolboxItemCheckStatus, IToolboxItemType } from '~/universal/types/enum'
import { CLIPBOARD_IMAGE_FOLDER } from '~/universal/utils/static'
import { sendToolboxResWithType } from './utils'
import { T } from '~/main/i18n'

const sendToolboxRes = sendToolboxResWithType(IToolboxItemType.HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD)

const defaultClipboardImagePath = path.join(defaultConfigPath, CLIPBOARD_IMAGE_FOLDER)

export const checkClipboardUploadMap: IToolboxCheckerMap<
IToolboxItemType.HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD
> = {
  [IToolboxItemType.HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD]: async (event) => {
    sendToolboxRes(event, {
      status: IToolboxItemCheckStatus.LOADING
    })
    const configFilePath = dbPathChecker()
    if (fs.existsSync(configFilePath)) {
      const dirPath = path.dirname(configFilePath)
      const clipboardImagePath = path.join(dirPath, CLIPBOARD_IMAGE_FOLDER)
      if (fs.existsSync(clipboardImagePath)) {
        sendToolboxRes(event, {
          status: IToolboxItemCheckStatus.SUCCESS,
          msg: T('TOOLBOX_CHECK_CLIPBOARD_FILE_PATH_TIPS', {
            path: clipboardImagePath
          }),
          value: clipboardImagePath
        })
      } else {
        sendToolboxRes(event, {
          status: IToolboxItemCheckStatus.ERROR,
          msg: T('TOOLBOX_CHECK_CLIPBOARD_FILE_PATH_NOT_EXIST_TIPS', {
            path: clipboardImagePath
          }),
          value: path.dirname(clipboardImagePath)
        })
      }
    } else {
      sendToolboxRes(event, {
        status: IToolboxItemCheckStatus.ERROR,
        msg: T('TOOLBOX_CHECK_CLIPBOARD_FILE_PATH_NOT_EXIST_TIPS', {
          path: defaultClipboardImagePath
        }),
        value: path.dirname(defaultClipboardImagePath)
      })
    }
  }
}

export const fixClipboardUploadMap: IToolboxFixMap<
IToolboxItemType.HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD
> = {
  [IToolboxItemType.HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD]: async () => {
    const configFilePath = dbPathChecker()
    const dirPath = path.dirname(configFilePath)
    const clipboardImagePath = path.join(dirPath, CLIPBOARD_IMAGE_FOLDER)
    try {
      fs.mkdirsSync(clipboardImagePath)
      return {
        type: IToolboxItemType.HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD,
        status: IToolboxItemCheckStatus.SUCCESS
      }
    } catch (e) {
      return {
        type: IToolboxItemType.HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD,
        status: IToolboxItemCheckStatus.ERROR,
        msg: T('TOOLBOX_CHECK_CLIPBOARD_FILE_PATH_ERROR_TIPS', {
          path: clipboardImagePath
        }),
        value: path.dirname(clipboardImagePath)
      }
    }
  }
}
