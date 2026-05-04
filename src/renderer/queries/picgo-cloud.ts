import { useQuery } from '@tanstack/react-query'
import { UserPlanLevel, type IPicGoCloudUserInfo } from '#/types/cloud'
import { cloudAdapter } from '@/adapters/cloud'
import { rendererQueryClient } from './query-client'

export const PicGoCloudQueryKeys = {
  userInfo: ['picgo-cloud', 'user-info'] as const
}

async function fetchPicGoCloudUserInfo (): Promise<IPicGoCloudUserInfo | null> {
  const result = await cloudAdapter.getUserInfo({ refresh: true })
  if (!result.success) {
    throw new Error(result.error)
  }
  return result.data
}

export function usePicGoCloudUserInfoQuery () {
  return useQuery({
    queryKey: PicGoCloudQueryKeys.userInfo,
    queryFn: fetchPicGoCloudUserInfo,
    refetchOnWindowFocus: true
  })
}

export function usePicGoCloudUserInfo () {
  const query = usePicGoCloudUserInfoQuery()
  const userInfo = query.data

  return {
    ...query,
    userInfo,
    isPaid: (userInfo?.plan ?? UserPlanLevel.Free) > UserPlanLevel.Free
  }
}

export function setPicGoCloudUserInfoQueryData (userInfo: IPicGoCloudUserInfo | null | undefined) {
  rendererQueryClient.setQueryData(PicGoCloudQueryKeys.userInfo, userInfo ?? null)
}

export function mergePicGoCloudUserInfoQueryData (partial: Partial<IPicGoCloudUserInfo>) {
  rendererQueryClient.setQueryData<IPicGoCloudUserInfo | null>(
    PicGoCloudQueryKeys.userInfo,
    (current) => current ? { ...current, ...partial } : partial as IPicGoCloudUserInfo
  )
}

export async function invalidatePicGoCloudUserInfoQuery () {
  await rendererQueryClient.invalidateQueries({
    queryKey: PicGoCloudQueryKeys.userInfo
  })
}
