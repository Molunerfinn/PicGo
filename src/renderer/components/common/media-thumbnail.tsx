import { useState } from 'react'
import { cn } from '@/lib/utils'

export interface MediaThumbnailProps {
  src: string
  alt: string
  isVideo: boolean
  className?: string
  loading?: 'lazy' | 'eager'
  draggable?: boolean
  onLoad?: () => void
  onError?: () => void
}

/**
 * Shared thumbnail component that renders either an `<img>` or a
 * `<video preload="metadata">` element depending on `isVideo`.
 *
 * For video files the browser loads only enough data to extract a poster
 * frame, keeping bandwidth low while still showing a visual preview.
 */
export function MediaThumbnail ({
  src,
  alt,
  isVideo,
  className,
  loading = 'lazy',
  draggable,
  onLoad,
  onError
}: MediaThumbnailProps) {
  const [videoReady, setVideoReady] = useState(false)

  if (isVideo) {
    return (
      <video
        src={src}
        preload="metadata"
        muted
        playsInline
        className={cn(
          'transition-opacity duration-300',
          videoReady ? 'opacity-100' : 'opacity-0',
          className
        )}
        draggable={draggable}
        onLoadedData={() => {
          setVideoReady(true)
          onLoad?.()
        }}
        onError={() => {
          onError?.()
        }}
      />
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      draggable={draggable}
      onLoad={onLoad}
      onError={onError}
    />
  )
}
