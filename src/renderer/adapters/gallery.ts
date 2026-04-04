import { PASTE_TEXT } from '#/events/constants'
import db from '@/utils/db'
import { sendToMain } from '@/utils/dataSender'
import { clipboard, ipc } from '@/utils/bridge'

interface GalleryHistoryItem extends ImgInfo {
  createdAt?: number
  updatedAt?: number
}

function resolveGalleryItemTimestamp (item: GalleryHistoryItem) {
  if (typeof item.updatedAt === 'number') {
    return item.updatedAt
  }

  if (typeof item.createdAt === 'number') {
    return item.createdAt
  }

  return 0
}

export const galleryAdapter = {
  async getGalleryItems () {
    const result = await db.get<ImgInfo>({ orderBy: 'desc' })
    return result.data
  },
  async getRecentUploads (limit = 100) {
    const result = await db.get<GalleryHistoryItem>({ orderBy: 'desc' })
    return [...result.data]
      .sort((left, right) => resolveGalleryItemTimestamp(right) - resolveGalleryItemTimestamp(left))
      .slice(0, limit)
  },
  async updateImageUrl (id: string, imgUrl: string) {
    await db.updateById(id, { imgUrl })
  },
  async removeById (id: string) {
    const file = await db.getById<ImgInfo>(id)
    await db.removeById(id)
    if (file) {
      sendToMain('removeFiles', [file])
    }
  },
  async copyImageLink (item: ImgInfo) {
    return ipc.invoke<string>(PASTE_TEXT, item)
  },
  copyBatchLinks (links: string[]) {
    clipboard.writeText(links.join('\n'))
  }
}
