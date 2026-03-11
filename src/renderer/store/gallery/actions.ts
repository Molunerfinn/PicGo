import { GalleryViewMode, type GalleryViewMode as GalleryViewModeType } from '@/components/main/gallery/utils'
import {
  GALLERY_MASONRY_COLUMN_COUNT_DEFAULT,
  PICGO_GUI_GALLERY_MASONRY_COLUMN_COUNT_KEY,
  PICGO_GUI_GALLERY_VIEW_MODE_KEY
} from '@/utils/consts'
import { rendererStorage } from '@/utils/storage'
import {
  normalizeGalleryMasonryColumnCount,
  normalizeGalleryViewMode
} from '@/store/utils'
import { useGalleryStore } from './store'

export const galleryStoreActions = {
  async ensureHydrated () {
    if (useGalleryStore.getState().hasHydrated) {
      return
    }

    const [storedViewMode, storedMasonryColumnCount] = await Promise.all([
      rendererStorage.getItem<string>(
        PICGO_GUI_GALLERY_VIEW_MODE_KEY,
        GalleryViewMode.Masonry
      ),
      rendererStorage.getItem<number>(
        PICGO_GUI_GALLERY_MASONRY_COLUMN_COUNT_KEY,
        GALLERY_MASONRY_COLUMN_COUNT_DEFAULT
      )
    ])

    useGalleryStore.setState((state) => {
      state.viewMode = normalizeGalleryViewMode(storedViewMode)
      state.masonryColumnCount = normalizeGalleryMasonryColumnCount(
        storedMasonryColumnCount
      )
      state.hasHydrated = true
    })
  },
  async setViewMode (mode: GalleryViewModeType) {
    const normalizedMode = normalizeGalleryViewMode(mode)

    useGalleryStore.setState((state) => {
      state.viewMode = normalizedMode
    })

    await rendererStorage.setItem(PICGO_GUI_GALLERY_VIEW_MODE_KEY, normalizedMode)
  },
  async setMasonryColumnCount (count: number) {
    const normalizedCount = normalizeGalleryMasonryColumnCount(count)

    useGalleryStore.setState((state) => {
      state.masonryColumnCount = normalizedCount
    })

    await rendererStorage.setItem(
      PICGO_GUI_GALLERY_MASONRY_COLUMN_COUNT_KEY,
      normalizedCount
    )
  }
}
