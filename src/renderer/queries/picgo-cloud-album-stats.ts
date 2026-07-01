import { useQuery } from '@tanstack/react-query'
import type { CloudAlbumStatsResponse } from '#/types/cloudAlbum'
import { cloudAlbumAdapter } from '@/adapters/cloud-album'
import { rendererQueryClient } from './query-client'

export const PicGoCloudAlbumStatsQueryKeys = {
  stats: ['picgo-cloud-album', 'stats'] as const
}

async function fetchCloudAlbumStats (): Promise<CloudAlbumStatsResponse> {
  const result = await cloudAlbumAdapter.getStats()
  if (!result.success) {
    throw new Error(result.error)
  }
  return result.data
}

export function useCloudAlbumStatsQuery (options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: PicGoCloudAlbumStatsQueryKeys.stats,
    queryFn: fetchCloudAlbumStats,
    refetchOnWindowFocus: true,
    enabled: options?.enabled ?? true
  })
}

export async function invalidateCloudAlbumStatsQuery () {
  await rendererQueryClient.invalidateQueries({
    queryKey: PicGoCloudAlbumStatsQueryKeys.stats
  })
}
