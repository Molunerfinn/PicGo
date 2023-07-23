import {
  PICGO_GET_BY_ID_DB,
  PICGO_GET_DB,
  PICGO_INSERT_DB,
  PICGO_INSERT_MANY_DB,
  PICGO_REMOVE_BY_ID_DB,
  PICGO_UPDATE_BY_ID_DB
} from '#/events/constants'
import { IGalleryDB } from '#/types/extra-vue'
import { IFilter, IGetResult, IObject, IResult } from '@picgo/store/dist/types'
import { IpcRendererEvent, ipcRenderer } from 'electron'
import { v4 as uuid } from 'uuid'
import { getRawData } from './common'
export class GalleryDB implements IGalleryDB {
  async get<T> (filter?: IFilter): Promise<IGetResult<T>> {
    const res = await this.msgHandler<IGetResult<T>>(PICGO_GET_DB, filter)
    return res
  }

  async insert<T> (value: T): Promise<IResult<T>> {
    const res = await this.msgHandler<IResult<T>>(PICGO_INSERT_DB, value)
    return res
  }

  async insertMany<T> (value: T[]): Promise<IResult<T>[]> {
    const res = await this.msgHandler<IResult<T>[]>(PICGO_INSERT_MANY_DB, value)
    return res
  }

  async updateById (id: string, value: IObject): Promise<boolean> {
    const res = await this.msgHandler<boolean>(PICGO_UPDATE_BY_ID_DB, id, value)
    return res
  }

  async getById<T> (id: string): Promise<IResult<T> | undefined> {
    const res = await this.msgHandler<IResult<T> | undefined>(PICGO_GET_BY_ID_DB, id)
    return res
  }

  async removeById (id: string): Promise<void> {
    const res = await this.msgHandler<void>(PICGO_REMOVE_BY_ID_DB, id)
    return res
  }

  private msgHandler<T> (method: string, ...args: any[]): Promise<T> {
    return new Promise((resolve) => {
      const callbackId = uuid()
      const callback = (event: IpcRendererEvent, data: T, returnCallbackId: string) => {
        if (returnCallbackId === callbackId) {
          resolve(data)
          ipcRenderer.removeListener(method, callback)
        }
      }
      const data = getRawData(args)
      ipcRenderer.on(method, callback)
      ipcRenderer.send(method, ...data, callbackId)
    })
  }
}

export default new GalleryDB()
