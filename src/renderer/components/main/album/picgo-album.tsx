import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { useMemoizedFn } from "ahooks"
import { albumAdapter } from "@/adapters/album"
import { cloudAlbumAdapter, handleCloudImportAll as handleCloudImportAllFn } from "@/adapters/cloud-album"
import { AppMainCard } from "@/components/common/app-main-card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSidebar } from "@/components/ui/sidebar-context"
import { useIPCOn } from "@/hooks/useIPC"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { appActions, albumStoreActions, useAppStore, useAlbumStore } from "@/store"
import { usePicGoCloudUserInfo } from "@/queries/picgo-cloud"
import { invalidateCloudAlbumStatsQuery } from "@/queries/picgo-cloud-album-stats"
import {
  CLOUD_ALBUM_PAGE_SIZE,
  GALLERY_MASONRY_COLUMN_COUNT_DEFAULT,
} from "@/utils/consts"
import { isMacOS } from "@/utils/bridge"
import { AlbumSource } from "#/types/cloudAlbum"
import { AlbumHeader } from "./album-header"
import { AlbumSidebar, allPhotosKey } from "./album-sidebar"
import { AlbumList } from "./album-list"
import { AlbumInspector } from "./album-inspector"
import { AlbumPreview } from "./album-preview"
import { MasonryView } from "./masonry-view"
import type { AlbumUrlRewriteChange } from "./album-url-rewrite-dialog"
import {
  useAlbumSelectionBox,
} from "./hooks/use-album-selection-box"
import {
  buildAlbumPhotos,
  filterAlbumImages,
  AlbumViewMode,
  type AlbumProviderFilter,
  type AlbumPhoto,
  type NavContext,
  NavType,
} from "./utils"
import { IRPCActionType } from "~/universal/types/enum"
import { CloudEmptyState } from "@/components/common/cloud-empty-state"
import { CloudImportProgressBanner } from "./cloud-import-progress"
import { CloudAlbumLoading } from "./cloud-loading"

// TODO(v3-post-launch): Restore tag suggestions when Tags UI returns.
// const tagSuggestions = ["Work", "Meme", "Design"]

function formatSize(sizeMb: number) {
  if (sizeMb <= 0) {
    return "--"
  }

  return `${sizeMb.toFixed(1)} MB`
}

export function PicGoAlbum() {
  const { t } = useTranslation()
  const [images, setImages] = useState<AlbumPhoto[]>([])
  const [navContext, setNavContext] = useState<NavContext>({
    type: NavType.All,
    value: allPhotosKey,
  })
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [searchValue, setSearchValue] = useState("")
  const [isInspectorOpen, setInspectorOpen] = useState(false)
  const [isPreviewOpen, setPreviewOpen] = useState(false)
  const [previewImageId, setPreviewImageId] = useState<number | null>(null)
  const [previewImages, setPreviewImages] = useState<AlbumPhoto[]>([])
  const [previewSession, setPreviewSession] = useState(0)
  // TODO(v3-post-launch): Restore tag input state when Tags inspector actions return.
  // const [tagInput, setTagInput] = useState("")
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null)
  const [albumWidth, setAlbumWidth] = useState(0)
  const [isLayoutFrozen, setIsLayoutFrozen] = useState(false)
  const [frozenWidth, setFrozenWidth] = useState<number | null>(null)
  const { state: sidebarState } = useSidebar()
  const viewMode = useAlbumStore.use.viewMode()
  const masonryColumnCount =
    useAlbumStore.use.masonryColumnCount() || GALLERY_MASONRY_COLUMN_COUNT_DEFAULT
  const picBeds = useAppStore.use.picBeds()
  const {
    userInfo: cloudUserInfo,
    isPaid: isCloudPaidUser,
    isLoading: isCloudUserInfoLoading
  } = usePicGoCloudUserInfo()
  const albumSource = useAlbumStore.use.albumSource()
  const cloudItems = useAlbumStore.use.cloudItems()
  const cloudTotal = useAlbumStore.use.cloudTotal()
  const cloudLoading = useAlbumStore.use.cloudLoading()
  const cloudHasMore = useAlbumStore.use.cloudHasMore()
  const cloudSearch = useAlbumStore.use.cloudSearch()
  const cloudTypeFilter = useAlbumStore.use.cloudTypeFilter()
  const isCloud = albumSource === AlbumSource.CLOUD
  const [debouncedCloudSearch, setDebouncedCloudSearch] = useState("")

  const scrollAreaWrapperRef = useRef<HTMLDivElement | null>(null)
  const scrollViewportRef = useRef<HTMLDivElement | null>(null)
  const albumContentRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const selectedIdsRef = useRef<number[]>([])
  const selectionAnchorIdRef = useRef<number | null>(null)
  const albumWidthRef = useRef(0)
  const isSelectingRef = useRef(false)
  const isInspectorOpenRef = useRef(false)
  const isLayoutFrozenRef = useRef(false)
  const sidebarStateRef = useRef<typeof sidebarState | null>(null)
  const layoutFreezeTimerRef = useRef<number | null>(null)
  const cloudFirstPageRequestIdRef = useRef(0)

  const filteredImages = filterAlbumImages(images, navContext, searchValue)
  const displayImages = isCloud ? cloudItems : filteredImages
  const masonryLayoutScopeKey = isCloud
    ? `cloud:${cloudTypeFilter || allPhotosKey}:${cloudSearch}`
    : `local:${navContext.type}:${navContext.value}:${searchValue}`
  const imageMap = new Map(displayImages.map((image) => [image.id, image]))
  const selectedSet = new Set(selectedIds)
  const selectedImages = selectedIds
    .map((id) => imageMap.get(id))
    .filter((image): image is AlbumPhoto => Boolean(image))
  const visibleProviders: AlbumProviderFilter[] = picBeds
    .filter((item) => item.visible !== false)
    .map((item) => ({
      type: item.type,
      name: item.name,
      count: images.filter((image) => image.type === item.type).length,
    }))

  // TODO(v3-post-launch): Restore selected tag derivation when Tags inspector actions return.
  // const selectedTags = getSelectedTags(selectedImages)

  const isAllSelected =
    displayImages.length > 0 && selectedIds.length === displayImages.length

  const [refreshNonce, setRefreshNonce] = useState(0)

  const handleLocalAlbumUpdated = useMemoizedFn(() => {
    if (!isCloud) {
      setRefreshNonce((value) => value + 1)
    }
  })
  useIPCOn(IRPCActionType.UPDATE_ALBUM, handleLocalAlbumUpdated)

  const loadCloudFirstPage = useMemoizedFn(async () => {
    const requestId = cloudFirstPageRequestIdRef.current + 1
    cloudFirstPageRequestIdRef.current = requestId
    albumStoreActions.setCloudLoading(true)
    albumStoreActions.resetCloudPagination()
    try {
      const query = {
        limit: CLOUD_ALBUM_PAGE_SIZE,
        offset: 0,
        sort: 'newest' as const,
        ...(cloudSearch ? { search: cloudSearch } : {}),
        ...(cloudTypeFilter ? { type: cloudTypeFilter } : {})
      }
      const result = await cloudAlbumAdapter.list(query)
      if (result.success && cloudFirstPageRequestIdRef.current === requestId) {
        const photos = buildAlbumPhotos(result.data.items, picBeds)
        albumStoreActions.setCloudItems(photos)
        albumStoreActions.setCloudTotal(result.data.total)
        albumStoreActions.setCloudOffset(result.data.items.length)
        albumStoreActions.setCloudHasMore(result.data.items.length < result.data.total)
      }
    } catch (error) {
      if (cloudFirstPageRequestIdRef.current === requestId) {
        console.error(error)
        toast.error(t("ALBUM_CLOUD_LOAD_FAILED"))
      }
    } finally {
      if (cloudFirstPageRequestIdRef.current === requestId) {
        albumStoreActions.setCloudLoading(false)
      }
    }
  })

  const handleCloudAlbumUpdated = useMemoizedFn(() => {
    invalidateCloudAlbumStatsQuery().catch(console.warn)
    if (isCloud) {
      const refreshPromise = loadCloudFirstPage()
      refreshPromise.catch((error) => {
        console.error(error)
      })
    }
  })
  useIPCOn(IRPCActionType.UPDATE_CLOUD_ALBUM, handleCloudAlbumUpdated)

  useEffect(() => {
    selectedIdsRef.current = selectedIds
  }, [selectedIds])

  useEffect(() => {
    isInspectorOpenRef.current = isInspectorOpen
  }, [isInspectorOpen])

  useEffect(() => {
    isLayoutFrozenRef.current = isLayoutFrozen
  }, [isLayoutFrozen])

  // Cloud search debounce (300ms)
  useEffect(() => {
    if (!isCloud) return
    const timer = window.setTimeout(() => {
      setDebouncedCloudSearch(searchValue)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchValue, isCloud])

  // Cloud search → trigger store update
  useEffect(() => {
    if (!isCloud) return
    albumStoreActions.setCloudSearch(debouncedCloudSearch)
  }, [debouncedCloudSearch, isCloud])

  const cloudLoadingLockRef = useRef(false)
  const loadCloudNextPage = useMemoizedFn(async () => {
    if (cloudLoadingLockRef.current) return
    const state = useAlbumStore.getState()
    if (!state.cloudHasMore) return
    cloudLoadingLockRef.current = true
    albumStoreActions.setCloudLoading(true)
    try {
      const query = {
        limit: CLOUD_ALBUM_PAGE_SIZE,
        offset: state.cloudOffset,
        sort: 'newest' as const,
        ...(state.cloudSearch ? { search: state.cloudSearch } : {}),
        ...(state.cloudTypeFilter ? { type: state.cloudTypeFilter } : {})
      }
      const result = await cloudAlbumAdapter.list(query)
      if (result.success) {
        const photos = buildAlbumPhotos(result.data.items, picBeds)
        albumStoreActions.appendCloudItems(photos)
        albumStoreActions.setCloudOffset(state.cloudOffset + result.data.items.length)
        albumStoreActions.setCloudHasMore(state.cloudOffset + result.data.items.length < result.data.total)
      }
    } catch (error) {
      console.error(error)
    } finally {
      cloudLoadingLockRef.current = false
      albumStoreActions.setCloudLoading(false)
    }
  })

  // Local gallery data fetch
  useEffect(() => {
    if (isCloud) return
    async function refreshAlbumPage () {
      try {
        await appActions.ensureHydrated()
        const albumItems = await albumAdapter.getAlbumItems()
        setImages(buildAlbumPhotos(albumItems, picBeds))
      } catch (error) {
        console.error(error)
      }
    }

    refreshAlbumPage()
  }, [picBeds, refreshNonce, isCloud])

  // Cloud gallery data fetch
   
  useEffect(() => {
    if (!isCloud) return
    const refreshPromise = loadCloudFirstPage()
    refreshPromise.catch((error) => {
      console.error(error)
    })
  }, [isCloud, cloudSearch, cloudTypeFilter, loadCloudFirstPage])

  const handleCloudFirstPageRefresh = useMemoizedFn(() => {
    invalidateCloudAlbumStatsQuery().catch(console.warn)
    const refreshPromise = loadCloudFirstPage()
    refreshPromise.catch((error) => {
      console.error(error)
    })
  })

  const handleSidebarCloudRefresh = useMemoizedFn(async () => {
    await invalidateCloudAlbumStatsQuery()
    await loadCloudFirstPage()
  })

  const handleCloudLoadMore = useMemoizedFn(() => {
    const loadMorePromise = loadCloudNextPage()
    loadMorePromise.catch((error) => {
      console.error(error)
    })
  })

  const handleScrollAreaWrapperRef = (node: HTMLDivElement | null) => {
    scrollAreaWrapperRef.current = node
    if (!node) return
    requestAnimationFrame(() => {
      const viewport =
        node.querySelector<HTMLDivElement>(
          "[data-slot='scroll-area-viewport']"
        ) ?? null
      scrollViewportRef.current = viewport
      setScrollRoot((prev) => (prev === viewport ? prev : viewport))
    })
  }

  const handleMasonryScrollRootChange = (root: HTMLElement | null) => {
    setScrollRoot((prev) => (prev === root ? prev : root))
  }

  useEffect(() => {
    const container = albumContentRef.current
    if (!container) return

    const commitWidth = (nextWidth: number) => {
      if (nextWidth <= 0 || nextWidth === albumWidthRef.current) return
      albumWidthRef.current = nextWidth
      setAlbumWidth(nextWidth)
    }

    const updateWidth = () => {
      const nextWidth = container.clientWidth
      if (nextWidth === albumWidthRef.current) return
      if (isLayoutFrozenRef.current) return
      commitWidth(nextWidth)
    }

    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(container)

    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    const container = albumContentRef.current
    if (!container) return
    if (sidebarStateRef.current === null) {
      sidebarStateRef.current = sidebarState
      return
    }
    if (sidebarStateRef.current === sidebarState) return

    sidebarStateRef.current = sidebarState
    if (layoutFreezeTimerRef.current !== null) {
      window.clearTimeout(layoutFreezeTimerRef.current)
    }

    const width = container.clientWidth
    if (width > 0) {
      setFrozenWidth(width)
      setIsLayoutFrozen(true)
    }

    layoutFreezeTimerRef.current = window.setTimeout(() => {
      layoutFreezeTimerRef.current = null
      setIsLayoutFrozen(false)
      setFrozenWidth(null)
      window.requestAnimationFrame(() => {
        const nextWidth = container.clientWidth
        if (nextWidth > 0 && nextWidth !== albumWidthRef.current) {
          albumWidthRef.current = nextWidth
          setAlbumWidth(nextWidth)
        }
      })
    }, 220)

    return () => {
      if (layoutFreezeTimerRef.current !== null) {
        window.clearTimeout(layoutFreezeTimerRef.current)
        layoutFreezeTimerRef.current = null
      }
    }
  }, [sidebarState])

  const setSelection = (next: number[] | ((prev: number[]) => number[])) => {
    setSelectedIds((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next
      selectedIdsRef.current = resolved
      if (isSelectingRef.current) {
        if (isInspectorOpenRef.current) {
          setInspectorOpen(resolved.length > 0)
        }
      } else {
        setInspectorOpen(resolved.length > 0)
      }
      return resolved
    })
  }

  // Reset state when album source changes (triggered by shared store)
  const prevAlbumSourceRef = useRef(albumSource)
  useEffect(() => {
    if (prevAlbumSourceRef.current === albumSource) return
    prevAlbumSourceRef.current = albumSource
    setNavContext({ type: NavType.All, value: allPhotosKey })
    setSelection([])
    setSearchValue("")
    if (albumSource === AlbumSource.CLOUD) {
      albumStoreActions.setCloudTypeFilter("")
      albumStoreActions.setCloudSearch("")
    }
  }, [albumSource])


  const handleFilterChange = (next: NavContext) => {
    setNavContext(next)
    setSelection([])
    if (isCloud) {
      const typeFilter = next.type === NavType.Provider ? next.value : ""
      albumStoreActions.setCloudTypeFilter(typeFilter)
    }
  }

  const { selectionBox, handleMouseDown, consumeSuppressCardClick } =
    useAlbumSelectionBox({
      viewMode,
      scrollViewportRef,
      itemRefs,
      selectedIdsRef,
      isInspectorOpenRef,
      isSelectingRef,
      setSelection,
      setInspectorOpen,
    })

  const handleCardClick = (
    id: number,
    modifier?: {
      shiftKey: boolean
      metaKey: boolean
      ctrlKey: boolean
    }
  ) => {
    if (consumeSuppressCardClick()) return
    const isMultiKey = isMacOS()
      ? modifier?.metaKey === true
      : modifier?.ctrlKey === true

    if (modifier?.shiftKey) {
      const currentIndex = displayImages.findIndex((image) => image.id === id)
      const anchorId = selectionAnchorIdRef.current ?? selectedIdsRef.current[selectedIdsRef.current.length - 1] ?? id
      const anchorIndex = displayImages.findIndex((image) => image.id === anchorId)

      if (currentIndex >= 0 && anchorIndex >= 0) {
        const minIndex = Math.min(anchorIndex, currentIndex)
        const maxIndex = Math.max(anchorIndex, currentIndex)
        const rangedIds = displayImages.slice(minIndex, maxIndex + 1).map((image) => image.id)

        if (isMultiKey) {
          setSelection((prev) => Array.from(new Set([...prev, ...rangedIds])))
        } else {
          setSelection(rangedIds)
        }
        return
      }
    }

    if (isMultiKey) {
      setSelection((prev) => {
        const hasItem = prev.includes(id)
        return hasItem ? prev.filter((value) => value !== id) : [...prev, id]
      })
      selectionAnchorIdRef.current = id
      return
    }

    selectionAnchorIdRef.current = id
    setSelection([id])
  }

  const toggleSelection = (id: number, checked?: boolean) => {
    setSelection((prev) => {
      const hasItem = prev.includes(id)
      const shouldSelect = checked ?? !hasItem
      if (shouldSelect) {
        selectionAnchorIdRef.current = id
        return hasItem ? prev : [...prev, id]
      }
      return prev.filter((value) => value !== id)
    })
  }

  const handleSelectAll = () => {
    if (displayImages.length === 0) return
    setSelection(isAllSelected ? [] : displayImages.map((image) => image.id))
  }

  // TODO(v3-post-launch): Restore collection edit handler when Collections inspector actions return.
  // const handleCollectionChange = (value: string) => {
  //   if (selectedIdsRef.current.length === 0) return
  //   const selected = new Set(selectedIdsRef.current)
  //   setImages((prev) =>
  //     prev.map((image) =>
  //       selected.has(image.id) ? { ...image, collection: value } : image
  //     )
  //   )
  // }

  const handleDeleteSelection = async () => {
    if (selectedIdsRef.current.length === 0) return
    const deletedDbIds = new Set(selectedImages.map((image) => image.dbId))

    await Promise.all(
      selectedImages.map(async (image) => {
        await albumAdapter.removeById(image.dbId)
      })
    )

    setImages((prev) => prev.filter((image) => !deletedDbIds.has(image.dbId)))
    setPreviewImages((prev) => prev.filter((image) => !deletedDbIds.has(image.dbId)))
    setSelection([])
  }

  const resolvePreviewImageId = (
    imagesToPreview: AlbumPhoto[],
    preferredId?: number | null
  ) => {
    if (imagesToPreview.length === 0) {
      toast(t("ALBUM_PREVIEW_EMPTY"))
      return null
    }

    const candidateId = preferredId ?? imagesToPreview[0]?.id ?? null
    if (candidateId === null) return null

    const exists = imagesToPreview.some((image) => image.id === candidateId)
    return exists ? candidateId : imagesToPreview[0]?.id ?? null
  }

  const openPreviewWithImages = (
    imagesToPreview: AlbumPhoto[],
    imageId?: number | null
  ) => {
    const resolvedId = resolvePreviewImageId(imagesToPreview, imageId)
    if (resolvedId === null) return
    if (!isPreviewOpen) {
      setPreviewSession((value) => value + 1)
    }
    setPreviewImages(imagesToPreview)
    setPreviewImageId(resolvedId)
    setPreviewOpen(true)
  }

  const openPreviewForSingle = (imageId: number) => {
    const image = imageMap.get(imageId)
    if (!image) return
    openPreviewWithImages([image], imageId)
  }

  const openPreviewFromAlbum = (imageId: number) => {
    if (selectedImages.length > 1 && selectedSet.has(imageId)) {
      openPreviewWithImages(selectedImages, imageId)
      return
    }
    openPreviewForSingle(imageId)
  }

  const openPreviewFromInspector = (imageId: number) => {
    if (selectedImages.length > 1) {
      openPreviewWithImages(selectedImages, imageId)
      return
    }
    openPreviewForSingle(imageId)
  }

  const handleToolbarPreview = () => {
    const imagesToPreview =
      selectedImages.length > 0 ? selectedImages : displayImages
    openPreviewWithImages(imagesToPreview, imagesToPreview[0]?.id)
  }

  const handlePreviewActiveIdChange = (id: number) => {
    setPreviewImageId(id)
  }

  // TODO(v3-post-launch): Restore tag mutation handlers when Tags inspector actions return.
  // const addTagToSelection = (tag: string) => {
  //   const trimmed = tag.trim()
  //   if (!trimmed || selectedIdsRef.current.length === 0) return
  //   const selected = new Set(selectedIdsRef.current)
  //   setImages((prev) =>
  //     prev.map((image) => {
  //       if (!selected.has(image.id)) return image
  //       if (image.tags.includes(trimmed)) return image
  //       return { ...image, tags: [...image.tags, trimmed] }
  //     })
  //   )
  // }

  // const removeTagFromSelection = (tag: string) => {
  //   if (selectedIdsRef.current.length === 0) return
  //   const selected = new Set(selectedIdsRef.current)
  //   setImages((prev) =>
  //     prev.map((image) => {
  //       if (!selected.has(image.id)) return image
  //       return { ...image, tags: image.tags.filter((value) => value !== tag) }
  //     })
  //   )
  // }

  // const handleTagSubmit = () => {
  //   const value = tagInput.trim()
  //   if (!value) return
  //   addTagToSelection(value)
  //   setTagInput("")
  // }

  const handleMasonryItemRef = (id: number, node: HTMLDivElement | null) => {
    if (node) {
      itemRefs.current.set(id, node)
    } else {
      itemRefs.current.delete(id)
    }
  }
  
  const handleUrlRewrite = (changes: AlbumUrlRewriteChange[]) => {
    if (changes.length === 0) return
    const changeMap = new Map(changes.map((change) => [change.id, change]))

    setImages((prev) =>
      prev.map((image) => {
        const change = changeMap.get(image.id)
        if (!change) return image
        return {
          ...image,
          imgUrl: change.nextSrc,
          originImgUrl: image.originImgUrl ?? change.originImgUrl,
          raw: {
            ...image.raw,
            imgUrl: change.nextSrc,
            originImgUrl: image.raw.originImgUrl ?? change.originImgUrl,
          },
        }
      })
    )

    setPreviewImages((prev) => {
      if (prev.length === 0) return prev
      let hasUpdate = false
      const next = prev.map((image) => {
        const change = changeMap.get(image.id)
        if (!change) return image
        hasUpdate = true
        return {
          ...image,
          imgUrl: change.nextSrc,
          originImgUrl: image.originImgUrl ?? change.originImgUrl,
          raw: {
            ...image.raw,
            imgUrl: change.nextSrc,
            originImgUrl: image.raw.originImgUrl ?? change.originImgUrl,
          },
        }
      })
      return hasUpdate ? next : prev
    })

    changes.forEach((change) => {
      const targetImage = images.find((image) => image.id === change.id)
      if (!targetImage) {
        return
      }

      albumAdapter.updateImageUrl(targetImage.dbId, change.nextSrc).catch((error) => {
        console.error(error)
      })
    })
  }


  const handleCloudImportAll = () => handleCloudImportAllFn(handleCloudFirstPageRefresh)

  const handleCloudDeleteSelection = async () => {
    if (selectedIdsRef.current.length === 0) return
    const dbIds = selectedImages.map((image) => image.dbId)
    try {
      const result = await cloudAlbumAdapter.deleteItems(dbIds)
      if (result.success) {
        albumStoreActions.setCloudItems(
          cloudItems.filter((item) => !dbIds.includes(item.dbId))
        )
        albumStoreActions.setCloudTotal(cloudTotal - dbIds.length)
        setSelection([])
        invalidateCloudAlbumStatsQuery().catch(console.warn)
      }
    } catch (error) {
      console.error(error)
      toast.error(t("ALBUM_CLOUD_DELETE_FAILED"))
    }
  }

  const handleCloudUrlRewrite = (changes: AlbumUrlRewriteChange[]) => {
    if (changes.length === 0) return
    const items = changes.map((change) => ({
      id: images.find((img) => img.id === change.id)?.dbId ?? cloudItems.find((img) => img.id === change.id)?.dbId ?? '',
      data: { imgUrl: change.nextSrc }
    })).filter((item) => item.id !== '')

    cloudAlbumAdapter.batchUpdate(items).then((result) => {
      if (result.success) {
        const changeMap = new Map(changes.map((c) => [c.id, c]))
        albumStoreActions.setCloudItems(
          cloudItems.map((item) => {
            const change = changeMap.get(item.id)
            if (!change) return item
            return { ...item, imgUrl: change.nextSrc, raw: { ...item.raw, imgUrl: change.nextSrc } }
          })
        )
      }
    }).catch((error) => {
      console.error(error)
    })
  }

  const isCloudAvailable = isCloudPaidUser

  const shouldShowCloudEmptyState = isCloud && !isCloudUserInfoLoading && (
    !isCloudAvailable || (cloudTotal === 0 && !cloudLoading)
  )

  const activeBreadcrumb = navContext.type === NavType.All
    ? t("ALBUM_ALL_PHOTOS")
    : navContext.type === NavType.Provider
      ? (isCloud
        ? picBeds.find((bed) => bed.type === navContext.value)?.name ?? navContext.value
        : visibleProviders.find((provider) => provider.type === navContext.value)?.name ?? navContext.value)
      : navContext.value

  return (
    <main className="flex min-h-0 min-w-0 flex-1 gap-4">
      <AlbumSidebar
        images={images}
        providers={visibleProviders}
        navContext={navContext}
        albumSource={albumSource}
        isCloudAvailable={isCloudAvailable}
        onFilterChange={handleFilterChange}
        onCloudRefresh={handleSidebarCloudRefresh}
      />

      <AppMainCard asChild>
        <section>
          <AlbumHeader
            activeBreadcrumb={activeBreadcrumb}
            searchValue={searchValue}
            onSearchValueChange={setSearchValue}
            onSelectAll={handleSelectAll}
            onOpenInspector={() => setInspectorOpen(true)}
            isAllSelected={isAllSelected}
            hasFilteredImages={displayImages.length > 0}
            hasSelection={selectedIds.length > 0}
            onPreview={handleToolbarPreview}
          />

          {isCloud ? <CloudImportProgressBanner onComplete={handleCloudFirstPageRefresh} /> : null}

          <div className="relative flex min-h-0 flex-1">
            {shouldShowCloudEmptyState ? (
              <CloudEmptyState
                userInfo={cloudUserInfo}
                cloudTotal={cloudTotal}
                cloudLoading={cloudLoading}
                onStartImport={handleCloudImportAll}
              />
            ) : isCloud && cloudLoading && cloudItems.length === 0 ? (
              <CloudAlbumLoading />
            ) : viewMode === AlbumViewMode.Masonry ? (
              <MasonryView
                images={displayImages}
                layoutScopeKey={masonryLayoutScopeKey}
                columnCount={masonryColumnCount}
                selectedSet={selectedSet}
                albumWidth={albumWidth}
                scrollRoot={scrollRoot}
                scrollViewportRef={scrollViewportRef}
                albumContentRef={albumContentRef}
                frozenWidth={frozenWidth}
                onScrollRootChange={handleMasonryScrollRootChange}
                onMouseDown={handleMouseDown}
                onCardClick={handleCardClick}
                onToggleSelection={toggleSelection}
                onPreview={openPreviewFromAlbum}
                onItemRefChange={handleMasonryItemRef}
                previewLabel={t("ALBUM_PREVIEW")}
                selectionBox={selectionBox}
                onEndReached={isCloud ? handleCloudLoadMore : undefined}
                hasMore={isCloud ? cloudHasMore : undefined}
                isLoadingMore={isCloud ? cloudLoading : undefined}
              />
            ) : (
              <div
                ref={handleScrollAreaWrapperRef}
                className="flex min-h-0 min-w-0 flex-1"
                onMouseDown={handleMouseDown}
              >
                <ScrollArea className="min-h-0 min-w-0 flex-1">
                  <div className="relative min-h-full overflow-x-hidden">
                    <div
                      ref={albumContentRef}
                      className="px-5 py-4"
                      style={frozenWidth ? { width: frozenWidth } : undefined}
                    >
                      <AlbumList
                        items={displayImages}
                        selectedIds={selectedSet}
                        onSelect={handleCardClick}
                        onToggleSelection={toggleSelection}
                        onPreviewOpen={openPreviewFromAlbum}
                        onToggleAll={handleSelectAll}
                        formatSize={formatSize}
                        scrollParent={scrollRoot}
                        labels={{
                          name: t("ALBUM_COLUMN_NAME"),
                          type: t("ALBUM_COLUMN_PROVIDER"),
                          size: t("ALBUM_COLUMN_SIZE"),
                          date: t("ALBUM_COLUMN_DATE"),
                        }}
                        selectAllLabel={t("SELECT_ALL")}
                        clearSelectionLabel={t("ALBUM_CLEAR_SELECTION")}
                        previewLabel={t("ALBUM_PREVIEW")}
                        onEndReached={isCloud ? handleCloudLoadMore : undefined}
                        isLoadingMore={isCloud ? cloudLoading : undefined}
                      />
                    </div>
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
          {selectedIds.length > 0 ? (
            <AlbumInspector
              isOpen={isInspectorOpen && selectedIds.length > 0}
              onOpenChange={setInspectorOpen}
              selectedIds={selectedIds}
              selectedImages={selectedImages}
              onDelete={isCloud ? handleCloudDeleteSelection : handleDeleteSelection}
              onPreviewOpen={openPreviewFromInspector}
              onUrlRewrite={isCloud ? handleCloudUrlRewrite : handleUrlRewrite}
              albumSource={albumSource}
            />
          ) : null}
          <AlbumPreview
            key={previewSession}
            isOpen={isPreviewOpen}
            images={previewImages}
            activeId={previewImageId}
            onClose={() => setPreviewOpen(false)}
            onActiveIdChange={handlePreviewActiveIdChange}
          />
        </section>
      </AppMainCard>
    </main>
  )
}
