import { forwardRef, useState, type HTMLAttributes } from "react"
import { TableVirtuoso, type TableComponents } from "react-virtuoso"

import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { TableCell, TableHead, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

export type GalleryListItem = {
  id: number
  imgUrl: string
  originImgUrl?: string
  alt?: string
  name: string
  provider: string
  collection: string
  sizeMb: number
  date: string
  isVideo?: boolean
}

export type GalleryListLabels = {
  name: string
  provider: string
  size: string
  date: string
}

type GalleryListProps = {
  items: GalleryListItem[]
  selectedIds: Set<number>
  onSelect: (
    id: number,
    modifier?: {
      shiftKey: boolean
      metaKey: boolean
      ctrlKey: boolean
    }
  ) => void
  onToggleSelection: (id: number, checked?: boolean) => void
  onPreviewOpen: (id: number) => void
  onToggleAll: () => void
  formatSize: (sizeMb: number) => string
  scrollParent: HTMLElement | null
  labels: GalleryListLabels
  selectAllLabel: string
  clearSelectionLabel: string
  previewLabel: string
}

type GalleryListContext = {
  selectedIds: Set<number>
  onSelect: (
    id: number,
    modifier?: {
      shiftKey: boolean
      metaKey: boolean
      ctrlKey: boolean
    }
  ) => void
  onToggleSelection: (id: number, checked?: boolean) => void
  onPreviewOpen: (id: number) => void
  formatSize: (sizeMb: number) => string
  previewLabel: string
}

const GalleryTable = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
  ({ className, children, ...props }, ref) => (
    <table
      ref={ref}
      {...props}
      className={cn("w-full table-fixed caption-bottom text-sm", className)}
    >
      <colgroup>
        <col />
        <col className="w-32" />
        <col className="w-20" />
        <col className="w-40" />
      </colgroup>
      {children}
    </table>
  )
)
GalleryTable.displayName = "GalleryTable"

const GalleryTableHead = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} {...props} className={cn("[&_tr]:border-b", className)} />
))
GalleryTableHead.displayName = "GalleryTableHead"

const GalleryTableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    {...props}
    className={cn("[&_tr:last-child]:border-0", className)}
  />
))
GalleryTableBody.displayName = "GalleryTableBody"

const galleryTableComponents: TableComponents<GalleryListItem, GalleryListContext> = {
  Table: GalleryTable,
  TableHead: GalleryTableHead,
  TableBody: GalleryTableBody,
  TableRow: ({ item, context, ...props }) => {
    const isSelected = context.selectedIds.has(item.id)
    return (
      <TableRow
        {...props}
        data-gallery-item="true"
        data-state={isSelected ? "selected" : undefined}
        onClick={(event) => {
          context.onSelect(item.id, {
            shiftKey: event.shiftKey,
            metaKey: event.metaKey,
            ctrlKey: event.ctrlKey
          })
        }}
        className="cursor-pointer"
      />
    )
  },
}

function GalleryListThumbnail({
  imgUrl,
  alt,
  isVideo,
  onClick,
  label,
}: {
  imgUrl: string
  alt: string
  isVideo?: boolean
  onClick: () => void
  label: string
}) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <button
      type="button"
      data-gallery-interactive="true"
      title={label}
      aria-label={label}
      className="border-border/60 bg-muted/40 size-10 overflow-hidden rounded-lg border cursor-zoom-in"
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
    >
      {!isLoaded ? <Skeleton className="h-full w-full rounded-none" /> : null}
      {isVideo ? (
        <video
          src={imgUrl}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          draggable={false}
          preload="metadata"
          muted
          playsInline
          onLoadedData={() => setIsLoaded(true)}
        />
      ) : (
        <img
          src={imgUrl}
          alt={alt}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          loading="lazy"
          decoding="async"
          draggable={false}
          onLoad={() => setIsLoaded(true)}
        />
      )}
    </button>
  )
}

export function GalleryList({
  items,
  selectedIds,
  onSelect,
  onToggleSelection,
  onPreviewOpen,
  onToggleAll,
  formatSize,
  scrollParent,
  labels,
  selectAllLabel,
  clearSelectionLabel,
  previewLabel,
}: GalleryListProps) {
  const selectedCount = items.reduce(
    (count, item) => count + Number(selectedIds.has(item.id)),
    0
  )
  const isAllSelected = items.length > 0 && selectedCount === items.length
  const isIndeterminate = selectedCount > 0 && !isAllSelected
  const headerChecked = isAllSelected ? true : isIndeterminate ? "indeterminate" : false
  const headerLabel = isAllSelected ? clearSelectionLabel : selectAllLabel

  const tableContext: GalleryListContext = {
    selectedIds,
    onSelect,
    onToggleSelection,
    onPreviewOpen,
    formatSize,
    previewLabel,
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative w-full overflow-x-auto">
        <TableVirtuoso
          data={items}
          context={tableContext}
          customScrollParent={scrollParent ?? undefined}
          components={galleryTableComponents}
          computeItemKey={(_, item) => item.id}
          fixedHeaderContent={() => (
            <TableRow>
              <TableHead className="text-muted-foreground text-xs uppercase tracking-wide">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={headerChecked}
                    aria-label={headerLabel}
                    disabled={items.length === 0}
                    onCheckedChange={() => onToggleAll()}
                  />
                  <span className="min-w-0 truncate">{labels.name}</span>
                </div>
              </TableHead>
              <TableHead className="text-muted-foreground min-w-0 w-32 text-xs uppercase tracking-wide">
                <span className="block truncate">{labels.provider}</span>
              </TableHead>
              <TableHead className="text-muted-foreground w-20 text-right text-xs uppercase tracking-wide">
                {labels.size}
              </TableHead>
              <TableHead className="text-muted-foreground w-40 text-xs uppercase tracking-wide">
                <span className="block truncate">{labels.date}</span>
              </TableHead>
            </TableRow>
          )}
          itemContent={(_, item, context) => (
            <>
              <TableCell className="min-w-0">
                <div className="flex items-center gap-3">
                  <div
                    data-gallery-interactive="true"
                    onClick={(event) => event.stopPropagation()}
                    className="shrink-0"
                  >
                    <Checkbox
                      checked={context.selectedIds.has(item.id)}
                      onCheckedChange={(checked) =>
                        context.onToggleSelection(item.id, checked === true)
                      }
                    />
                  </div>
                  <div className="shrink-0">
                    <GalleryListThumbnail
                      imgUrl={item.imgUrl}
                      alt={item.alt ?? ""}
                      isVideo={item.isVideo}
                      onClick={() => context.onPreviewOpen(item.id)}
                      label={context.previewLabel}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {item.name}
                    </div>
                    {/* TODO(v3-post-launch): Restore collection subtitle when Collections feature returns.
                    <div className="text-muted-foreground text-xs">
                      {item.collection}
                    </div>
                    */}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground min-w-0 w-32 text-xs">
                <span className="block truncate">{item.provider}</span>
              </TableCell>
              <TableCell className="text-muted-foreground w-20 text-right text-xs">
                {context.formatSize(item.sizeMb)}
              </TableCell>
              <TableCell className="text-muted-foreground w-40 text-xs">
                <span className="block truncate">{item.date}</span>
              </TableCell>
            </>
          )}
        />
      </div>
    </div>
  )
}
