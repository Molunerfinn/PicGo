import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ComponentPropsWithoutRef,
  type RefObject,
  type MouseEvent,
  type SyntheticEvent,
  type UIEvent,
} from "react"
import { useMemoizedFn } from "ahooks"
import { createPortal } from "react-dom"
import { LoaderCircleIcon, Maximize2 } from "lucide-react"
import { VirtuosoMasonry, type ItemContent } from "@virtuoso.dev/masonry"

import { CloudImage } from "@/components/common/cloud-image"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { GALLERY_CLOUD_LOAD_MORE_THRESHOLD } from "@/utils/consts"
import type { AlbumPhoto } from "../utils"
import type { SelectionBox } from "../hooks/use-album-selection-box"

const masonryContainStyle: CSSProperties = {
  contentVisibility: "auto",
  containIntrinsicSize: "var(--app-gallery-masonry-intrinsic-size)",
}

type ImageSize = {
  width: number
  height: number
}

type MasonryContext = {
  selectedSet: Set<number>
  imageSizeOverrides: Record<number, ImageSize>
  masonryGap: number
  previewLabel: string
  onCardClick: (
    id: number,
    modifier?: {
      shiftKey: boolean
      metaKey: boolean
      ctrlKey: boolean
    }
  ) => void
  onToggleSelection: (id: number, checked?: boolean) => void
  onPreview: (id: number) => void
  onImageLoad: (image: AlbumPhoto) => (event: SyntheticEvent<HTMLImageElement>) => void
  onVideoLoad: (image: AlbumPhoto) => (event: SyntheticEvent<HTMLVideoElement>) => void
  onItemRefChange: (id: number, node: HTMLDivElement | null) => void
}

const placeholderAspectRatio = 4 / 3

function getMasonryGap(width: number) {
  if (width >= 1200) return 20
  if (width >= 600) return 15
  if (width >= 300) return 10
  return 5
}

function resolveImageSizing(
  image: AlbumPhoto,
  overrides: Record<number, ImageSize>
) {
  const override = overrides[image.id]
  const width = override?.width ?? image.width
  const height = override?.height ?? image.height
  const aspectRatio =
    width && height ? width / height : placeholderAspectRatio
  return { width, height, aspectRatio }
}

function getSelectionBoxRect(box: SelectionBox) {
  return {
    left: Math.min(box.startX, box.currentX),
    top: Math.min(box.startY, box.currentY),
    width: Math.abs(box.currentX - box.startX),
    height: Math.abs(box.currentY - box.startY),
  }
}

type LazyMediaProps = Omit<ComponentPropsWithoutRef<"img">, "type"> & {
  isVideo?: boolean
  onVideoLoad?: (event: SyntheticEvent<HTMLVideoElement>) => void
  type?: string
}

function LazyImage({
  className,
  style,
  isVideo,
  onVideoLoad,
  type,
  ...imgProps
}: LazyMediaProps) {
  const {
    src,
    alt,
    srcSet,
    sizes,
    width,
    height,
    crossOrigin,
    referrerPolicy,
    useMap,
    draggable,
    onLoad,
  } = imgProps
  const [isLoaded, setIsLoaded] = useState(false)
  const mediaClassName = cn(
    "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
    isLoaded ? "opacity-100" : "opacity-0"
  )
  const handleImageLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true)
    onLoad?.(event)
  }
  const handleVideoLoad = (event: SyntheticEvent<HTMLVideoElement>) => {
    setIsLoaded(true)
    onVideoLoad?.(event)
  }

  return (
    <div className={cn(className, "relative overflow-hidden")} style={style}>
      {!isLoaded ? (
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
      ) : null}
      {isVideo ? (
        <video
          src={src}
          width={width}
          height={height}
          draggable={draggable}
          className={mediaClassName}
          preload="metadata"
          muted
          playsInline
          onLoadedData={handleVideoLoad}
        />
      ) : (
        <CloudImage
          src={src}
          alt={alt ?? ""}
          srcSet={srcSet}
          sizes={sizes}
          width={width}
          height={height}
          crossOrigin={crossOrigin}
          referrerPolicy={referrerPolicy}
          useMap={useMap}
          draggable={draggable}
          className={mediaClassName}
          loading="lazy"
          decoding="async"
          onLoad={handleImageLoad}
          type={type}
        />
      )}
    </div>
  )
}

const MasonryItem: ItemContent<AlbumPhoto, MasonryContext> = ({
  data: photo,
  context,
}) => {
  if (!photo) {
    console.warn("MasonryItem: photo is undefined")
    return null
  }
  const isSelected = context.selectedSet.has(photo.id)
  const { aspectRatio, width, height } = resolveImageSizing(
    photo,
    context.imageSizeOverrides
  )

  return (
    <div style={{ paddingBottom: context.masonryGap }}>
      <div
        style={masonryContainStyle}
        data-album-item="true"
        ref={(node) => context.onItemRefChange(photo.id, node)}
        className={cn(
          "group relative overflow-hidden rounded-lg border transition-shadow",
          isSelected
            ? "border-primary/40 ring-2 ring-ring/40"
            : "border-transparent hover:border-border/80"
        )}
        onClick={(event) => {
          context.onCardClick(photo.id, {
            shiftKey: event.shiftKey,
            metaKey: event.metaKey,
            ctrlKey: event.ctrlKey
          })
        }}
      >
        <LazyImage
          src={photo.imgUrl}
          alt={photo.alt ?? ""}
          width={width}
          height={height}
          draggable={false}
          className="w-full"
          style={{ aspectRatio }}
          isVideo={photo.isVideo}
          onLoad={context.onImageLoad(photo)}
          onVideoLoad={context.onVideoLoad(photo)}
          type={photo.type}
        />
        <div
          data-album-interactive="true"
          className={cn(
            "absolute left-3 top-3 z-10",
            isSelected
              ? "opacity-100"
              : "opacity-0 transition-opacity group-hover:opacity-100"
          )}
          onClick={(event) => {
            event.stopPropagation()
          }}
        >
          <Checkbox
            className="cursor-pointer"
            checked={isSelected}
            onCheckedChange={(checked) =>
              context.onToggleSelection(photo.id, checked === true)
            }
          />
        </div>
        <div
          data-album-interactive="true"
          className="absolute right-3 top-3 z-10 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(event) => {
            event.stopPropagation()
          }}
        >
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(event) => {
              event.stopPropagation()
              context.onPreview(photo.id)
            }}
            title={context.previewLabel}
            aria-label={context.previewLabel}
            className="bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground shadow-sm"
          >
            <Maximize2 className="size-3" />
          </Button>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 overflow-hidden bg-background/60 text-foreground shadow-sm backdrop-blur-sm dark:bg-background/45">
          <div className="truncate px-2 py-1 text-center text-[10px] font-medium leading-none sm:text-xs">
            {photo.name}
          </div>
        </div>
      </div>
    </div>
  )
}

export type MasonryViewProps = {
  images: AlbumPhoto[]
  layoutScopeKey: string
  columnCount: number
  selectedSet: Set<number>
  albumWidth: number
  scrollRoot: HTMLElement | null
  scrollViewportRef: RefObject<HTMLDivElement | null>
  albumContentRef: RefObject<HTMLDivElement | null>
  frozenWidth: number | null
  onScrollRootChange: (root: HTMLElement | null) => void
  onMouseDown: (event: MouseEvent<HTMLDivElement>) => void
  onCardClick: (
    id: number,
    modifier?: {
      shiftKey: boolean
      metaKey: boolean
      ctrlKey: boolean
    }
  ) => void
  onToggleSelection: (id: number, checked?: boolean) => void
  onPreview: (id: number) => void
  onItemRefChange: (id: number, node: HTMLDivElement | null) => void
  previewLabel: string
  selectionBox: SelectionBox
  onEndReached?: () => void
  hasMore?: boolean
  isLoadingMore?: boolean
}

export function MasonryView({
  images,
  layoutScopeKey,
  columnCount,
  selectedSet,
  albumWidth,
  scrollRoot,
  scrollViewportRef,
  albumContentRef,
  frozenWidth,
  onScrollRootChange,
  onMouseDown,
  onCardClick,
  onToggleSelection,
  onPreview,
  onItemRefChange,
  previewLabel,
  selectionBox,
  onEndReached,
  hasMore = false,
  isLoadingMore = false,
}: MasonryViewProps) {
  const [imageSizeOverrides, setImageSizeOverrides] = useState<
    Record<number, ImageSize>
  >({})
  const masonryRootRef = useRef<HTMLDivElement | null>(null)
  const lastSyncedScrollerRef = useRef<HTMLDivElement | null>(null)
  const masonryGap = getMasonryGap(albumWidth)
  const masonryColumnCount = columnCount

  // Virtuoso creates its own scrolling element, so we grab that inner scroller
  // after mount and use it as the shared scroll root for selection and paging logic.
  const handleMasonryRootRef = useMemoizedFn((node: HTMLDivElement | null) => {
    if (masonryRootRef.current === node) {
      return
    }

    masonryRootRef.current = node
    if (!node) {
      lastSyncedScrollerRef.current = null
      scrollViewportRef.current = null
      onScrollRootChange(null)
      return
    }

    requestAnimationFrame(() => {
      if (masonryRootRef.current !== node) {
        return
      }

      const scroller =
        node.querySelector<HTMLDivElement>(
          "[data-testid='virtuoso-scroller']"
        ) ?? null

      if (lastSyncedScrollerRef.current === scroller) {
        return
      }

      if (scroller) {
        scroller.style.position = "relative"
      }

      lastSyncedScrollerRef.current = scroller
      scrollViewportRef.current = scroller
      onScrollRootChange(scroller)
    })
  })

  useEffect(() => {
    if (!scrollRoot || !onEndReached) return

    // If the first page does not overflow yet, auto-load the next page once.
    // Without this, the user would be stuck on an unscrollable viewport.
    const maybeFillViewport = () => {
      if (isLoadingMore || !hasMore) return

      const hasOverflow = scrollRoot.scrollHeight > scrollRoot.clientHeight
      if (hasOverflow) return

      onEndReached()
    }

    const frameId = window.requestAnimationFrame(maybeFillViewport)

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [scrollRoot, onEndReached, isLoadingMore, hasMore, images.length])

  // Scroll events come from Virtuoso's internal scroller, so capture them here
  // and only fetch more when the real scrolling container is close to the bottom.
  const handleMasonryScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!onEndReached || isLoadingMore || !hasMore) return

    const currentTarget = event.currentTarget

    if (scrollViewportRef.current !== currentTarget) {
      scrollViewportRef.current = currentTarget
    }

    if (scrollRoot !== currentTarget) {
      onScrollRootChange(currentTarget)
    }

    const remainingDistance =
      currentTarget.scrollHeight - currentTarget.clientHeight - currentTarget.scrollTop

    if (remainingDistance > GALLERY_CLOUD_LOAD_MORE_THRESHOLD) return

    onEndReached()
  }

  const handleMasonryImageLoad =
    (image: AlbumPhoto) => (event: SyntheticEvent<HTMLImageElement>) => {
      if (image.height) return
      const { naturalWidth, naturalHeight } = event.currentTarget
      if (!naturalWidth || !naturalHeight) return
      setImageSizeOverrides((prev) => {
        const current = prev[image.id]
        if (
          current?.width === naturalWidth &&
          current?.height === naturalHeight
        ) {
          return prev
        }
        return {
          ...prev,
          [image.id]: { width: naturalWidth, height: naturalHeight },
        }
      })
    }

  const handleMasonryVideoLoad =
    (image: AlbumPhoto) => (event: SyntheticEvent<HTMLVideoElement>) => {
      if (image.height) return
      const { videoWidth, videoHeight } = event.currentTarget
      if (!videoWidth || !videoHeight) return
      setImageSizeOverrides((prev) => {
        const current = prev[image.id]
        if (
          current?.width === videoWidth &&
          current?.height === videoHeight
        ) {
          return prev
        }
        return {
          ...prev,
          [image.id]: { width: videoWidth, height: videoHeight },
        }
      })
    }

  const masonryContext: MasonryContext = {
    selectedSet,
    imageSizeOverrides,
    masonryGap,
    previewLabel,
    onCardClick,
    onToggleSelection,
    onPreview,
    onImageLoad: handleMasonryImageLoad,
    onVideoLoad: handleMasonryVideoLoad,
    onItemRefChange,
  }

  const selectionBoxPortal =
    selectionBox.isVisible && scrollRoot
      ? createPortal(
        <div
          className="border-primary/60 bg-primary/10 pointer-events-none absolute z-20 border"
          style={getSelectionBoxRect(selectionBox)}
        />,
        scrollRoot
      )
      : null
  return (
    <div
      ref={handleMasonryRootRef}
      className="flex min-h-0 min-w-0 flex-1"
      onMouseDown={onMouseDown}
    >
      <div
        ref={albumContentRef}
        className="relative min-h-0 min-w-0 flex-1"
        style={frozenWidth ? { width: frozenWidth } : undefined}
      >
        <VirtuosoMasonry
          key={`${masonryColumnCount}:${layoutScopeKey}`}
          data={images}
          columnCount={masonryColumnCount}
          ItemContent={MasonryItem}
          context={masonryContext}
          className="relative h-full w-full px-5 py-4 select-none"
          style={{ columnGap: masonryGap }}
          onScrollCapture={handleMasonryScroll}
        />
        {isLoadingMore && images.length > 0 ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center">
            <div className="bg-background/85 text-muted-foreground flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm backdrop-blur-sm">
              <LoaderCircleIcon className="size-4 animate-spin" />
            </div>
          </div>
        ) : null}
        {selectionBoxPortal}
      </div>
    </div>
  )
}
