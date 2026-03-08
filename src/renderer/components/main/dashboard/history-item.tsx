import { useState } from 'react'
import { ClockIcon, CopyIcon, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { RecentUpload } from '@/types/dashboard'

function HistoryThumbnail ({
  thumbnailUrl,
  alt,
  loadThumbnail = true,
  previewLabel,
  onPreview
}: {
  thumbnailUrl?: string
  alt: string
  loadThumbnail?: boolean
  previewLabel: string
  onPreview?: () => void
}) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const [hasLoadError, setHasLoadError] = useState(false)
  const hasThumbnail =
    loadThumbnail &&
    typeof thumbnailUrl === 'string' &&
    thumbnailUrl.length > 0 &&
    !hasLoadError
  const isLoaded = loadedSrc === thumbnailUrl

  return (
    <button
      type="button"
      title={previewLabel}
      aria-label={previewLabel}
      className="bg-muted border-border/50 group-hover:border-primary/20 group-hover:bg-white/50 relative flex size-10 flex-shrink-0 cursor-zoom-in items-center justify-center overflow-hidden rounded-lg border transition-colors"
      onClick={(event) => {
        event.stopPropagation()
        onPreview?.()
      }}
    >
      {hasThumbnail
        ? (
          <>
            {!isLoaded
              ? <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
              : null}
            <img
              src={thumbnailUrl}
              alt={alt}
              className={cn(
                'h-full w-full object-cover transition-opacity duration-300',
                isLoaded ? 'opacity-100' : 'opacity-0'
              )}
              loading="lazy"
              decoding="async"
              draggable={false}
              onLoad={() => {
                setLoadedSrc(thumbnailUrl)
              }}
              onError={() => {
                setHasLoadError(true)
              }}
            />
          </>
        )
        : (
          <ImageIcon className="text-muted-foreground/70 group-hover:text-primary size-4 transition-colors" />
        )}
    </button>
  )
}

export function HistoryItem ({
  item,
  onCopy,
  loadThumbnail = true,
  onPreview,
  previewLabel
}: {
  item: RecentUpload
  onCopy?: () => void
  loadThumbnail?: boolean
  onPreview?: () => void
  previewLabel: string
}) {
  const thumbnailUrl = item.thumbnailUrl ?? item.subtitle

  return (
    <div
      className="group hover:bg-primary/10 flex cursor-pointer items-center gap-3 rounded-xl p-2 transition-colors"
      role="button"
      tabIndex={0}
      onClick={() => {
        onCopy?.()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onCopy?.()
        }
      }}
    >
      <HistoryThumbnail
        key={thumbnailUrl ?? item.id}
        thumbnailUrl={thumbnailUrl}
        alt={item.name}
        loadThumbnail={loadThumbnail}
        previewLabel={previewLabel}
        onPreview={onPreview}
      />
      <div className="min-w-0 flex-1">
        <h4 className="text-foreground/90 group-hover:text-primary truncate text-sm font-medium transition-colors">
          {item.name}
        </h4>
        <div className="text-muted-foreground flex items-center gap-1.5 text-[10px]">
          <ClockIcon className="size-2.5" />
          <span>{item.time}</span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        className="text-muted-foreground hover:text-primary opacity-0 transition-opacity group-hover:opacity-100"
        onClick={(event) => {
          event.stopPropagation()
          onCopy?.()
        }}
      >
        <CopyIcon className="size-3" />
      </Button>
    </div>
  )
}
