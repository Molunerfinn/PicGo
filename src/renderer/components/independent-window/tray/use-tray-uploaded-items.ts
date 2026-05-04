import { useEffect, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { useTranslation } from 'react-i18next'
import { AlbumSource } from '#/types/cloudAlbum'
import { IRPCActionType } from '#/types/enum'
import { trayPageAdapter, type TrayPageAlbumItem } from '@/adapters/tray-page'
import { resolveIsVideo } from '@/components/main/album/utils'
import { useIPCOn } from '@/hooks/useIPC'
import { useAlbumStore, useAppStore } from '@/store'

function resolveTrayUploadedItem (item: TrayPageAlbumItem) {
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
    raw: item as TrayPageAlbumItem
  }
}

export type TrayUploadedDisplayItem = ReturnType<typeof resolveTrayUploadedItem>

export function useTrayUploadedItems () {
  const { t } = useTranslation()
  const [uploadedItems, setUploadedItems] = useState<TrayUploadedDisplayItem[]>([])
  const [uploadFlag, setUploadFlag] = useState(false)
  const albumSource = useAlbumStore.use.albumSource()
  const cloudUserInfo = useAppStore.use.picgoCloud().userInfo
  const isPaid = (cloudUserInfo?.plan ?? 0) > 0

  // Tray follows the shared album source, but cloud history is only available
  // for paid cloud users. Everyone else should keep seeing the local album list.
  const effectiveSource = albumSource === AlbumSource.CLOUD && isPaid ? AlbumSource.CLOUD : AlbumSource.LOCAL
  const isCloudSource = effectiveSource === AlbumSource.CLOUD

  const refreshUploadedItems = useMemoizedFn(async () => {
    const items = await trayPageAdapter.getRecentUploadedItems(effectiveSource, 5)
    setUploadedItems(items.map(resolveTrayUploadedItem))
  })

  useIPCOn('dragFiles', async (items: ImgInfo[] = []) => {
    // Local tray can optimistically show runtime upload results immediately.
    // Cloud tray must wait for UPDATE_CLOUD_ALBUM because upload completion and
    // cloud album import are separate events and can arrive in different order.
    if (!isCloudSource && items.length > 0) {
      setUploadedItems(items.map(resolveRuntimeUploadedItem))
      return
    }

    if (!isCloudSource) {
      await refreshUploadedItems()
    }
  })

  useIPCOn('uploadFiles', async (items: ImgInfo[] = []) => {
    if (isCloudSource) {
      // uploadFiles only means PicGo upload succeeded. In cloud mode, refreshing
      // here races with UPDATE_CLOUD_ALBUM and causes duplicate album.list calls.
      // The cloud list is refreshed by UPDATE_CLOUD_ALBUM below.
      setUploadFlag(false)
      return
    }

    if (items.length > 0) {
      setUploadedItems(items.map(resolveRuntimeUploadedItem))
      setUploadFlag(false)
      return
    }

    await refreshUploadedItems()
    setUploadFlag(false)
  })

  useIPCOn('updateFiles', async () => {
    // updateFiles is a local album refresh signal. Cloud album changes have their
    // own UPDATE_CLOUD_ALBUM signal, so ignore updateFiles in cloud mode.
    if (isCloudSource) return
    await refreshUploadedItems()
  })

  useIPCOn(IRPCActionType.UPDATE_CLOUD_ALBUM, async () => {
    if (!isCloudSource) return
    await refreshUploadedItems()
  })

  useEffect(() => {
    let mounted = true

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
    }
  }, [effectiveSource, t])

  const handleUploadClipboardFiles = useMemoizedFn(() => {
    if (uploadFlag) {
      return
    }

    setUploadFlag(true)
    trayPageAdapter.uploadClipboardFiles()
  })

  const handleCopyUploadedLink = useMemoizedFn(async (item: TrayUploadedDisplayItem) => {
    try {
      await trayPageAdapter.copyUploadedLink(item.raw)
    } catch (error) {
      console.error(
        `[tray-page] copy link failed: ${error instanceof Error ? error.message : t('FAILED')}`
      )
    }
  })

  return {
    uploadedItems,
    uploadFlag,
    handleUploadClipboardFiles,
    handleCopyUploadedLink
  }
}
