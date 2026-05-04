import fs from 'fs-extra'
import { IToolboxItemCheckStatus, IToolboxItemType } from '~/universal/types/enum'
import { sendToolboxResWithType } from './utils'
import { dbPathChecker, getAlbumDBPath } from '~/main/apis/core/datastore/dbChecker'
import { AlbumDB } from '~/main/apis/core/datastore'
import path from 'path'
import { T } from '~/main/i18n'

export const checkFileMap: IToolboxCheckerMap<
IToolboxItemType.IS_CONFIG_FILE_BROKEN | IToolboxItemType.IS_ALBUM_FILE_BROKEN
> = {
  [IToolboxItemType.IS_CONFIG_FILE_BROKEN]: async (event) => {
    const sendToolboxRes = sendToolboxResWithType(IToolboxItemType.IS_CONFIG_FILE_BROKEN)
    sendToolboxRes(event, {
      status: IToolboxItemCheckStatus.LOADING
    })
    const configFilePath = dbPathChecker()
    try {
      if (fs.existsSync(configFilePath)) {
        await fs.readJSON(configFilePath)
        sendToolboxRes(event, {
          status: IToolboxItemCheckStatus.SUCCESS,
          msg: T('TOOLBOX_CHECK_CONFIG_FILE_PATH_TIPS', {
            path: configFilePath
          }),
          value: configFilePath
        })
      }
    } catch (e) {
      sendToolboxRes(event, {
        status: IToolboxItemCheckStatus.ERROR,
        msg: T('TOOLBOX_CHECK_CONFIG_FILE_BROKEN_TIPS'),
        value: path.dirname(configFilePath)
      })
    }
  },
  [IToolboxItemType.IS_ALBUM_FILE_BROKEN]: async (event) => {
    const sendToolboxRes = sendToolboxResWithType(IToolboxItemType.IS_ALBUM_FILE_BROKEN)
    sendToolboxRes(event, {
      status: IToolboxItemCheckStatus.LOADING
    })
    const { dbPath } = getAlbumDBPath()
    const albumDB = AlbumDB.getInstance()
    if (albumDB.errorList.length === 0) {
      sendToolboxRes(event, {
        status: IToolboxItemCheckStatus.SUCCESS,
        msg: T('TOOLBOX_CHECK_ALBUM_FILE_PATH_TIPS', {
          path: dbPath
        }),
        value: path.dirname(dbPath)
      })
    } else {
      sendToolboxRes(event, {
        status: IToolboxItemCheckStatus.ERROR,
        msg: T('TOOLBOX_CHECK_ALBUM_FILE_BROKEN_TIPS'),
        value: path.dirname(dbPath)
      })
    }
  }
}

export const fixFileMap: IToolboxFixMap<
IToolboxItemType.IS_CONFIG_FILE_BROKEN | IToolboxItemType.IS_ALBUM_FILE_BROKEN
> = {
  [IToolboxItemType.IS_CONFIG_FILE_BROKEN]: async () => {
    try {
      fs.unlinkSync(dbPathChecker())
    } catch (e) {
      // do nothing
    }
    return {
      type: IToolboxItemType.IS_CONFIG_FILE_BROKEN,
      status: IToolboxItemCheckStatus.SUCCESS
    }
  },
  [IToolboxItemType.IS_ALBUM_FILE_BROKEN]: async () => {
    try {
      fs.unlinkSync(getAlbumDBPath().dbPath)
    } catch (e) {
      // do nothing
    }
    return {
      type: IToolboxItemType.IS_ALBUM_FILE_BROKEN,
      status: IToolboxItemCheckStatus.SUCCESS
    }
  }
}
