import { useQuery } from '@tanstack/react-query'
import type { IPicGoCloudConfigSyncState } from '#/types/cloudConfigSync'
import { cloudAdapter } from '@/adapters/cloud'
import { rendererQueryClient } from './query-client'
import { usePicGoCloudUserInfo } from './picgo-cloud'

export const PicGoCloudConfigSyncQueryKeys = {
  state: ['picgo-cloud', 'config-sync-state'] as const
}

async function fetchPicGoCloudConfigSyncState (): Promise<IPicGoCloudConfigSyncState> {
  const result = await cloudAdapter.getConfigSyncState()
  if (!result.success) {
    throw new Error(result.error)
  }
  return result.data
}

export function useCloudConfigSyncStateQuery () {
  const { userInfo } = usePicGoCloudUserInfo()
  return useQuery({
    queryKey: PicGoCloudConfigSyncQueryKeys.state,
    queryFn: fetchPicGoCloudConfigSyncState,
    enabled: !!userInfo,
    refetchOnWindowFocus: true
  })
}

export function setCloudConfigSyncStateQueryData (state: IPicGoCloudConfigSyncState) {
  rendererQueryClient.setQueryData(PicGoCloudConfigSyncQueryKeys.state, state)
}

export function updateCloudConfigSyncStateQueryData (
  updater: (prev: IPicGoCloudConfigSyncState | undefined) => IPicGoCloudConfigSyncState
) {
  rendererQueryClient.setQueryData<IPicGoCloudConfigSyncState>(
    PicGoCloudConfigSyncQueryKeys.state,
    updater
  )
}
