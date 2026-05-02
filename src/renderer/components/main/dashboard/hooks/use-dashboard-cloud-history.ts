import { useEffect, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { useIPCOn } from '@/hooks/useIPC'
import { cloudAlbumAdapter } from '@/adapters/cloud-album'
import { useAppStore } from '@/store'
import { IRPCActionType } from '~/universal/types/enum'
import type { DashboardHistoryRecord } from './use-dashboard-history'

export function useDashboardCloudHistory () {
  const [historyItems, setHistoryItems] = useState<DashboardHistoryRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshNonce, setRefreshNonce] = useState(0)
  const userInfo = useAppStore.use.picgoCloud().userInfo
  const isPaid = (userInfo?.plan ?? 0) > 0

  useIPCOn(IRPCActionType.UPDATE_CLOUD_ALBUM, () => {
    setRefreshNonce((value) => value + 1)
  })

  // Manual refresh — returns a promise that resolves when the request completes,
  // so callers (e.g. refresh buttons) can await it to drive their own loading state.
  const refresh = useMemoizedFn(async () => {
    if (!isPaid) return
    setLoading(true)
    try {
      const result = await cloudAlbumAdapter.list({ limit: 100, sort: 'newest' })
      if (result.success) {
        setHistoryItems(result.data.items as DashboardHistoryRecord[])
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  })

  useEffect(() => {
    if (!isPaid) return
    let disposed = false

    async function refreshHistory () {
      setLoading(true)
      try {
        const result = await cloudAlbumAdapter.list({ limit: 100, sort: 'newest' })
        if (!disposed && result.success) {
          setHistoryItems(result.data.items as DashboardHistoryRecord[])
        }
      } catch (error) {
        if (!disposed) {
          console.error(error)
        }
      } finally {
        if (!disposed) {
          setLoading(false)
        }
      }
    }

    refreshHistory()

    return () => {
      disposed = true
    }
  }, [refreshNonce, isPaid])

  return { items: historyItems, loading, refresh }
}
