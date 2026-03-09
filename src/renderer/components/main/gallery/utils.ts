import dayjs from 'dayjs'

import type { ValueOf } from '@/types/utils'

export type GalleryPhoto = {
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
  provider: string
  providerType: string
  raw: ImgInfo
  collection: string
  tags: string[]
}

export type GalleryProviderFilter = {
  type: string
  name: string
  count: number
}

export const GalleryViewMode = {
  Masonry: 'masonry',
  List: 'list'
} as const

export type GalleryViewMode =
  ValueOf<typeof GalleryViewMode>

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

export function filterGalleryImages (
  images: GalleryPhoto[],
  navContext: NavContext,
  searchValue: string
) {
  const query = searchValue.trim().toLowerCase()
  const data = images.filter((image) => {
    const matchesNav =
      navContext.type === NavType.All
        ? true
        : navContext.type === NavType.Provider
          ? image.providerType === navContext.value
          : navContext.type === NavType.Collection
            ? image.collection === navContext.value
            : image.tags.includes(navContext.value)

    const matchesSearch = query
      ? image.name.toLowerCase().includes(query) ||
        image.provider.toLowerCase().includes(query) ||
        image.collection.toLowerCase().includes(query)
      : true

    return matchesNav && matchesSearch
  })
  return data
}

export function buildSidebarTags (images: GalleryPhoto[], baseSuggestions: string[]) {
  const tagSet = new Set(baseSuggestions)
  images.forEach((image) => {
    image.tags.forEach((tag) => tagSet.add(tag))
  })
  return Array.from(tagSet)
}

export function getSelectedTags (selectedImages: GalleryPhoto[]) {
  const tagSet = new Set<string>()
  selectedImages.forEach((image) => {
    image.tags.forEach((tag) => tagSet.add(tag))
  })
  return Array.from(tagSet)
}

export function getGalleryImageUrl (image: GalleryPhoto) {
  return image.imgUrl ?? image.originImgUrl ?? ''
}

function formatGalleryDate (timestamp?: number) {
  if (!timestamp) {
    return ''
  }

  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

function formatGallerySize (size?: number) {
  if (typeof size !== 'number' || !Number.isFinite(size) || size <= 0) {
    return 0
  }

  return size / 1024 / 1024
}

export function buildGalleryPhotos (
  items: ImgInfo[],
  picBeds: IPicBedType[]
) {
  const picBedMap = new Map(picBeds.map((item) => [item.type, item.name]))

  return items.map((item, index) => {
    const dbId = item.id || `${index}`
    const providerType = typeof item.type === 'string' ? item.type : ''
    const providerName = picBedMap.get(providerType) || providerType || 'Unknown'
    const timestamp = typeof item.updatedAt === 'number'
      ? item.updatedAt
      : typeof item.createdAt === 'number'
        ? item.createdAt
        : undefined
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
      sizeMb: formatGallerySize(size),
      date: formatGalleryDate(timestamp),
      provider: providerName,
      providerType,
      raw: item,
      collection: '',
      tags: []
    } satisfies GalleryPhoto
  })
}
