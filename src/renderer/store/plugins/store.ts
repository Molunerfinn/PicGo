import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  PluginDeprecationState,
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
  deprecationByPlugin: Record<string, PluginDeprecationState>
}

const initialPluginStoreState: PluginStoreState = {
  searchValue: '',
  exactMatch: false,
  rawSearchResults: [],
  searchResults: [],
  isSearching: false,
  isImportingLocal: false,
  isMutatingByPlugin: {},
  readmeByPlugin: {},
  deprecationByPlugin: {}
}

export const usePluginStoreBase = create<PluginStoreState>()(
  immer(() => initialPluginStoreState)
)

export const usePluginStore = createSelectors(usePluginStoreBase)
