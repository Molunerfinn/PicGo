import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { GalleryViewMode, type GalleryViewMode as GalleryViewModeType , GalleryPhoto } from '@/components/main/gallery/utils'
import { GALLERY_MASONRY_COLUMN_COUNT_DEFAULT } from '@/utils/consts'
import { createSelectors } from '@/store/create-selectors'
import { AlbumSource, type CloudAlbumProviderStat } from '#/types/cloudAlbum'

export interface GalleryStoreState {
  viewMode: GalleryViewModeType
  masonryColumnCount: number
  hasHydrated: boolean

  albumSource: AlbumSource
  cloudItems: GalleryPhoto[]
  cloudTotal: number
  cloudOffset: number
  cloudLoading: boolean
  cloudHasMore: boolean
  cloudSearch: string
  cloudTypeFilter: string
  cloudProviderStats: CloudAlbumProviderStat[]
}

const initialGalleryStoreState: GalleryStoreState = {
  viewMode: GalleryViewMode.Masonry,
  masonryColumnCount: GALLERY_MASONRY_COLUMN_COUNT_DEFAULT,
  hasHydrated: false,

  albumSource: AlbumSource.LOCAL,
  cloudItems: [],
  cloudTotal: 0,
  cloudOffset: 0,
  cloudLoading: false,
  cloudHasMore: true,
  cloudSearch: '',
  cloudTypeFilter: '',
  cloudProviderStats: []
}

export const useGalleryStoreBase = create<GalleryStoreState>()(
  immer(() => initialGalleryStoreState)
)

export const useGalleryStore = createSelectors(useGalleryStoreBase)
