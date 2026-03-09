import {
  useRef,
  useState,
  type CSSProperties,
  type ComponentPropsWithoutRef,
  type MutableRefObject,
  type MouseEvent,
  type SyntheticEvent,
} from "react"
import { createPortal } from "react-dom"
import { Maximize2 } from "lucide-react"
import { VirtuosoMasonry, type ItemContent } from "@virtuoso.dev/masonry"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { GalleryPhoto } from "../utils"
import type { SelectionBox } from "../hooks/use-gallery-selection-box"

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
  onCardClick: (id: number) => void
  onToggleSelection: (id: number, checked?: boolean) => void
  onPreview: (id: number) => void
  onImageLoad: (image: GalleryPhoto) => (event: SyntheticEvent<HTMLImageElement>) => void
  onItemRefChange: (id: number, node: HTMLDivElement | null) => void
}

const placeholderAspectRatio = 4 / 3

function getGalleryColumnCount(width: number) {
  if (width < 520) return 1
  if (width < 760) return 2
  if (width < 840) return 3
  return 4
}

function getMasonryGap(width: number) {
  if (width >= 1200) return 20
  if (width >= 600) return 15
  if (width >= 300) return 10
  return 5
}

function resolveImageSizing(
  image: GalleryPhoto,
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

function LazyImage({
  className,
  style,
  ...imgProps
}: ComponentPropsWithoutRef<"img">) {
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
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const isLoaded = loadedSrc !== null
  const imageClassName = cn(
    "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
    isLoaded ? "opacity-100" : "opacity-0"
  )
  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    setLoadedSrc(src ?? null)
    onLoad?.(event)
  }

  return (
    <div className={cn(className, "relative overflow-hidden")} style={style}>
      {!isLoaded ? (
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
      ) : null}
      <img
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
        className={imageClassName}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
      />
    </div>
  )
}

const MasonryItem: ItemContent<GalleryPhoto, MasonryContext> = ({
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
        data-gallery-item="true"
        ref={(node) => context.onItemRefChange(photo.id, node)}
        className={cn(
          "group relative overflow-hidden rounded-2xl border transition-shadow",
          isSelected
            ? "border-primary/40 ring-2 ring-ring/40"
            : "border-transparent hover:border-border/80"
        )}
        onClick={() => context.onCardClick(photo.id)}
      >
        <LazyImage
          src={photo.imgUrl}
          alt={photo.alt ?? ""}
          width={width}
          height={height}
          draggable={false}
          className="w-full"
          style={{ aspectRatio }}
          onLoad={context.onImageLoad(photo)}
        />
        <div
          data-gallery-interactive="true"
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
          data-gallery-interactive="true"
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
  images: GalleryPhoto[]
  selectedSet: Set<number>
  galleryWidth: number
  scrollRoot: HTMLElement | null
  scrollViewportRef: MutableRefObject<HTMLDivElement | null>
  galleryContentRef: MutableRefObject<HTMLDivElement | null>
  frozenWidth: number | null
  onScrollRootChange: (root: HTMLElement | null) => void
  onMouseDown: (event: MouseEvent<HTMLDivElement>) => void
  onCardClick: (id: number) => void
  onToggleSelection: (id: number, checked?: boolean) => void
  onPreview: (id: number) => void
  onItemRefChange: (id: number, node: HTMLDivElement | null) => void
  previewLabel: string
  selectionBox: SelectionBox
}

export function MasonryView({
  images,
  selectedSet,
  galleryWidth,
  scrollRoot,
  scrollViewportRef,
  galleryContentRef,
  frozenWidth,
  onScrollRootChange,
  onMouseDown,
  onCardClick,
  onToggleSelection,
  onPreview,
  onItemRefChange,
  previewLabel,
  selectionBox,
}: MasonryViewProps) {
  const [imageSizeOverrides, setImageSizeOverrides] = useState<
    Record<number, ImageSize>
  >({})
  const masonryRootRef = useRef<HTMLDivElement | null>(null)

  const handleMasonryRootRef = (node: HTMLDivElement | null) => {
    masonryRootRef.current = node
    if (!node) return
    requestAnimationFrame(() => {
      const scroller =
        node.querySelector<HTMLDivElement>(
          "[data-testid='virtuoso-scroller']"
        ) ?? null
      if (scroller) {
        scroller.style.position = "relative"
      }
      scrollViewportRef.current = scroller
      onScrollRootChange(scroller)
    })
  }

  const handleMasonryImageLoad =
    (image: GalleryPhoto) => (event: SyntheticEvent<HTMLImageElement>) => {
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

  const masonryGap = getMasonryGap(galleryWidth)
  const masonryColumnCount = galleryWidth
    ? getGalleryColumnCount(galleryWidth)
    : 2

  const masonryContext: MasonryContext = {
    selectedSet,
    imageSizeOverrides,
    masonryGap,
    previewLabel,
    onCardClick,
    onToggleSelection,
    onPreview,
    onImageLoad: handleMasonryImageLoad,
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
        ref={galleryContentRef}
        className="min-h-0 min-w-0 flex-1"
        style={frozenWidth ? { width: frozenWidth } : undefined}
      >
        <VirtuosoMasonry
          key={images.map((img) => img.id).join("-")}
          data={images}
          columnCount={masonryColumnCount}
          ItemContent={MasonryItem}
          context={masonryContext}
          className="relative h-full w-full px-5 py-4 select-none"
          style={{ columnGap: masonryGap }}
        />
        {selectionBoxPortal}
      </div>
    </div>
  )
}
