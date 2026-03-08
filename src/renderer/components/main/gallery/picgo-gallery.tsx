import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { AppMainCard } from "@/components/common/app-main-card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSidebar } from "@/components/ui/sidebar"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
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
  filterGalleryImages,
  GalleryViewMode,
  getImageList,
  type GalleryPhoto,
  type NavContext,
  NavType,
} from "./utils"

// TODO(v3-post-launch): Restore tag suggestions when Tags UI returns.
// const tagSuggestions = ["Work", "Meme", "Design"]

function formatSize(sizeMb: number) {
  return `${sizeMb.toFixed(1)} MB`
}

export function PicGoGallery() {
  const { t } = useTranslation()
  const [images, setImages] = useState<GalleryPhoto[]>(() => getImageList())
  const [navContext, setNavContext] = useState<NavContext>({
    type: NavType.All,
    value: allPhotosKey,
  })
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [viewMode, setViewMode] = useState<GalleryViewMode>(
    GalleryViewMode.Masonry
  )
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

  const scrollAreaWrapperRef = useRef<HTMLDivElement | null>(null)
  const scrollViewportRef = useRef<HTMLDivElement | null>(null)
  const galleryContentRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const selectedIdsRef = useRef<number[]>([])
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

  // TODO(v3-post-launch): Restore selected tag derivation when Tags inspector actions return.
  // const selectedTags = getSelectedTags(selectedImages)

  const isAllSelected =
    filteredImages.length > 0 && selectedIds.length === filteredImages.length

  useEffect(() => {
    selectedIdsRef.current = selectedIds
  }, [selectedIds])

  useEffect(() => {
    isInspectorOpenRef.current = isInspectorOpen
  }, [isInspectorOpen])

  useEffect(() => {
    isLayoutFrozenRef.current = isLayoutFrozen
  }, [isLayoutFrozen])

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

  const handleFilterChange = (next: NavContext) => {
    setNavContext(next)
    setSelection([])
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

  const handleCardClick = (id: number) => {
    if (consumeSuppressCardClick()) return
    setSelection([id])
  }

  const toggleSelection = (id: number, checked?: boolean) => {
    setSelection((prev) => {
      const hasItem = prev.includes(id)
      const shouldSelect = checked ?? !hasItem
      if (shouldSelect) {
        return hasItem ? prev : [...prev, id]
      }
      return prev.filter((value) => value !== id)
    })
  }

  const handleSelectAll = () => {
    if (filteredImages.length === 0) return
    setSelection(isAllSelected ? [] : filteredImages.map((image) => image.id))
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

  const handleDeleteSelection = () => {
    if (selectedIdsRef.current.length === 0) return
    const selected = new Set(selectedIdsRef.current)
    setImages((prev) => prev.filter((image) => !selected.has(image.id)))
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
      selectedImages.length > 0 ? selectedImages : filteredImages
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
        }
      })
      return hasUpdate ? next : prev
    })
  }


  const activeBreadcrumb =
    navContext.type === NavType.All ? t("GALLERY_ALL_PHOTOS") : navContext.value

  return (
    <main className="flex min-h-0 min-w-0 flex-1 gap-4">
      <GallerySidebar
        images={images}
        navContext={navContext}
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
            hasFilteredImages={filteredImages.length > 0}
            hasSelection={selectedIds.length > 0}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onPreview={handleToolbarPreview}
          />

          <div className="relative flex min-h-0 flex-1">
            {viewMode === GalleryViewMode.Masonry ? (
              <MasonryView
                images={filteredImages}
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
                        items={filteredImages}
                        selectedIds={selectedSet}
                        onSelect={handleCardClick}
                        onToggleSelection={toggleSelection}
                        onPreviewOpen={openPreviewFromGallery}
                        onToggleAll={handleSelectAll}
                        formatSize={formatSize}
                        scrollParent={scrollRoot}
                        labels={{
                          name: t("GALLERY_COLUMN_NAME"),
                          provider: t("GALLERY_COLUMN_PROVIDER"),
                          size: t("GALLERY_COLUMN_SIZE"),
                          date: t("GALLERY_COLUMN_DATE"),
                        }}
                        selectAllLabel={t("SELECT_ALL")}
                        clearSelectionLabel={t("GALLERY_CLEAR_SELECTION")}
                        previewLabel={t("GALLERY_PREVIEW")}
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
              onDelete={handleDeleteSelection}
              onPreviewOpen={openPreviewFromInspector}
              onUrlRewrite={handleUrlRewrite}
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
