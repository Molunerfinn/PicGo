import axios from 'axios'
import { IObject, IResult, IGetResult, IFilter } from '@picgo/store/dist/types'

interface IGalleryDB {
  get<T>(filter?: IFilter): Promise<IGetResult<T>>
  insert<T> (value: T): Promise<IResult<T>>
  insertMany<T> (value: T[]): Promise<IResult<T>[]>
  updateById (id: string, value: IObject): Promise<boolean>
  getById<T> (id: string): Promise<IResult<T> | undefined>
  removeById (id: string): Promise<void>
}

declare module 'vue/types/vue' {
  interface Vue {
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $http: typeof axios
    $builtInPicBed: string[]
    $$db: IGalleryDB
    $T: typeof import('~/renderer/i18n/index').T
    $i18n: import('~/renderer/i18n/index').I18nManager
    saveConfig(data: IObj | string, value?: any): void
    getConfig<T>(key?: string): Promise<T | undefined>
    setDefaultPicBed(picBed: string): void
    triggerRPC<T> (action: import('~/universal/types/enum').IRPCActionType, ...args: any[]): Promise<T | null>
    defaultPicBed: string
    forceUpdate(): void
    sendToMain(channel: string, ...args: any[]): void
  }
  interface GlobalComponents {
    PhotoProvider: typeof import('vue3-photo-preview').PhotoProvider
    PhotoConsumer: typeof import('vue3-photo-preview').PhotoConsumer
    PhotoSlider: typeof import('vue3-photo-preview').PhotoSlider
  }
}
