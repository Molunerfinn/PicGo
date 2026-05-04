import { AlbumViewMode, type AlbumViewMode as AlbumViewModeType, type AlbumPhoto } from '@/components/main/album/utils'
import {
  GALLERY_MASONRY_COLUMN_COUNT_DEFAULT,
  PICGO_GUI_GALLERY_MASONRY_COLUMN_COUNT_KEY,
  PICGO_GUI_GALLERY_VIEW_MODE_KEY,
  PICGO_GUI_GALLERY_ALBUM_SOURCE_KEY
} from '@/utils/consts'
import { rendererStorage } from '@/utils/storage'
import {
  normalizeAlbumMasonryColumnCount,
  normalizeAlbumViewMode
} from '@/store/utils'
import { useAlbumStore } from './store'
import { AlbumSource, type CloudAlbumProviderStat } from '#/types/cloudAlbum'
import { useAppStore } from '@/store/app-store'
import { sendRPC } from '@/utils/dataSender'
import { IRPCActionType } from '~/universal/types/enum'

function normalizeAlbumSource (value: unknown): AlbumSource {
  return value === AlbumSource.CLOUD ? AlbumSource.CLOUD : AlbumSource.LOCAL
}

export const albumStoreActions = {
  async ensureHydrated () {
    if (useAlbumStore.getState().hasHydrated) {
      return
    }

    const [storedViewMode, storedMasonryColumnCount, storedAlbumSource] = await Promise.all([
      rendererStorage.getItem<string>(
        PICGO_GUI_GALLERY_VIEW_MODE_KEY,
        AlbumViewMode.Masonry
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

    // If user is already a paid cloud user, default to cloud source
    const userInfo = useAppStore.getState().picgoCloud.userInfo
    const isPaidUser = (userInfo?.plan ?? 0) > 0
    const resolvedSource = isPaidUser ? AlbumSource.CLOUD : normalizeAlbumSource(storedAlbumSource)

    useAlbumStore.setState((state) => {
      state.viewMode = normalizeAlbumViewMode(storedViewMode)
      state.masonryColumnCount = normalizeAlbumMasonryColumnCount(
        storedMasonryColumnCount
      )
      state.albumSource = resolvedSource
      state.hasHydrated = true
    })
  },
  async setViewMode (mode: AlbumViewModeType) {
    const normalizedMode = normalizeAlbumViewMode(mode)

    useAlbumStore.setState((state) => {
      state.viewMode = normalizedMode
    })

    await rendererStorage.setItem(PICGO_GUI_GALLERY_VIEW_MODE_KEY, normalizedMode)
  },
  async setMasonryColumnCount (count: number) {
    const normalizedCount = normalizeAlbumMasonryColumnCount(count)

    useAlbumStore.setState((state) => {
      state.masonryColumnCount = normalizedCount
    })

    await rendererStorage.setItem(
      PICGO_GUI_GALLERY_MASONRY_COLUMN_COUNT_KEY,
      normalizedCount
    )
  },
  async setAlbumSource (source: AlbumSource) {
    useAlbumStore.setState((state) => {
      state.albumSource = source
    })

    await rendererStorage.setItem(PICGO_GUI_GALLERY_ALBUM_SOURCE_KEY, source)

    // Notify other renderer windows (tray, mini) via main-process relay
    sendRPC(IRPCActionType.SYNC_ALBUM_SOURCE, source)
  },
  setCloudItems (items: AlbumPhoto[]) {
    useAlbumStore.setState((state) => {
      state.cloudItems = items
    })
  },
  setCloudAllTotal (total: number) {
    useAlbumStore.setState((state) => {
      state.cloudAllTotal = total
    })
  },
  appendCloudItems (items: AlbumPhoto[]) {
    useAlbumStore.setState((state) => {
      const offset = state.cloudItems.length
      const reindexed = items.map((item, index) => ({
        ...item,
        id: offset + index
      }))
      state.cloudItems = [...state.cloudItems, ...reindexed]
    })
  },
  setCloudTotal (total: number) {
    useAlbumStore.setState((state) => {
      state.cloudTotal = total
    })
  },
  setCloudOffset (offset: number) {
    useAlbumStore.setState((state) => {
      state.cloudOffset = offset
    })
  },
  setCloudLoading (loading: boolean) {
    useAlbumStore.setState((state) => {
      state.cloudLoading = loading
    })
  },
  setCloudHasMore (hasMore: boolean) {
    useAlbumStore.setState((state) => {
      state.cloudHasMore = hasMore
    })
  },
  setCloudSearch (search: string) {
    useAlbumStore.setState((state) => {
      state.cloudSearch = search
    })
  },
  setCloudTypeFilter (typeFilter: string) {
    useAlbumStore.setState((state) => {
      state.cloudTypeFilter = typeFilter
    })
  },
  setCloudProviderStats (stats: CloudAlbumProviderStat[]) {
    useAlbumStore.setState((state) => {
      state.cloudProviderStats = stats
    })
  },
  resetCloudPagination () {
    useAlbumStore.setState((state) => {
      state.cloudItems = []
      state.cloudTotal = 0
      state.cloudOffset = 0
      state.cloudHasMore = true
    })
  }
}
