import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { galleryStoreActions, useGalleryStore } from '@/store'
import { AlbumSource } from '#/types/cloudAlbum'

export function AlbumSourceSwitcher ({ className }: { className?: string }) {
  const { t } = useTranslation()
  const albumSource = useGalleryStore.use.albumSource()
  const isCloud = albumSource === AlbumSource.CLOUD

  return (
    <div className={cn('flex items-center rounded-md bg-muted p-0.5', className)}>
      <button
        type="button"
        className={cn(
          'rounded px-2 py-0.5 text-xs font-medium transition-all',
          isCloud
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => galleryStoreActions.setAlbumSource(AlbumSource.CLOUD)}
      >
        {t('GALLERY_SOURCE_CLOUD')}
      </button>
      <button
        type="button"
        className={cn(
          'rounded px-2 py-0.5 text-xs font-medium transition-all',
          !isCloud
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => galleryStoreActions.setAlbumSource(AlbumSource.LOCAL)}
      >
        {t('GALLERY_SOURCE_LOCAL')}
      </button>
    </div>
  )
}
