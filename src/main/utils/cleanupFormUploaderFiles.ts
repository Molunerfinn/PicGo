import path from 'path'
import fs from 'fs-extra'
import { getFormImageFolderPath } from '@core/datastore/dbChecker'
import logger from '@core/picgo/logger'

export const cleanupFormUploaderFiles = (fileInfoList?: string[] | ImgInfo[]): void => {
  const formImageFolderPath = getFormImageFolderPath()
  if (Array.isArray(fileInfoList)) {
    fileInfoList.forEach(async fileInfo => {
      const filePath = typeof fileInfo === 'string' ? fileInfo : fileInfo?.imgPath
      if (!filePath) {
        return
      }
      try {
        // 检查文件路径是否在 formImageFolderPath 目录下
        const relativePath = path.relative(formImageFolderPath, filePath)
        const isWithinFolder = !relativePath.startsWith('..') && !path.isAbsolute(relativePath)

        if (isWithinFolder && await fs.pathExists(filePath)) {
          await fs.remove(filePath)
          logger.info(`[PicGo] Deleted temp file: ${filePath}`)
        }
      } catch (error: any) {
        logger.error('[PicGo] Failed to delete temp file', filePath, error)
      }
    })
  }
}
