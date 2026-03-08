import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type RefObject,
} from "react"

interface UseDashboardUploadResult {
  fileInputRef: RefObject<HTMLInputElement | null>
  isUploading: boolean
  uploadProgress: number
  startUpload: () => void
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void
}

export function useDashboardUpload(): UseDashboardUploadResult {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const progressIntervalRef = useRef<number | null>(null)
  const resetTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current !== null) {
        window.clearInterval(progressIntervalRef.current)
      }

      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current)
      }
    }
  }, [])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || isUploading) {
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    if (progressIntervalRef.current !== null) {
      window.clearInterval(progressIntervalRef.current)
    }

    let progress = 0
    progressIntervalRef.current = window.setInterval(() => {
      progress += Math.random() * 10

      if (progress >= 100) {
        progress = 100

        if (progressIntervalRef.current !== null) {
          window.clearInterval(progressIntervalRef.current)
          progressIntervalRef.current = null
        }

        if (resetTimeoutRef.current !== null) {
          window.clearTimeout(resetTimeoutRef.current)
        }

        resetTimeoutRef.current = window.setTimeout(() => {
          setIsUploading(false)
          setUploadProgress(0)

          if (fileInputRef.current) {
            fileInputRef.current.value = ""
          }
        }, 800)
      }

      setUploadProgress(progress)
    }, 200)
  }

  const startUpload = () => {
    fileInputRef.current?.click()
  }

  return {
    fileInputRef,
    isUploading,
    uploadProgress,
    startUpload,
    handleFileChange,
  }
}
