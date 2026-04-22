import type { IPicGoCloudUserInfo } from '#/types/cloud'
import type {
  CloudAlbumBatchUpdateResult,
  CloudAlbumFiltersResponse,
  CloudAlbumImportResult,
  CloudAlbumListQuery,
  CloudAlbumListResponse,
  CloudAlbumStatsResponse
} from '#/types/cloudAlbum'
import { IRPCActionType } from '#/types/enum'
import { invokeRPC } from '@/utils/dataSender'

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
  }
}
