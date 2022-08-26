import path from 'path'
import fs from 'fs-extra'
import { Logger } from 'picgo'
import { isUrl } from '~/universal/utils/common'
interface IResultFileObject {
  path: string
}
type Result = IResultFileObject[]

interface IHandleArgvResult {
  success: boolean
  fileList?: string[]
}

const handleArgv = (argv: string[]): IHandleArgvResult => {
  const uploadIndex = argv.indexOf('upload')
  if (uploadIndex !== -1) {
    const fileList = argv.slice(1 + uploadIndex)
    return {
      success: true,
      fileList
    }
  }
  return {
    success: false
  }
}

const getUploadFiles = (argv = process.argv, cwd = process.cwd(), logger: Logger) => {
  const { success, fileList } = handleArgv(argv)
  if (!success) {
    return []
  } else {
    if (fileList?.length === 0) {
      return null // for uploading images in clipboard
    } else if ((fileList?.length || 0) > 0) {
      const result = fileList!.map(item => {
        if (isUrl(item)) {
          return {
            path: item
          }
        }
        if (path.isAbsolute(item)) {
          return {
            path: item
          }
        } else {
          const tempPath = path.join(cwd, item)
          if (fs.existsSync(tempPath)) {
            return {
              path: tempPath
            }
          } else {
            logger.warn(`cli -> can't get file: ${tempPath}, invalid path`)
            return null
          }
        }
      }).filter(item => item !== null) as Result
      return result
    }
  }
  return []
}

export {
  getUploadFiles
}
