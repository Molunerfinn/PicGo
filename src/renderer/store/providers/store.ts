import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { createSelectors } from '@/store/create-selectors'

export interface ProviderStoreState {
  isHydrating: boolean
  isLoadingByProvider: Record<string, boolean>
  expandedProviderIds: string[]
  searchValue: string
}

const initialProviderStoreState: ProviderStoreState = {
  isHydrating: false,
  isLoadingByProvider: {},
  expandedProviderIds: [],
  searchValue: ''
}

export const useProviderStoreBase = create<ProviderStoreState>()(
  immer(() => initialProviderStoreState)
)

export const useProviderStore = createSelectors(useProviderStoreBase)
