import logger from '@core/picgo/logger'
import windowManager from 'apis/app/window/windowManager'
import { uploadClipboardFiles, uploadSelectedFiles } from 'apis/app/uploader/apis'
import path from 'path'
import { dbPathDir, getFormImageFolderPath } from 'apis/core/datastore/dbChecker'
import fs from 'fs-extra'
import { cleanupFormUploaderFiles } from '~/main/utils/cleanupFormUploaderFiles'
import {
  buildError,
  buildSuccess,
  getFormDataFileName,
  isFileLike,
  isRecord,
  type HonoContextLike
} from './utils'

const STORE_PATH = dbPathDir()
const LOG_PATH = path.join(STORE_PATH, 'picgo.log')

const errorMessage = `upload error. see ${LOG_PATH} for more detail.`

const handleClipboardUpload = async (c: HonoContextLike): Promise<Response> => {
  try {
    logger.info('[PicGo Server] upload clipboard file')
    const res = await uploadClipboardFiles()
    if (res) {
      return c.json(buildSuccess([res]))
    }
    return c.json(buildError(errorMessage), 500)
  } catch (e: unknown) {
    logger.error('[PicGo Server] upload clipboard error', e)
    return c.json(buildError(errorMessage), 500)
  }
}

const handleListUpload = async (c: HonoContextLike, list: string[]): Promise<Response> => {
  try {
    logger.info('[PicGo Server] upload files in list')
    const win = windowManager.getAvailableWindow()
    if (!win) {
      return c.json(buildError(errorMessage), 500)
    }
    const pathList = list.map(item => ({ path: item }))
    const res = await uploadSelectedFiles(win.webContents, pathList)
    if (res.length) {
      return c.json(buildSuccess(res))
    }
    return c.json(buildError(errorMessage), 500)
  } catch (e: unknown) {
    logger.error('[PicGo Server] upload list error', e)
    return c.json(buildError(errorMessage), 500)
  }
}

export const uploadHandler = async (c: HonoContextLike): Promise<Response> => {
  const contentType = c.req.raw.headers.get('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    const tempFiles: string[] = []
    try {
      const formData = await c.req.formData()
      const files = formData.getAll('files') as unknown[]
      if (files.length === 0) {
        return c.json(buildError('No files found in form-data: files'), 400)
      }

      // Pre-validate to avoid leaking already-written temp files.
      const fileLikes: Array<Parameters<typeof getFormDataFileName>[0]> = []
      for (const file of files) {
        if (!isFileLike(file)) {
          return c.json(buildError('Invalid form-data: files must be file(s)'), 400)
        }
        fileLikes.push(file)
      }

      const formImagesPath = getFormImageFolderPath()
      await fs.ensureDir(formImagesPath)

      for (const file of fileLikes) {
        const fileName = getFormDataFileName(file)
        const safeName = path.basename(fileName)
        const filePath = path.join(formImagesPath, safeName)
        const buffer = Buffer.from(await file.arrayBuffer())
        await fs.writeFile(filePath, buffer)
        tempFiles.push(filePath)
      }

      return await handleListUpload(c, tempFiles)
    } catch (e: unknown) {
      logger.error('[PicGo Server] process form upload error', e)
      return c.json(buildError(errorMessage), 500)
    } finally {
      cleanupFormUploaderFiles(tempFiles)
    }
  }

  const bodyText = await c.req.raw.text().catch(() => '')

  // No request body -> upload from clipboard.
  if (bodyText.trim() === '') {
    return await handleClipboardUpload(c)
  }

  let body: unknown
  try {
    body = JSON.parse(bodyText)
  } catch {
    return c.json(buildError('Invalid JSON body'), 400)
  }

  // GUI compatibility: JSON without list (or empty list) -> upload from clipboard.
  if (!isRecord(body) || !('list' in body)) {
    return await handleClipboardUpload(c)
  }

  const listValue = body.list
  if (listValue === undefined) {
    return await handleClipboardUpload(c)
  }

  if (!Array.isArray(listValue)) {
    return c.json(buildError('Invalid request body: { list: string[] } required'), 400)
  }

  if (listValue.length === 0) {
    return await handleClipboardUpload(c)
  }

  if (!listValue.every((item) => typeof item === 'string')) {
    return c.json(buildError('Invalid request body: { list: string[] } required'), 400)
  }

  return await handleListUpload(c, listValue)
}
