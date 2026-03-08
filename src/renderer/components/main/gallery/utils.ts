import { createMockPhotos } from "./mock"

import type { ValueOf } from "@/types/utils"
export type GalleryPhoto = {
  id: number
  imgUrl: string
  originImgUrl?: string
  width?: number
  height?: number
  alt?: string
  name: string
  sizeMb: number
  date: string
  provider: string
  // TODO(v3-post-launch): Keep for data compatibility; PicGo main repo v3 UI migration can ignore this field for now.
  collection: string
  // TODO(v3-post-launch): Keep for data compatibility; PicGo main repo v3 UI migration can ignore this field for now.
  tags: string[]
}

export const GalleryViewMode = {
  Masonry: "masonry",
  List: "list",
} as const

export type GalleryViewMode =
  ValueOf<typeof GalleryViewMode>

export const NavType = {
  All: "all",
  Provider: "provider",
  Collection: "collection",
  Tag: "tag",
} as const

export type NavType = ValueOf<typeof NavType>

export type NavContext = {
  type: NavType
  value: string
}

export const providers = ["GitHub", "Amazon S3", "SM.MS"]
export const collections = ["Default Collection", "Blog Assets"]

export function filterGalleryImages(
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
          ? image.provider === navContext.value
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

export function buildSidebarTags(images: GalleryPhoto[], baseSuggestions: string[]) {
  const tagSet = new Set(baseSuggestions)
  images.forEach((image) => {
    image.tags.forEach((tag) => tagSet.add(tag))
  })
  return Array.from(tagSet)
}

export function getSelectedTags(selectedImages: GalleryPhoto[]) {
  const tagSet = new Set<string>()
  selectedImages.forEach((image) => {
    image.tags.forEach((tag) => tagSet.add(tag))
  })
  return Array.from(tagSet)
}

export function getGalleryImageUrl(image: GalleryPhoto) {
  return image.imgUrl ?? image.originImgUrl ?? ""
}

export function getImageList() {
  return createMockPhotos(providers, collections)
}
