import { reactive, InjectionKey, readonly, App, UnwrapRef } from 'vue'
import { saveConfig } from '@/utils/dataSender'

export interface IState {
  defaultPicBed: string;
}

export interface IStore {
  state: UnwrapRef<IState>
  setDefaultPicBed: (type: string) => void;
}

export const storeKey: InjectionKey<IStore> = Symbol('store')

// state
const state: IState = reactive({
  defaultPicBed: 'smms'
})

// methods
const setDefaultPicBed = (type: string) => {
  saveConfig({
    'picBed.current': type,
    'picBed.uploader': type
  })
  state.defaultPicBed = type
  console.log(state)
}

export const store = {
  install (app: App) {
    app.provide(storeKey, {
      state: readonly(state),
      setDefaultPicBed
    })
  }
}
