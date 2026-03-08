import { useEffect, useState } from 'react'
import { galleryAdapter } from '@/adapters/gallery'

export interface DashboardHistoryRecord extends ImgInfo {
  createdAt?: number
  updatedAt?: number
}

export function useDashboardHistory () {
  const [historyItems, setHistoryItems] = useState<DashboardHistoryRecord[]>([])

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

    const unsubscribe = galleryAdapter.subscribeToUpdates(() => {
      refreshHistory()
    })

    return () => {
      disposed = true
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer)
      }
      unsubscribe()
    }
  }, [])

  return historyItems
}
