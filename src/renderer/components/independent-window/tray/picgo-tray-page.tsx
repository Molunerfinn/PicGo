import { type CSSProperties, useEffect, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { useTranslation } from 'react-i18next'
import { LoaderCircleIcon } from 'lucide-react'

import { trayPageAdapter, type TrayPageGalleryItem } from '@/adapters/tray-page'
import { AppMainCard } from '@/components/common/app-main-card'
import { MediaThumbnail } from '@/components/common/media-thumbnail'
import { resolveIsVideo } from '@/components/main/gallery/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useIPCOn } from '@/hooks/useIPC'
import { cn } from '@/lib/utils'
import { useAppStore, useGalleryStore } from '@/store'
import { AlbumSource } from '#/types/cloudAlbum'
import { IRPCActionType } from '#/types/enum'
import type {
  TrayWaitingItem
} from '@/components/independent-window/tray/types'
import { UtilityWindowLayout } from '@/components/independent-window/utility-window-layout'

function TraySectionTitle ({ title }: { title: string }) {
  return (
    <h2 className='text-muted-foreground border-border/70 border-b px-1 py-1 text-center text-xs font-medium'>
      {title}
    </h2>
  )
}

function TrayImageButton ({
  label,
  fileName,
  imgUrl,
  isVideo = false,
  title,
  onClick,
  disabled,
  hideFileName = false,
  trailing
}: {
  label: string
  fileName: string
  imgUrl: string
  isVideo?: boolean
  title: string
  onClick: () => void
  disabled?: boolean
  hideFileName?: boolean
  trailing?: React.ReactNode
}) {
  const fileNameStyle: CSSProperties = {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    overflowWrap: 'anywhere'
  }

  return (
    <button
      type='button'
      className={cn(
        'hover:bg-primary/10 focus-visible:ring-ring flex w-full cursor-pointer flex-col gap-2 rounded-lg p-1 transition-colors focus-visible:ring-2 focus-visible:outline-none',
        disabled ? 'cursor-not-allowed opacity-60 hover:bg-transparent' : ''
      )}
      onClick={onClick}
      disabled={disabled}
      aria-label={`${label} ${fileName}`}
      title={title}
    >
      <div className='relative w-full overflow-hidden rounded-md border border-border/70 bg-card'>
        <MediaThumbnail
          src={imgUrl}
          alt={fileName}
          isVideo={isVideo}
          className='block h-auto w-full'
          loading='lazy'
        />
        {trailing ? (
          <div className='bg-background/80 text-muted-foreground absolute right-1 top-1 rounded-full p-1'>
            {trailing}
          </div>
        ) : null}
      </div>
      {!hideFileName ? (
        <p
          className='w-full px-1 text-center text-xs font-medium leading-4'
          style={fileNameStyle}
        >
          {fileName}
        </p>
      ) : null}
    </button>
  )
}

function resolveTrayWaitingItem (item: ImgInfo, index: number): TrayWaitingItem {
  return {
    id: item.id || item.imgUrl || `waiting-${index}`,
    imgUrl: item.imgUrl || item.originImgUrl || '',
    isVideo: resolveIsVideo(item)
  }
}

function resolveTrayUploadedItem (item: TrayPageGalleryItem) {
  return {
    id: item.id || item.imgUrl || item.fileName || `${Date.now()}`,
    fileName: item.fileName || item.imgUrl || 'unknown',
    imgUrl: item.imgUrl || item.originImgUrl || '',
    link: item.imgUrl || item.originImgUrl || '',
    isVideo: resolveIsVideo(item),
    raw: item
  }
}

function resolveRuntimeUploadedItem (item: ImgInfo): TrayUploadedDisplayItem {
  return {
    id: item.id || item.imgUrl || item.fileName || `${Date.now()}`,
    fileName: item.fileName || item.imgUrl || 'unknown',
    imgUrl: item.imgUrl || item.originImgUrl || '',
    link: item.imgUrl || item.originImgUrl || '',
    isVideo: resolveIsVideo(item),
    raw: item as TrayPageGalleryItem
  }
}

type TrayUploadedDisplayItem = ReturnType<typeof resolveTrayUploadedItem>

export function PicGoTrayPage () {
  const { t } = useTranslation()
  const [uploadedItems, setUploadedItems] = useState<TrayUploadedDisplayItem[]>([])
  const [clipboardFiles, setClipboardFiles] = useState<TrayWaitingItem[]>([])
  const [uploadFlag, setUploadFlag] = useState(false)
  const albumSource = useGalleryStore.use.albumSource()
  const cloudUserInfo = useAppStore.use.picgoCloud().userInfo
  const isPaid = (cloudUserInfo?.plan ?? 0) > 0
  // Tray always falls back to local if user is not logged in or not on a paid plan
  const effectiveSource = albumSource === AlbumSource.CLOUD && isPaid ? AlbumSource.CLOUD : AlbumSource.LOCAL
  const isCloudSource = effectiveSource === AlbumSource.CLOUD

  const refreshUploadedItems = useMemoizedFn(async () => {
    const items = await trayPageAdapter.getRecentUploadedItems(effectiveSource, 5)
    setUploadedItems(items.map(resolveTrayUploadedItem))
  })

  useIPCOn('clipboardFiles', (files: ImgInfo[]) => {
    setClipboardFiles(files.map(resolveTrayWaitingItem))
  })

  useIPCOn('dragFiles', async (items: ImgInfo[] = []) => {
    if (!isCloudSource && items.length > 0) {
      setUploadedItems(items.map(resolveRuntimeUploadedItem))
      return
    }

    await refreshUploadedItems()
  })

  useIPCOn('uploadFiles', async (items: ImgInfo[] = []) => {
    if (!isCloudSource && items.length > 0) {
      setUploadedItems(items.map(resolveRuntimeUploadedItem))
      setUploadFlag(false)
      return
    }

    await refreshUploadedItems()
    setUploadFlag(false)
  })

  useIPCOn('updateFiles', async () => {
    await refreshUploadedItems()
  })

  useIPCOn(IRPCActionType.UPDATE_CLOUD_ALBUM, async () => {
    if (!isCloudSource) return
    await refreshUploadedItems()
  })

  useEffect(() => {
    let mounted = true

    const removeDragBlockers = trayPageAdapter.disableDragFile()

    async function loadInitialUploadedItems () {
      try {
        const items = await trayPageAdapter.getRecentUploadedItems(effectiveSource, 5)
        if (!mounted) {
          return
        }
        setUploadedItems(items.map(resolveTrayUploadedItem))
      } catch (error) {
        console.error(
          `[tray-page] load state failed: ${error instanceof Error ? error.message : t('FAILED')}`
        )
      }
    }

    loadInitialUploadedItems()

    return () => {
      mounted = false
      removeDragBlockers()
    }
  }, [effectiveSource, t])

  const handleOpenMainWindow = () => {
    trayPageAdapter.openMainWindow()
  }

  const handleUploadClipboardFiles = () => {
    if (uploadFlag) {
      return
    }

    setUploadFlag(true)
    trayPageAdapter.uploadClipboardFiles()
  }

  const handleCopyUploadedLink = async (item: TrayUploadedDisplayItem) => {
    try {
      await trayPageAdapter.copyUploadedLink(item.raw)
    } catch (error) {
      console.error(
        `[tray-page] copy link failed: ${error instanceof Error ? error.message : t('FAILED')}`
      )
    }
  }

  return (
    <UtilityWindowLayout page='tray'>
      <AppMainCard className='h-(--app-utility-shell-height) w-full gap-0 overflow-hidden rounded-xl border-(--app-panel-border) bg-(--app-panel-bg) py-0'>
        <button
          type='button'
          className='h-8 w-full cursor-pointer bg-primary/80 px-3 text-center text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary dark:bg-primary/75 dark:hover:bg-primary'
          onClick={handleOpenMainWindow}
        >
          {t('OPEN_MAIN_WINDOW')}
        </button>

        <ScrollArea className='min-h-0 flex-1'>
          <div className='space-y-2 p-2'>
            {clipboardFiles.length > 0 ? (
              <section className='space-y-1'>
                <TraySectionTitle title={t('WAIT_TO_UPLOAD')} />
                {clipboardFiles.map((item) => (
                  <TrayImageButton
                    key={item.id}
                    label={t('WAIT_TO_UPLOAD')}
                    fileName=''
                    imgUrl={item.imgUrl}
                    isVideo={item.isVideo}
                    title='tray-waiting-item'
                    onClick={handleUploadClipboardFiles}
                    disabled={uploadFlag}
                    hideFileName={true}
                    trailing={
                      uploadFlag ? (
                        <LoaderCircleIcon className='text-primary size-3.5 animate-spin' />
                      ) : null
                    }
                  />
                ))}
              </section>
            ) : null}

            <section className='space-y-1'>
              <TraySectionTitle title={t('ALREADY_UPLOAD')} />
              {uploadedItems.length === 0 ? (
                <p className='text-muted-foreground px-1 py-2 text-center text-xs'>
                  {t('TRAY_ALREADY_UPLOAD_EMPTY')}
                </p>
              ) : (
                uploadedItems.map((item) => (
                  <TrayImageButton
                    key={item.id}
                    label={t('ALREADY_UPLOAD')}
                    fileName={item.fileName}
                    imgUrl={item.imgUrl}
                    isVideo={item.isVideo}
                    title='tray-uploaded-item'
                    onClick={() => handleCopyUploadedLink(item)}
                  />
                ))
              )}
            </section>
          </div>
        </ScrollArea>
      </AppMainCard>
    </UtilityWindowLayout>
  )
}
