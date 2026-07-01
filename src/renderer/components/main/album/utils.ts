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
  raw: ImgInfo
  collection: string
  tags: string[]
  isVideo: boolean
}

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
  Collection: 'collection',
  Tag: 'tag'
} as const

export type NavType = ValueOf<typeof NavType>

export type NavContext = {
  type: NavType
  value: string
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

export function buildAlbumPhotos (
  items: ImgInfo[],
  picBeds: IPicBedType[]
) {
  const picBedMap = new Map(picBeds.map((bed) => [bed.type, bed.name]))

  return items.map((item, index) => {
    const dbId = item.id || `${index}`
    const itemType = typeof item.type === 'string' ? item.type : ''
    const timestamp = resolveTimestampValue(item.createdAt) || resolveTimestampValue(item.updatedAt) || undefined
    const size = typeof item.size === 'number' ? item.size : undefined

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
      raw: item,
      collection: '',
      tags: [],
      isVideo: resolveIsVideo(item)
    } satisfies AlbumPhoto
  })
}
