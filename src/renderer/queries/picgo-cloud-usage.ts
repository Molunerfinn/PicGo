import { useQuery } from '@tanstack/react-query'
import type { IPicGoCloudUsage } from '#/types/cloud'
import { cloudAdapter } from '@/adapters/cloud'
import { rendererQueryClient } from './query-client'

export const PicGoCloudUsageQueryKeys = {
  usage: ['picgo-cloud', 'usage'] as const
}

async function fetchPicGoCloudUsage (): Promise<IPicGoCloudUsage | null> {
  const result = await cloudAdapter.getUsage()
  if (!result.success) {
    throw new Error(result.error)
  }
  return result.data
}

export function usePicGoCloudUsageQuery () {
  return useQuery({
    queryKey: PicGoCloudUsageQueryKeys.usage,
    queryFn: fetchPicGoCloudUsage,
    refetchOnWindowFocus: true
  })
}

export async function invalidatePicGoCloudUsageQuery () {
  await rendererQueryClient.invalidateQueries({
    queryKey: PicGoCloudUsageQueryKeys.usage
  })
}
