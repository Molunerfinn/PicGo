export enum AlbumSource {
  LOCAL = 'local',
  CLOUD = 'cloud'
}

export type CloudAlbumListQuery = {
  contentType?: string
  type?: string
  ext?: string
  search?: string
  fileName?: string
  limit?: number
  offset?: number
  sort?: 'newest' | 'oldest' | 'fileName' | string
  order?: 'asc' | 'desc'
}

export type CloudAlbumListResponse = {
  success: boolean
  items: ImgInfo[]
  total: number
  limit: number
  offset: number
}

export type CloudAlbumFiltersResponse = {
  success: boolean
  contentTypes: string[]
  exts: string[]
}

export type CloudAlbumBatchUpdateResult = {
  updated: number
  skipped: number
  items: ImgInfo[]
}

export type CloudAlbumImportResult = {
  total: number
  created: number
  skipped: number
  invalid: number
  failed: number
  pending: number
  items: ImgInfo[]
}

export type CloudImportProgress = {
  total: number
  current: number
  batchIndex: number
  batchTotal: number
  created: number
  skipped: number
  failed: number
}

export type CloudAlbumProviderStat = {
  type: string
  count: number
}

export type CloudAlbumStatsResponse = {
  total: number
  types: CloudAlbumProviderStat[]
}
