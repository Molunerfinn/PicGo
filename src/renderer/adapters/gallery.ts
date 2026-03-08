import { clipboard, ipcRenderer } from 'electron'
import { PASTE_TEXT } from '#/events/constants'
import { IRPCActionType } from '~/universal/types/enum'
import db from '@/utils/db'
import { getRawData } from '@/utils/common'
import { sendToMain } from '@/utils/dataSender'

type GalleryListener = () => void

export const galleryAdapter = {
  async getGalleryItems () {
    const result = await db.get<ImgInfo>({ orderBy: 'desc' })
    return result.data
  },
  async getRecentUploads (limit = 10) {
    const result = await db.get<ImgInfo>({ orderBy: 'desc' })
    return result.data.slice(0, limit)
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
    return ipcRenderer.invoke(PASTE_TEXT, getRawData(item)) as Promise<string>
  },
  copyBatchLinks (links: string[]) {
    clipboard.writeText(links.join('\n'))
  },
  subscribeToUpdates (listener: GalleryListener) {
    ipcRenderer.on(IRPCActionType.UPDATE_GALLERY, listener)
    return () => {
      ipcRenderer.removeListener(IRPCActionType.UPDATE_GALLERY, listener)
    }
  }
}
