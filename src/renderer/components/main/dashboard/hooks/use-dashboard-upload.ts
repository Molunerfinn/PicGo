import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type RefObject
} from 'react'
import { webUtils } from 'electron'
import { useIPCOn } from '@/hooks/useIPC'
import { dashboardAdapter } from '@/adapters/dashboard'

interface UseDashboardUploadResult {
  fileInputRef: RefObject<HTMLInputElement | null>
  isUploading: boolean
  uploadProgress: number
  startUpload: () => void
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  uploadFileList: (files: FileList) => void
  uploadClipboardFiles: () => void
  uploadUrls: (urls: string[]) => void
}

function toUploadFiles (files: FileList) {
  return Array.from(files)
    .map((item) => {
      const filePath = webUtils.getPathForFile(item)
      if (!filePath) {
        return null
      }

      return {
        name: item.name,
        path: filePath
      } satisfies IFileWithPath
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
}

export function useDashboardUpload (): UseDashboardUploadResult {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const resetTimeoutRef = useRef<number | null>(null)

  useIPCOn('uploadProgress', (_event, progress: number) => {
    if (progress === -1) {
      setIsUploading(false)
      setUploadProgress(100)

      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current)
      }

      resetTimeoutRef.current = window.setTimeout(() => {
        setUploadProgress(0)
      }, 800)
      return
    }

    setIsUploading(progress < 100)
    setUploadProgress(progress)
  })

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current)
      }
    }
  }, [])

  const uploadFileList = (files: FileList) => {
    const nextFiles = toUploadFiles(files)
    if (!nextFiles.length) {
      return
    }

    dashboardAdapter.uploadSelectedFiles(nextFiles)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return
    }

    uploadFileList(event.target.files)
    event.target.value = ''
  }

  const startUpload = () => {
    fileInputRef.current?.click()
  }

  const uploadClipboardFiles = () => {
    dashboardAdapter.uploadClipboardFiles()
  }

  const uploadUrls = (urls: string[]) => {
    dashboardAdapter.uploadSelectedFiles(
      urls.map((url) => ({
        path: url
      }))
    )
  }

  return {
    fileInputRef,
    isUploading,
    uploadProgress,
    startUpload,
    handleFileChange,
    uploadFileList,
    uploadClipboardFiles,
    uploadUrls
  }
}
