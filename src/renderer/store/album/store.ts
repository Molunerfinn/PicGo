import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { AlbumViewMode, type AlbumViewMode as AlbumViewModeType , AlbumPhoto } from '@/components/main/album/utils'
import { GALLERY_MASONRY_COLUMN_COUNT_DEFAULT } from '@/utils/consts'
import { createSelectors } from '@/store/create-selectors'
import { AlbumSource, type CloudAlbumProviderStat } from '#/types/cloudAlbum'

export interface AlbumStoreState {
  viewMode: AlbumViewModeType
  masonryColumnCount: number
  hasHydrated: boolean

  albumSource: AlbumSource
  cloudItems: AlbumPhoto[]
  cloudAllTotal: number
  cloudTotal: number
  cloudOffset: number
  cloudLoading: boolean
  cloudHasMore: boolean
  cloudSearch: string
  cloudTypeFilter: string
  cloudProviderStats: CloudAlbumProviderStat[]
}

const initialAlbumStoreState: AlbumStoreState = {
  viewMode: AlbumViewMode.Masonry,
  masonryColumnCount: GALLERY_MASONRY_COLUMN_COUNT_DEFAULT,
  hasHydrated: false,

  albumSource: AlbumSource.LOCAL,
  cloudItems: [],
  cloudAllTotal: 0,
  cloudTotal: 0,
  cloudOffset: 0,
  cloudLoading: false,
  cloudHasMore: true,
  cloudSearch: '',
  cloudTypeFilter: '',
  cloudProviderStats: []
}

export const useAlbumStoreBase = create<AlbumStoreState>()(
  immer(() => initialAlbumStoreState)
)

export const useAlbumStore = createSelectors(useAlbumStoreBase)
