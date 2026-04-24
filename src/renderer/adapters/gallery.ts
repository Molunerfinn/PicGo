import { PASTE_TEXT } from '#/events/constants'
import db from '@/utils/db'
import { sendToMain } from '@/utils/dataSender'
import { clipboard, ipc } from '@/utils/bridge'

import { resolveTimestampValue } from '@/utils/common'

function resolveGalleryItemTimestamp (item: ImgInfo) {
  return resolveTimestampValue(item.createdAt) || resolveTimestampValue(item.updatedAt)
}

export const galleryAdapter = {
  async getGalleryItems () {
    const result = await db.get<ImgInfo>({ orderBy: 'desc' })
    return result.data
  },
  async getRecentUploads (limit = 100) {
    const result = await db.get<ImgInfo>({ orderBy: 'desc' })
    return [...result.data]
      .sort((left, right) => resolveGalleryItemTimestamp(right) - resolveGalleryItemTimestamp(left))
      .slice(0, limit)
  },
  async updateImageUrl (id: string, imgUrl: string) {
    await db.updateById(id, { imgUrl })
  },
  async updateImportFlag (id: string, imported: boolean) {
    await db.updateById(id, { _importToPicGoCloud: imported })
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
