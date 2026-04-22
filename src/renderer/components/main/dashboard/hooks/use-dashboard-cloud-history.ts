import { useEffect, useState } from 'react'
import { useIPCOn } from '@/hooks/useIPC'
import { cloudAlbumAdapter } from '@/adapters/cloud-album'
import { IRPCActionType } from '~/universal/types/enum'
import type { DashboardHistoryRecord } from './use-dashboard-history'

export function useDashboardCloudHistory () {
  const [historyItems, setHistoryItems] = useState<DashboardHistoryRecord[]>([])
  const [refreshNonce, setRefreshNonce] = useState(0)

  useIPCOn(IRPCActionType.UPDATE_CLOUD_ALBUM, () => {
    setRefreshNonce((value) => value + 1)
  })

  useEffect(() => {
    let disposed = false

    async function refreshHistory () {
      try {
        const result = await cloudAlbumAdapter.list({ limit: 100, sort: 'newest' })
        if (!disposed && result.success) {
          setHistoryItems(result.data.items as DashboardHistoryRecord[])
        }
      } catch (error) {
        if (!disposed) {
          console.error(error)
        }
      }
    }

    refreshHistory()

    return () => {
      disposed = true
    }
  }, [refreshNonce])

  return historyItems
}
