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

    if (!isPaid && albumSource === AlbumSource.CLOUD) {
      const switchPromise = albumStoreActions.setAlbumSource(AlbumSource.LOCAL)
      switchPromise.catch((error) => {
        console.error(error)
      })
    }
  }, [albumSource, isFetched, isPaid])

  return null
}
