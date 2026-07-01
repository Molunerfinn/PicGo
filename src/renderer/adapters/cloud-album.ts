import { toast } from 'sonner'
import { UserPlanLevel, type IPicGoCloudBillingOverview, type IPicGoCloudUserInfo } from '#/types/cloud'
import type {
  CloudAlbumBatchUpdateResult,
  CloudAlbumFiltersResponse,
  CloudAlbumImportAllResult,
  CloudAlbumImportResult,
  CloudAlbumListQuery,
  CloudAlbumListResponse,
  CloudAlbumStatsResponse
} from '#/types/cloudAlbum'
import { IRPCActionType } from '#/types/enum'
import { PicGoCloudBillingQueryKeys } from '@/queries/picgo-cloud-billing'
import { resolveCloudErrorMessage } from '@/utils/cloud-error'
import {
  mergePicGoCloudUserInfoQueryData,
  PicGoCloudQueryKeys
} from '@/queries/picgo-cloud'
import { rendererQueryClient } from '@/queries/query-client'
import { invokeRPC } from '@/utils/dataSender'
import i18n from '@/i18n'

export const cloudAlbumAdapter = {
  async list (query?: CloudAlbumListQuery) {
    return await invokeRPC<CloudAlbumListResponse>(IRPCActionType.PICGO_CLOUD_ALBUM_LIST, query)
  },
  async deleteItems (ids: string | string[]) {
    return await invokeRPC<boolean>(IRPCActionType.PICGO_CLOUD_ALBUM_DELETE, ids)
  },
  async updateItem (id: string, data: Partial<ImgInfo>) {
    return await invokeRPC<ImgInfo>(IRPCActionType.PICGO_CLOUD_ALBUM_UPDATE, id, data)
  },
  async batchUpdate (items: { id: string, data: Partial<ImgInfo> }[]) {
    return await invokeRPC<CloudAlbumBatchUpdateResult>(IRPCActionType.PICGO_CLOUD_ALBUM_BATCH_UPDATE, items)
  },
  async importItems (items: ImgInfo[]) {
    return await invokeRPC<CloudAlbumImportResult>(IRPCActionType.PICGO_CLOUD_ALBUM_IMPORT, items)
  },
  async getStats () {
    return await invokeRPC<CloudAlbumStatsResponse>(IRPCActionType.PICGO_CLOUD_ALBUM_GET_STATS)
  },
  async getFilters () {
    return await invokeRPC<CloudAlbumFiltersResponse>(IRPCActionType.PICGO_CLOUD_ALBUM_GET_FILTERS)
  },
  async setAutoImport (autoImport: boolean) {
    return await invokeRPC<IPicGoCloudUserInfo>(IRPCActionType.PICGO_CLOUD_SET_AUTO_IMPORT, autoImport)
  },
  async importAllItems () {
    return await invokeRPC<CloudAlbumImportAllResult>(IRPCActionType.PICGO_CLOUD_ALBUM_IMPORT_ALL)
  }
}

export async function handleCloudImportAll (onSuccess?: () => void): Promise<void> {
  try {
    const currentUserInfo = rendererQueryClient.getQueryData<IPicGoCloudUserInfo | null>(
      PicGoCloudQueryKeys.userInfo
    )
    if ((currentUserInfo?.plan ?? UserPlanLevel.Free) <= UserPlanLevel.Free) {
      return
    }

    const result = await cloudAlbumAdapter.importAllItems()
    if (result.success) {
      // Only merge partial fields (e.g. autoImport) — the RPC response
      // may not include plan, so a full replace would lose it.
      if (result.data.userInfo) {
        mergePicGoCloudUserInfoQueryData(result.data.userInfo)
      }
      if (result.data.created > 0) {
        toast.success(i18n.t('ALBUM_CLOUD_IMPORT_SUCCESS', { num: String(result.data.created) }))
      }
      onSuccess?.()
    } else {
      const billing = rendererQueryClient.getQueryData<IPicGoCloudBillingOverview | null>(
        PicGoCloudBillingQueryKeys.overview
      )
      toast.error(resolveCloudErrorMessage(i18n.t, result.code, billing?.lifecycle?.phase, result.error))
    }
  } catch (error) {
    console.error(error)
    toast.error(i18n.t('OPERATION_FAILED'))
  }
}
