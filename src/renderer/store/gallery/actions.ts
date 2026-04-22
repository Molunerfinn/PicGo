import { GalleryViewMode, type GalleryViewMode as GalleryViewModeType, type GalleryPhoto } from '@/components/main/gallery/utils'
import {
  GALLERY_MASONRY_COLUMN_COUNT_DEFAULT,
  PICGO_GUI_GALLERY_MASONRY_COLUMN_COUNT_KEY,
  PICGO_GUI_GALLERY_VIEW_MODE_KEY,
  PICGO_GUI_GALLERY_ALBUM_SOURCE_KEY
} from '@/utils/consts'
import { rendererStorage } from '@/utils/storage'
import {
  normalizeGalleryMasonryColumnCount,
  normalizeGalleryViewMode
} from '@/store/utils'
import { useGalleryStore } from './store'
import { AlbumSource, type CloudAlbumProviderStat } from '#/types/cloudAlbum'

function normalizeAlbumSource (value: unknown): AlbumSource {
  return value === AlbumSource.CLOUD ? AlbumSource.CLOUD : AlbumSource.LOCAL
}

export const galleryStoreActions = {
  async ensureHydrated () {
    if (useGalleryStore.getState().hasHydrated) {
      return
    }

    const [storedViewMode, storedMasonryColumnCount, storedAlbumSource] = await Promise.all([
      rendererStorage.getItem<string>(
        PICGO_GUI_GALLERY_VIEW_MODE_KEY,
        GalleryViewMode.Masonry
      ),
      rendererStorage.getItem<number>(
        PICGO_GUI_GALLERY_MASONRY_COLUMN_COUNT_KEY,
        GALLERY_MASONRY_COLUMN_COUNT_DEFAULT
      ),
      rendererStorage.getItem<string>(
        PICGO_GUI_GALLERY_ALBUM_SOURCE_KEY,
        AlbumSource.LOCAL
      )
    ])

    useGalleryStore.setState((state) => {
      state.viewMode = normalizeGalleryViewMode(storedViewMode)
      state.masonryColumnCount = normalizeGalleryMasonryColumnCount(
        storedMasonryColumnCount
      )
      state.albumSource = normalizeAlbumSource(storedAlbumSource)
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
  },
  async setAlbumSource (source: AlbumSource) {
    useGalleryStore.setState((state) => {
      state.albumSource = source
    })

    await rendererStorage.setItem(PICGO_GUI_GALLERY_ALBUM_SOURCE_KEY, source)
  },
  setCloudItems (items: GalleryPhoto[]) {
    useGalleryStore.setState((state) => {
      state.cloudItems = items
    })
  },
  appendCloudItems (items: GalleryPhoto[]) {
    useGalleryStore.setState((state) => {
      const offset = state.cloudItems.length
      const reindexed = items.map((item, index) => ({
        ...item,
        id: offset + index
      }))
      state.cloudItems = [...state.cloudItems, ...reindexed]
    })
  },
  setCloudTotal (total: number) {
    useGalleryStore.setState((state) => {
      state.cloudTotal = total
    })
  },
  setCloudOffset (offset: number) {
    useGalleryStore.setState((state) => {
      state.cloudOffset = offset
    })
  },
  setCloudLoading (loading: boolean) {
    useGalleryStore.setState((state) => {
      state.cloudLoading = loading
    })
  },
  setCloudHasMore (hasMore: boolean) {
    useGalleryStore.setState((state) => {
      state.cloudHasMore = hasMore
    })
  },
  setCloudSearch (search: string) {
    useGalleryStore.setState((state) => {
      state.cloudSearch = search
    })
  },
  setCloudTypeFilter (typeFilter: string) {
    useGalleryStore.setState((state) => {
      state.cloudTypeFilter = typeFilter
    })
  },
  setCloudProviderStats (stats: CloudAlbumProviderStat[]) {
    useGalleryStore.setState((state) => {
      state.cloudProviderStats = stats
    })
  },
  resetCloudPagination () {
    useGalleryStore.setState((state) => {
      state.cloudItems = []
      state.cloudOffset = 0
      state.cloudHasMore = true
    })
  }
}
