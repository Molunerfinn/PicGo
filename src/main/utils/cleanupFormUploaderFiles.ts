import path from 'path'
import fs from 'fs-extra'
import { getFormImageFolderPath } from '@core/datastore/dbChecker'
import logger from '@core/picgo/logger'

export const cleanupFormUploaderFiles = (filePathList?: string[]): void => {
  const formImageFolderPath = getFormImageFolderPath()
  if (Array.isArray(filePathList)) {
    filePathList.forEach(async filePath => {
      try {
        // 检查文件路径是否在 formImageFolderPath 目录下
        const relativePath = path.relative(formImageFolderPath, filePath)
        const isWithinFolder = !relativePath.startsWith('..') && !path.isAbsolute(relativePath)

        if (isWithinFolder && await fs.pathExists(filePath)) {
          await fs.remove(filePath)
          logger.info(`[PicGo] Deleted temp file: ${filePath}`)
        }
      } catch (error: any) {
        logger.error(`[PicGo] Failed to delete temp file ${filePath}:`, error)
      }
    })
  }
}
