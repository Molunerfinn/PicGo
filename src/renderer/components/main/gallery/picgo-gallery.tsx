import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { galleryAdapter } from "@/adapters/gallery"
import { cloudAlbumAdapter } from "@/adapters/cloud-album"
import { AppMainCard } from "@/components/common/app-main-card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSidebar } from "@/components/ui/sidebar-context"
import { useIPCOn } from "@/hooks/useIPC"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { appActions, galleryStoreActions, useAppStore, useGalleryStore } from "@/store"
import {
  CLOUD_ALBUM_PAGE_SIZE,
  GALLERY_MASONRY_COLUMN_COUNT_DEFAULT,
} from "@/utils/consts"
import { isMacOS } from "@/utils/bridge"
import { AlbumSource } from "#/types/cloudAlbum"
import { GalleryHeader } from "./gallery-header"
import { GallerySidebar, allPhotosKey } from "./gallery-sidebar"
import { GalleryList } from "./gallery-list"
import { GalleryInspector } from "./gallery-inspector"
import { GalleryPreview } from "./gallery-preview"
import { MasonryView } from "./masonry-view"
import type { GalleryUrlRewriteChange } from "./gallery-url-rewrite-dialog"
import {
  useGallerySelectionBox,
} from "./hooks/use-gallery-selection-box"
import {
  buildGalleryPhotos,
  filterGalleryImages,
  GalleryViewMode,
  type GalleryProviderFilter,
  type GalleryPhoto,
  type NavContext,
  NavType,
} from "./utils"
import { IRPCActionType } from "~/universal/types/enum"
import { CloudEmptyState } from "./cloud-empty-state"
import { CloudImportProgressBanner } from "./cloud-import-progress"
import { CloudGalleryLoading } from "./cloud-loading"

// TODO(v3-post-launch): Restore tag suggestions when Tags UI returns.
// const tagSuggestions = ["Work", "Meme", "Design"]

function formatSize(sizeMb: number) {
  if (sizeMb <= 0) {
    return "--"
  }

  return `${sizeMb.toFixed(1)} MB`
}

export function PicGoGallery() {
  const { t } = useTranslation()
  const [images, setImages] = useState<GalleryPhoto[]>([])
  const [navContext, setNavContext] = useState<NavContext>({
    type: NavType.All,
    value: allPhotosKey,
  })
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [searchValue, setSearchValue] = useState("")
  const [isInspectorOpen, setInspectorOpen] = useState(false)
  const [isPreviewOpen, setPreviewOpen] = useState(false)
  const [previewImageId, setPreviewImageId] = useState<number | null>(null)
  const [previewImages, setPreviewImages] = useState<GalleryPhoto[]>([])
  const [previewSession, setPreviewSession] = useState(0)
  // TODO(v3-post-launch): Restore tag input state when Tags inspector actions return.
  // const [tagInput, setTagInput] = useState("")
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null)
  const [galleryWidth, setGalleryWidth] = useState(0)
  const [isLayoutFrozen, setIsLayoutFrozen] = useState(false)
  const [frozenWidth, setFrozenWidth] = useState<number | null>(null)
  const { state: sidebarState } = useSidebar()
  const viewMode = useGalleryStore.use.viewMode()
  const masonryColumnCount =
    useGalleryStore.use.masonryColumnCount() || GALLERY_MASONRY_COLUMN_COUNT_DEFAULT
  const picBeds = useAppStore.use.picBeds()
  const cloudUserInfo = useAppStore.use.picgoCloud().userInfo
  const albumSource = useGalleryStore.use.albumSource()
  const cloudItems = useGalleryStore.use.cloudItems()
  const cloudTotal = useGalleryStore.use.cloudTotal()
  const cloudLoading = useGalleryStore.use.cloudLoading()
  const cloudSearch = useGalleryStore.use.cloudSearch()
  const cloudTypeFilter = useGalleryStore.use.cloudTypeFilter()
  const cloudProviderStats = useGalleryStore.use.cloudProviderStats()
  const isCloud = albumSource === AlbumSource.CLOUD
  const [debouncedCloudSearch, setDebouncedCloudSearch] = useState("")

  const scrollAreaWrapperRef = useRef<HTMLDivElement | null>(null)
  const scrollViewportRef = useRef<HTMLDivElement | null>(null)
  const galleryContentRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const selectedIdsRef = useRef<number[]>([])
  const selectionAnchorIdRef = useRef<number | null>(null)
  const galleryWidthRef = useRef(0)
  const isSelectingRef = useRef(false)
  const isInspectorOpenRef = useRef(false)
  const isLayoutFrozenRef = useRef(false)
  const sidebarStateRef = useRef<typeof sidebarState | null>(null)
  const layoutFreezeTimerRef = useRef<number | null>(null)

  const imageMap = new Map(images.map((image) => [image.id, image]))
  const selectedSet = new Set(selectedIds)
  const selectedImages = selectedIds
    .map((id) => imageMap.get(id))
    .filter((image): image is GalleryPhoto => Boolean(image))

  const filteredImages = filterGalleryImages(images, navContext, searchValue)
  const displayImages = isCloud ? cloudItems : filteredImages
  const visibleProviders: GalleryProviderFilter[] = picBeds
    .filter((item) => item.visible !== false)
    .map((item) => ({
      type: item.type,
      name: item.name,
      count: images.filter((image) => image.type === item.type).length,
    }))
  const cloudProviderFilters: GalleryProviderFilter[] = cloudProviderStats.length > 0
    ? cloudProviderStats.map((stat) => {
      const bed = picBeds.find((b) => b.type === stat.type)
      return {
        type: stat.type,
        name: bed?.name ?? stat.type,
        count: stat.count,
      }
    })
    : (() => {
      // Fallback: derive providers from loaded cloud items when stats API is unavailable
      const countMap = new Map<string, number>()
      for (const item of cloudItems) {
        if (item.type) {
          countMap.set(item.type, (countMap.get(item.type) ?? 0) + 1)
        }
      }
      return Array.from(countMap.entries()).map(([type, count]) => {
        const bed = picBeds.find((b) => b.type === type)
        return { type, name: bed?.name ?? type, count }
      })
    })()

  // TODO(v3-post-launch): Restore selected tag derivation when Tags inspector actions return.
  // const selectedTags = getSelectedTags(selectedImages)

  const isAllSelected =
    displayImages.length > 0 && selectedIds.length === displayImages.length

  const [refreshNonce, setRefreshNonce] = useState(0)

  useIPCOn(IRPCActionType.UPDATE_GALLERY, () => {
    if (!isCloud) {
      setRefreshNonce((value) => value + 1)
    }
  })

  useIPCOn(IRPCActionType.UPDATE_CLOUD_ALBUM, () => {
    if (isCloud) {
      loadCloudFirstPage()
    }
  })

  useEffect(() => {
    selectedIdsRef.current = selectedIds
  }, [selectedIds])

  useEffect(() => {
    isInspectorOpenRef.current = isInspectorOpen
  }, [isInspectorOpen])

  useEffect(() => {
    isLayoutFrozenRef.current = isLayoutFrozen
  }, [isLayoutFrozen])

  useEffect(() => {
    async function hydrateGalleryUiState () {
      try {
        await galleryStoreActions.ensureHydrated()
      } catch (error) {
        console.error(error)
      }
    }

    hydrateGalleryUiState()
  }, [])

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
    galleryStoreActions.setCloudSearch(debouncedCloudSearch)
  }, [debouncedCloudSearch, isCloud])

  const loadCloudFirstPage = async () => {
    galleryStoreActions.setCloudLoading(true)
    galleryStoreActions.resetCloudPagination()
    try {
      // Load stats first so sidebar can render immediately
      const statsPromise = cloudAlbumAdapter.getStats().then((statsResult) => {
        if (statsResult.success) {
          galleryStoreActions.setCloudProviderStats(statsResult.data.types)
          galleryStoreActions.setCloudTotal(statsResult.data.total)
        }
      }).catch(() => {})

      const query = {
        limit: CLOUD_ALBUM_PAGE_SIZE,
        offset: 0,
        sort: 'newest' as const,
        ...(cloudSearch ? { search: cloudSearch } : {}),
        ...(cloudTypeFilter ? { type: cloudTypeFilter } : {})
      }
      const result = await cloudAlbumAdapter.list(query)
      if (result.success) {
        const photos = buildGalleryPhotos(result.data.items, picBeds)
        galleryStoreActions.setCloudItems(photos)
        galleryStoreActions.setCloudTotal(result.data.total)
        galleryStoreActions.setCloudOffset(result.data.items.length)
        galleryStoreActions.setCloudHasMore(result.data.items.length < result.data.total)
      }

      await statsPromise
    } catch (error) {
      console.error(error)
      toast.error(t("GALLERY_CLOUD_LOAD_FAILED"))
    } finally {
      galleryStoreActions.setCloudLoading(false)
    }
  }

  const cloudLoadingLockRef = useRef(false)
  const loadCloudNextPage = async () => {
    if (cloudLoadingLockRef.current) return
    const state = useGalleryStore.getState()
    if (!state.cloudHasMore) return
    cloudLoadingLockRef.current = true
    galleryStoreActions.setCloudLoading(true)
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
        const photos = buildGalleryPhotos(result.data.items, picBeds)
        galleryStoreActions.appendCloudItems(photos)
        galleryStoreActions.setCloudOffset(state.cloudOffset + result.data.items.length)
        galleryStoreActions.setCloudHasMore(state.cloudOffset + result.data.items.length < result.data.total)
      }
    } catch (error) {
      console.error(error)
    } finally {
      cloudLoadingLockRef.current = false
      galleryStoreActions.setCloudLoading(false)
    }
  }

  // Local gallery data fetch
  useEffect(() => {
    if (isCloud) return
    async function refreshGalleryPage () {
      try {
        await appActions.ensureHydrated()
        const galleryItems = await galleryAdapter.getGalleryItems()
        setImages(buildGalleryPhotos(galleryItems, picBeds))
      } catch (error) {
        console.error(error)
      }
    }

    refreshGalleryPage()
  }, [picBeds, refreshNonce, isCloud])

  // Cloud gallery data fetch
   
  useEffect(() => {
    if (!isCloud) return
    loadCloudFirstPage()
  }, [isCloud, cloudSearch, cloudTypeFilter])

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
    const container = galleryContentRef.current
    if (!container) return

    const commitWidth = (nextWidth: number) => {
      if (nextWidth <= 0 || nextWidth === galleryWidthRef.current) return
      galleryWidthRef.current = nextWidth
      setGalleryWidth(nextWidth)
    }

    const updateWidth = () => {
      const nextWidth = container.clientWidth
      if (nextWidth === galleryWidthRef.current) return
      if (isLayoutFrozenRef.current) return
      commitWidth(nextWidth)
    }

    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(container)

    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    const container = galleryContentRef.current
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
        if (nextWidth > 0 && nextWidth !== galleryWidthRef.current) {
          galleryWidthRef.current = nextWidth
          setGalleryWidth(nextWidth)
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

  const handleAlbumSourceChange = (source: AlbumSource) => {
    galleryStoreActions.setAlbumSource(source)
    setNavContext({ type: NavType.All, value: allPhotosKey })
    setSelection([])
    setSearchValue("")
    if (source === AlbumSource.CLOUD) {
      galleryStoreActions.setCloudTypeFilter("")
      galleryStoreActions.setCloudSearch("")
    }
  }

  const handleFilterChange = (next: NavContext) => {
    setNavContext(next)
    setSelection([])
    if (isCloud) {
      const typeFilter = next.type === NavType.Provider ? next.value : ""
      galleryStoreActions.setCloudTypeFilter(typeFilter)
    }
  }

  const { selectionBox, handleMouseDown, consumeSuppressCardClick } =
    useGallerySelectionBox({
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
        await galleryAdapter.removeById(image.dbId)
      })
    )

    setImages((prev) => prev.filter((image) => !deletedDbIds.has(image.dbId)))
    setPreviewImages((prev) => prev.filter((image) => !deletedDbIds.has(image.dbId)))
    setSelection([])
  }

  const resolvePreviewImageId = (
    imagesToPreview: GalleryPhoto[],
    preferredId?: number | null
  ) => {
    if (imagesToPreview.length === 0) {
      toast(t("GALLERY_PREVIEW_EMPTY"))
      return null
    }

    const candidateId = preferredId ?? imagesToPreview[0]?.id ?? null
    if (candidateId === null) return null

    const exists = imagesToPreview.some((image) => image.id === candidateId)
    return exists ? candidateId : imagesToPreview[0]?.id ?? null
  }

  const openPreviewWithImages = (
    imagesToPreview: GalleryPhoto[],
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

  const openPreviewFromGallery = (imageId: number) => {
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
  
  const handleUrlRewrite = (changes: GalleryUrlRewriteChange[]) => {
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

      galleryAdapter.updateImageUrl(targetImage.dbId, change.nextSrc).catch((error) => {
        console.error(error)
      })
    })
  }


  const handleCloudStartImport = async () => {
    try {
      // Enable auto-import first
      const autoImportResult = await cloudAlbumAdapter.setAutoImport(true)
      if (autoImportResult.success) {
        appActions.setPicGoCloudUserInfo(autoImportResult.data)
      }
      // Import all local gallery items
      const localItems = await galleryAdapter.getGalleryItems()
      if (localItems.length > 0) {
        const importResult = await cloudAlbumAdapter.importItems(localItems)
        if (importResult.success) {
          toast.success(t("GALLERY_CLOUD_IMPORT_SUCCESS", { num: String(importResult.data.created) }))
          loadCloudFirstPage()
        }
      }
    } catch (error) {
      console.error(error)
      toast.error(t("GALLERY_CLOUD_IMPORT_FAILED"))
    }
  }

  const handleCloudDeleteSelection = async () => {
    if (selectedIdsRef.current.length === 0) return
    const dbIds = selectedImages.map((image) => image.dbId)
    try {
      const result = await cloudAlbumAdapter.deleteItems(dbIds)
      if (result.success) {
        galleryStoreActions.setCloudItems(
          cloudItems.filter((item) => !dbIds.includes(item.dbId))
        )
        galleryStoreActions.setCloudTotal(cloudTotal - dbIds.length)
        setSelection([])
        toast.success(t("OPERATION_SUCCEED"))
      }
    } catch (error) {
      console.error(error)
      toast.error(t("GALLERY_CLOUD_DELETE_FAILED"))
    }
  }

  const handleCloudUrlRewrite = (changes: GalleryUrlRewriteChange[]) => {
    if (changes.length === 0) return
    const items = changes.map((change) => ({
      id: images.find((img) => img.id === change.id)?.dbId ?? cloudItems.find((img) => img.id === change.id)?.dbId ?? '',
      data: { imgUrl: change.nextSrc }
    })).filter((item) => item.id !== '')

    cloudAlbumAdapter.batchUpdate(items).then((result) => {
      if (result.success) {
        const changeMap = new Map(changes.map((c) => [c.id, c]))
        galleryStoreActions.setCloudItems(
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

  const isCloudPaidUser = cloudUserInfo !== null && cloudUserInfo !== undefined &&
    typeof cloudUserInfo.plan === 'number' && cloudUserInfo.plan > 0
  const isCloudAvailable = isCloudPaidUser

  const shouldShowCloudEmptyState = isCloud && (
    !isCloudAvailable || (cloudTotal === 0 && !cloudLoading)
  )

  const activeProviders = isCloud ? cloudProviderFilters : visibleProviders
  const activeBreadcrumb = navContext.type === NavType.All
    ? t("GALLERY_ALL_PHOTOS")
    : navContext.type === NavType.Provider
      ? activeProviders.find((provider) => provider.type === navContext.value)?.name ?? navContext.value
      : navContext.value

  return (
    <main className="flex min-h-0 min-w-0 flex-1 gap-4">
      <GallerySidebar
        images={images}
        providers={visibleProviders}
        navContext={navContext}
        albumSource={albumSource}
        isCloudAvailable={isCloudAvailable}
        cloudLoading={cloudLoading}
        cloudProviders={cloudProviderFilters}
        cloudTotal={cloudTotal}
        onAlbumSourceChange={handleAlbumSourceChange}
        onFilterChange={handleFilterChange}
      />

      <AppMainCard asChild>
        <section>
          <GalleryHeader
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

          {isCloud ? <CloudImportProgressBanner onComplete={loadCloudFirstPage} /> : null}

          <div className="relative flex min-h-0 flex-1">
            {shouldShowCloudEmptyState ? (
              <CloudEmptyState
                userInfo={cloudUserInfo}
                cloudTotal={cloudTotal}
                cloudLoading={cloudLoading}
                onStartImport={handleCloudStartImport}
              />
            ) : isCloud && cloudLoading && cloudItems.length === 0 ? (
              <CloudGalleryLoading />
            ) : viewMode === GalleryViewMode.Masonry ? (
              <MasonryView
                images={displayImages}
                columnCount={masonryColumnCount}
                selectedSet={selectedSet}
                galleryWidth={galleryWidth}
                scrollRoot={scrollRoot}
                scrollViewportRef={scrollViewportRef}
                galleryContentRef={galleryContentRef}
                frozenWidth={frozenWidth}
                onScrollRootChange={handleMasonryScrollRootChange}
                onMouseDown={handleMouseDown}
                onCardClick={handleCardClick}
                onToggleSelection={toggleSelection}
                onPreview={openPreviewFromGallery}
                onItemRefChange={handleMasonryItemRef}
                previewLabel={t("GALLERY_PREVIEW")}
                selectionBox={selectionBox}
                onEndReached={isCloud ? loadCloudNextPage : undefined}
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
                      ref={galleryContentRef}
                      className="px-5 py-4"
                      style={frozenWidth ? { width: frozenWidth } : undefined}
                    >
                      <GalleryList
                        items={displayImages}
                        selectedIds={selectedSet}
                        onSelect={handleCardClick}
                        onToggleSelection={toggleSelection}
                        onPreviewOpen={openPreviewFromGallery}
                        onToggleAll={handleSelectAll}
                        formatSize={formatSize}
                        scrollParent={scrollRoot}
                        labels={{
                          name: t("GALLERY_COLUMN_NAME"),
                          type: t("GALLERY_COLUMN_PROVIDER"),
                          size: t("GALLERY_COLUMN_SIZE"),
                          date: t("GALLERY_COLUMN_DATE"),
                        }}
                        selectAllLabel={t("SELECT_ALL")}
                        clearSelectionLabel={t("GALLERY_CLEAR_SELECTION")}
                        previewLabel={t("GALLERY_PREVIEW")}
                        onEndReached={isCloud ? loadCloudNextPage : undefined}
                      />
                    </div>
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
          {selectedIds.length > 0 ? (
            <GalleryInspector
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
          <GalleryPreview
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
