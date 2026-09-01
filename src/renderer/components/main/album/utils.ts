import dayjs from 'dayjs'
import mime from 'mime/lite'

import { resolveTimestampValue } from '@/utils/common'
import { DEFAULT_DATE_TIME_FORMAT } from '@/utils/consts'
import type { ValueOf } from '@/types/utils'

export type AlbumPhoto = {
  id: number
  dbId: string
  imgUrl: string
  originImgUrl?: string
  width?: number
  height?: number
  alt?: string
  name: string
  sizeMb: number
  date: string
  type: string
  typeName?: string
  /**
   * `_id` of the uploader config this photo belongs to. Empty string when the
   * config could not be determined (legacy item with no matching url prefix).
   */
  configId: string
  configName: string
  raw: ImgInfo
  collection: string
  tags: string[]
  isVideo: boolean
}

/** Sentinel nav value for photos whose uploader config could not be resolved. */
export const unknownConfigKey = '__unknown__'

export type AlbumConfigOption = {
  id: string
  name: string
  /** Public url prefix, used to infer the config of legacy items. */
  urlPrefix: string
}

/** Uploader config options grouped by picbed type. */
export type AlbumConfigMap = Record<string, AlbumConfigOption[]>

function resolveExtname (item: ImgInfo): string {
  if (item.extname) {
    return item.extname.toLowerCase()
  }

  const fileName = item.fileName || item.imgUrl || ''
  const dotIndex = fileName.lastIndexOf('.')
  if (dotIndex >= 0) {
    return fileName.slice(dotIndex).toLowerCase().split('?')[0]
  }

  return ''
}

export function resolveIsVideo (item: ImgInfo): boolean {
  const ext = resolveExtname(item)
  if (!ext) {
    return false
  }

  const mimeType = mime.getType(ext)
  return typeof mimeType === 'string' && mimeType.startsWith('video/')
}

export type AlbumProviderFilter = {
  type: string
  name: string
  count: number
  configs: AlbumConfigFilter[]
  /** Photos of this provider whose config could not be resolved. */
  unknownCount: number
}

export type AlbumConfigFilter = {
  id: string
  name: string
  count: number
}

export const AlbumViewMode = {
  Masonry: 'masonry',
  List: 'list'
} as const

export type AlbumViewMode =
  ValueOf<typeof AlbumViewMode>

export const NavType = {
  All: 'all',
  Provider: 'provider',
  Config: 'config',
  Collection: 'collection',
  Tag: 'tag'
} as const

export type NavType = ValueOf<typeof NavType>

export type NavContext = {
  type: NavType
  value: string
  /** Owning picbed type. Only set when `type` is `Config`. */
  providerType?: string
}

export function filterAlbumImages (
  images: AlbumPhoto[],
  navContext: NavContext,
  searchValue: string
) {
  const query = searchValue.trim().toLowerCase()
  const data = images.filter((image) => {
    const matchesNav =
      navContext.type === NavType.All
        ? true
        : navContext.type === NavType.Provider
          ? image.type === navContext.value
          : navContext.type === NavType.Config
            ? image.type === navContext.providerType &&
              (navContext.value === unknownConfigKey
                ? !image.configId
                : image.configId === navContext.value)
            : navContext.type === NavType.Collection
              ? image.collection === navContext.value
              : image.tags.includes(navContext.value)

    const matchesSearch = query
      ? image.name.toLowerCase().includes(query) ||
        (image.typeName || image.type).toLowerCase().includes(query) ||
        image.collection.toLowerCase().includes(query)
      : true

    return matchesNav && matchesSearch
  })
  return data
}

export function buildSidebarTags (images: AlbumPhoto[], baseSuggestions: string[]) {
  const tagSet = new Set(baseSuggestions)
  images.forEach((image) => {
    image.tags.forEach((tag) => tagSet.add(tag))
  })
  return Array.from(tagSet)
}

export function getSelectedTags (selectedImages: AlbumPhoto[]) {
  const tagSet = new Set<string>()
  selectedImages.forEach((image) => {
    image.tags.forEach((tag) => tagSet.add(tag))
  })
  return Array.from(tagSet)
}

export function getAlbumImageUrl (image: AlbumPhoto) {
  return image.imgUrl ?? image.originImgUrl ?? ''
}

function formatAlbumDate (timestamp?: number) {
  if (!timestamp) {
    return ''
  }

  return dayjs(timestamp).format(DEFAULT_DATE_TIME_FORMAT)
}

function formatAlbumSize (size?: number) {
  if (typeof size !== 'number' || !Number.isFinite(size) || size <= 0) {
    return 0
  }

  return size / 1024 / 1024
}

/**
 * Field names picbeds use for their public url prefix. Each builtin uploader
 * names it differently (`urlPrefix` for S3, `customUrl` for COS/OSS/GitHub,
 * `url` for Qiniu/Upyun), and plugins are free to pick their own — an unknown
 * name just means legacy items of that picbed stay unattributed.
 */
const URL_PREFIX_FIELDS = ['urlPrefix', 'customUrl', 'customDomain', 'url', 'host', 'domain']

function resolveConfigUrlPrefix (config: Record<string, unknown>): string {
  for (const field of URL_PREFIX_FIELDS) {
    const value = config[field]
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }
  return ''
}

/** Derive per-picbed uploader config options from the app config. */
export function buildAlbumConfigMap (
  uploaderConfig: Record<string, { configList?: Array<Record<string, unknown>> }> | undefined
): AlbumConfigMap {
  if (!uploaderConfig) {
    return {}
  }

  const result: AlbumConfigMap = {}
  Object.entries(uploaderConfig).forEach(([type, item]) => {
    const configList = item?.configList ?? []
    const options = configList
      .filter((config) => typeof config._id === 'string' && config._id)
      .map((config) => ({
        id: config._id as string,
        name: typeof config._configName === 'string' && config._configName
          ? config._configName
          : (config._id as string),
        urlPrefix: resolveConfigUrlPrefix(config)
      }))
    if (options.length > 0) {
      result[type] = options
    }
  })
  return result
}

function normalizeUrlPrefix (prefix: string): string {
  return prefix.trim().replace(/\/+$/, '').toLowerCase()
}

/**
 * Infer which uploader config produced a legacy album item by matching its url
 * against each config's public url prefix. Longest prefix wins, so configs that
 * share a host but differ by path still resolve correctly. Inference is never
 * persisted: it is recomputed on every load, so renaming a config or changing
 * its domain immediately re-buckets old photos instead of leaving stale data.
 */
export function inferConfigIdFromUrl (
  item: ImgInfo,
  configs: AlbumConfigOption[]
): string {
  // Prefer the original url: a rewritten `imgUrl` may point at a CDN that no
  // longer resembles any config's prefix.
  const url = (item.originImgUrl || item.imgUrl || '').toLowerCase()
  if (!url) {
    return ''
  }

  let matchedId = ''
  let matchedLength = 0
  configs.forEach((config) => {
    const prefix = normalizeUrlPrefix(config.urlPrefix)
    if (!prefix || !url.startsWith(prefix)) {
      return
    }
    if (prefix.length > matchedLength) {
      matchedId = config.id
      matchedLength = prefix.length
    }
  })

  return matchedId
}

export function buildAlbumPhotos (
  items: ImgInfo[],
  picBeds: IPicBedType[],
  configMap: AlbumConfigMap = {}
) {
  const picBedMap = new Map(picBeds.map((bed) => [bed.type, bed.name]))

  return items.map((item, index) => {
    const dbId = item.id || `${index}`
    const itemType = typeof item.type === 'string' ? item.type : ''
    const timestamp = resolveTimestampValue(item.createdAt) || resolveTimestampValue(item.updatedAt) || undefined
    const size = typeof item.size === 'number' ? item.size : undefined
    const configs = configMap[itemType] ?? []
    const configId = typeof item._configId === 'string' && item._configId
      ? item._configId
      : inferConfigIdFromUrl(item, configs)
    // Always resolve the display name from live config, so a renamed config is
    // reflected in the album; fall back to the name snapshotted at upload time.
    const configName = configs.find((config) => config.id === configId)?.name ??
      (typeof item._configName === 'string' ? item._configName : '')

    return {
      id: index,
      dbId,
      imgUrl: item.imgUrl || item.originImgUrl || '',
      originImgUrl: item.originImgUrl,
      width: item.width,
      height: item.height,
      alt: item.fileName || item.imgUrl || '',
      name: item.fileName || item.imgUrl || 'Untitled',
      sizeMb: formatAlbumSize(size),
      date: formatAlbumDate(timestamp),
      type: itemType,
      typeName: picBedMap.get(itemType) || itemType,
      configId,
      configName,
      raw: item,
      collection: '',
      tags: [],
      isVideo: resolveIsVideo(item)
    } satisfies AlbumPhoto
  })
}

/**
 * Build the sidebar's provider tree: one node per visible picbed, each with a
 * child per uploader config plus an "unknown" bucket for photos that could not
 * be attributed.
 */
export function buildAlbumProviderFilters (
  images: AlbumPhoto[],
  picBeds: IPicBedType[],
  configMap: AlbumConfigMap = {}
): AlbumProviderFilter[] {
  return picBeds
    .filter((item) => item.visible !== false)
    .map((item) => {
      const typeImages = images.filter((image) => image.type === item.type)
      const configs = configMap[item.type] ?? []

      return {
        type: item.type,
        name: item.name,
        count: typeImages.length,
        configs: configs.map((config) => ({
          id: config.id,
          name: config.name,
          count: typeImages.filter((image) => image.configId === config.id).length
        })),
        unknownCount: typeImages.filter((image) => !image.configId).length
      }
    })
}
