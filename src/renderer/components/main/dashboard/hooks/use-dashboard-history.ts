import { useEffect, useState } from 'react'
import { useIPCOn } from '@/hooks/useIPC'
import { galleryAdapter } from '@/adapters/gallery'
import { IRPCActionType } from '~/universal/types/enum'

export interface DashboardHistoryRecord extends ImgInfo {
  createdAt?: number
  updatedAt?: number
}

export function useDashboardHistory () {
  const [historyItems, setHistoryItems] = useState<DashboardHistoryRecord[]>([])
  const [refreshNonce, setRefreshNonce] = useState(0)

  useIPCOn(IRPCActionType.UPDATE_GALLERY, () => {
    setRefreshNonce((value) => value + 1)
  })

  useEffect(() => {
    let disposed = false
    let retryTimer: number | null = null

    async function refreshHistory () {
      try {
        const items = await galleryAdapter.getRecentUploads(100)
        if (!disposed) {
          setHistoryItems(items)
        }
      } catch (error) {
        if (!disposed) {
          console.error(error)
        }
      }
    }

    refreshHistory()

    retryTimer = window.setTimeout(() => {
      refreshHistory()
    }, 300)

    return () => {
      disposed = true
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer)
      }
    }
  }, [refreshNonce])

  return historyItems
}
