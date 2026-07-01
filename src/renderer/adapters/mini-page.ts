import { LOG_INVALID_URL_LINES, SET_MINI_WINDOW_POS, SHOW_MINI_PAGE_MENU } from '#/events/constants'
import {
  isUrl,
  parseNewlineSeparatedUrls
} from '~/universal/utils/common'
import { sendToMain } from '@/utils/dataSender'
import { getFilePath } from '@/utils/common'

function buildSendFiles (files: FileList) {
  const sendFiles: IFileWithPath[] = []

  Array.from(files).forEach((item) => {
    const filePath = getFilePath(item)
    if (!filePath) {
      return
    }

    sendFiles.push({
      name: item.name,
      path: filePath
    })
  })

  return sendFiles
}

export const miniPageAdapter = {
  uploadChosenFiles (files: FileList) {
    const sendFiles = buildSendFiles(files)
    if (!sendFiles.length) {
      return
    }

    sendToMain('uploadChoosedFiles', sendFiles)
  },
  uploadUrlList (urls: string[], invalidLines: string[]) {
    if (invalidLines.length) {
      sendToMain(LOG_INVALID_URL_LINES, invalidLines)
    }

    sendToMain(
      'uploadChoosedFiles',
      urls.map((url) => ({ path: url }))
    )
  },
  parseDroppedUriList (uriListText: string, htmlText: string) {
    const { urls, invalidLines } = parseNewlineSeparatedUrls(uriListText, {
      source: 'uri-list'
    })

    if (urls.length) {
      return {
        urls,
        invalidLines
      }
    }

    const urlMatch = htmlText.match(/<img.*src="(.*?)"/)
    if (urlMatch && isUrl(urlMatch[1])) {
      return {
        urls: [urlMatch[1]],
        invalidLines
      }
    }

    return {
      urls: [],
      invalidLines
    }
  },
  parseDroppedPlainText (plainText: string) {
    return parseNewlineSeparatedUrls(plainText, {
      source: 'plain'
    })
  },
  moveMiniWindow (pos: IMiniWindowPos) {
    sendToMain(SET_MINI_WINDOW_POS, pos)
  },
  openMiniMenu () {
    sendToMain(SHOW_MINI_PAGE_MENU)
  }
}
