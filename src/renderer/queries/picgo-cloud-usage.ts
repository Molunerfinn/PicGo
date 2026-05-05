import { useQuery } from '@tanstack/react-query'
import type { IPicGoCloudUsage } from '#/types/cloud'
import { cloudAdapter } from '@/adapters/cloud'

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
