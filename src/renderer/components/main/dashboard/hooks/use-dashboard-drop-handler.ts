import { useMemoizedFn } from 'ahooks'
import type { DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { isUrl, parseNewlineSeparatedUrls } from '#/utils/common'
import { dashboardAdapter } from '@/adapters/dashboard'

const LARGE_BATCH_THRESHOLD = 10

interface UseDashboardDropHandlerOptions {
  uploadFileList: (files: FileList) => void
  uploadUrls: (urls: string[]) => void
}

export function useDashboardDropHandler ({
  uploadFileList,
  uploadUrls
}: UseDashboardDropHandlerOptions) {
  const { t } = useTranslation()

  const dispatchUrls = useMemoizedFn(async (urls: string[], invalidLines: string[]): Promise<boolean> => {
    if (invalidLines.length > 0) {
      dashboardAdapter.logInvalidUrlLines(invalidLines)
      toast.warning(t('TIPS_SKIPPED_INVALID_URLS', { n: invalidLines.length }))
    }
    if (urls.length > LARGE_BATCH_THRESHOLD && !window.confirm(t('TIPS_TOO_MANY_URLS_CONFIRM', { n: urls.length }))) {
      return false
    }
    uploadUrls(urls)
    return true
  })

  const handleDrop = useMemoizedFn(async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const { dataTransfer } = event

    if (dataTransfer.files.length > 0) {
      uploadFileList(dataTransfer.files)
      return
    }

    const uriListText = dataTransfer.getData('text/uri-list')
    if (uriListText) {
      const { urls, invalidLines } = parseNewlineSeparatedUrls(uriListText, { source: 'uri-list' })
      if (urls.length) {
        await dispatchUrls(urls, invalidLines)
        return
      }
      const urlString = dataTransfer.getData('text/html')
      const urlMatch = urlString.match(/<img.*src="(.*?)"/)
      if (urlMatch && isUrl(urlMatch[1])) {
        await dispatchUrls([urlMatch[1]], invalidLines)
        return
      }
      toast.error(t('TIPS_DRAG_VALID_PICTURE_OR_URL'))
      return
    }

    const plainText = dataTransfer.getData('text/plain')
    if (plainText) {
      const { urls, invalidLines } = parseNewlineSeparatedUrls(plainText, { source: 'plain' })
      if (!urls.length) {
        toast.error(t('TIPS_DRAG_VALID_PICTURE_OR_URL'))
        return
      }
      await dispatchUrls(urls, invalidLines)
      return
    }

    toast.error(t('TIPS_DRAG_VALID_PICTURE_OR_URL'))
  })

  return { handleDrop, dispatchUrls }
}
