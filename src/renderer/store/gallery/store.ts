import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { GalleryViewMode, type GalleryViewMode as GalleryViewModeType } from '@/components/main/gallery/utils'
import { GALLERY_MASONRY_COLUMN_COUNT_DEFAULT } from '@/utils/consts'
import { createSelectors } from '@/store/create-selectors'

export interface GalleryStoreState {
  viewMode: GalleryViewModeType
  masonryColumnCount: number
  hasHydrated: boolean
}

const initialGalleryStoreState: GalleryStoreState = {
  viewMode: GalleryViewMode.Masonry,
  masonryColumnCount: GALLERY_MASONRY_COLUMN_COUNT_DEFAULT,
  hasHydrated: false
}

export const useGalleryStoreBase = create<GalleryStoreState>()(
  immer(() => initialGalleryStoreState)
)

export const useGalleryStore = createSelectors(useGalleryStoreBase)
