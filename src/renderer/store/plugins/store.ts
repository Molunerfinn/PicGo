import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  PluginReadmeState,
  PluginSearchResultItem
} from '@/components/main/plugins/types'
import { createSelectors } from '@/store/create-selectors'

export interface PluginStoreState {
  searchValue: string
  exactMatch: boolean
  rawSearchResults: PluginSearchResultItem[]
  searchResults: PluginSearchResultItem[]
  isSearching: boolean
  isImportingLocal: boolean
  isMutatingByPlugin: Record<string, boolean>
  readmeByPlugin: Record<string, PluginReadmeState>
}

const initialPluginStoreState: PluginStoreState = {
  searchValue: '',
  exactMatch: false,
  rawSearchResults: [],
  searchResults: [],
  isSearching: false,
  isImportingLocal: false,
  isMutatingByPlugin: {},
  readmeByPlugin: {}
}

export const usePluginStoreBase = create<PluginStoreState>()(
  immer(() => initialPluginStoreState)
)

export const usePluginStore = createSelectors(usePluginStoreBase)
