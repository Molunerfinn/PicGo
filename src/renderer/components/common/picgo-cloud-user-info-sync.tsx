import { useEffect, useRef } from 'react'
import { AlbumSource } from '#/types/cloudAlbum'
import { albumStoreActions, useAlbumStore } from '@/store'
import { usePicGoCloudUserInfo } from '@/queries/picgo-cloud'

export function PicGoCloudUserInfoSync () {
  const { isFetched, isPaid } = usePicGoCloudUserInfo()
  const albumSource = useAlbumStore.use.albumSource()
  const previousIsPaidRef = useRef<boolean | null>(null)

  useEffect(() => {
    if (!isFetched) return

    const previousIsPaid = previousIsPaidRef.current
    previousIsPaidRef.current = isPaid

    if (previousIsPaid === false && isPaid) {
      const switchPromise = albumStoreActions.setAlbumSource(AlbumSource.CLOUD)
      switchPromise.catch((error) => {
        console.error(error)
      })
      return
    }

    // 仅在「付费 → 免费」状态切换的瞬间把 CLOUD 切回 LOCAL（订阅过期/退订兜底）。
    // 不能写成 `!isPaid && source === CLOUD`，否则免费用户手动点 Cloud 看升级页时会被立即拦回。
    if (previousIsPaid === true && !isPaid && albumSource === AlbumSource.CLOUD) {
      const switchPromise = albumStoreActions.setAlbumSource(AlbumSource.LOCAL)
      switchPromise.catch((error) => {
        console.error(error)
      })
    }
  }, [albumSource, isFetched, isPaid])

  return null
}
