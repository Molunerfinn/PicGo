import { useQuery } from '@tanstack/react-query'
import type { IPicGoCloudBillingOverview } from '#/types/cloud'
import { cloudAdapter } from '@/adapters/cloud'
import { rendererQueryClient } from './query-client'

export const PicGoCloudBillingQueryKeys = {
  overview: ['picgo-cloud', 'billing'] as const
}

async function fetchPicGoCloudBillingOverview (): Promise<IPicGoCloudBillingOverview | null> {
  const result = await cloudAdapter.getBillingOverview()
  if (!result.success) {
    throw new Error(result.error)
  }
  return result.data
}

export function usePicGoCloudBillingQuery () {
  return useQuery({
    queryKey: PicGoCloudBillingQueryKeys.overview,
    queryFn: fetchPicGoCloudBillingOverview,
    refetchOnWindowFocus: true
  })
}

export async function invalidatePicGoCloudBillingQuery () {
  await rendererQueryClient.invalidateQueries({
    queryKey: PicGoCloudBillingQueryKeys.overview
  })
}
