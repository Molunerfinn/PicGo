import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { createSelectors } from '@/store/create-selectors'

export interface SettingsStoreState {
  searchValue: string
}

const initialSettingsStoreState: SettingsStoreState = {
  searchValue: ''
}

export const useSettingsStoreBase = create<SettingsStoreState>()(
  immer(() => initialSettingsStoreState)
)

export const useSettingsStore = createSelectors(useSettingsStoreBase)
