import { useEffect, useRef, useState } from "react"

import { miniPageAdapter } from "@/adapters/mini-page"
import { useIPCOn } from "@/hooks/useIPC"

interface UseMiniUploadResult {
  showProgress: boolean
  progress: number
  hasError: boolean
  uploadFiles: (files: FileList) => Promise<void>
}

export function useMiniUpload(): UseMiniUploadResult {
  const [showProgress, setShowProgress] = useState(false)
  const [progress, setProgress] = useState(0)
  const [hasError, setHasError] = useState(false)
  const isMountedRef = useRef(true)
  const hideProgressTimerRef = useRef<number | null>(null)
  const resetProgressTimerRef = useRef<number | null>(null)

  const clearProgressTimers = () => {
    if (hideProgressTimerRef.current !== null) {
      window.clearTimeout(hideProgressTimerRef.current)
      hideProgressTimerRef.current = null
    }

    if (resetProgressTimerRef.current !== null) {
      window.clearTimeout(resetProgressTimerRef.current)
      resetProgressTimerRef.current = null
    }
  }

  const scheduleProgressCleanup = () => {
    clearProgressTimers()

    hideProgressTimerRef.current = window.setTimeout(() => {
      setShowProgress(false)
      setHasError(false)
    }, 1000)

    resetProgressTimerRef.current = window.setTimeout(() => {
      setProgress(0)
    }, 1200)
  }

  useIPCOn('uploadProgress', (_event, nextProgress: number) => {
    if (!isMountedRef.current) {
      return
    }

    if (nextProgress !== -1) {
      setShowProgress(true)
      setProgress(nextProgress)
      return
    }

    setProgress(100)
    setHasError(true)
  })

  // Ensure delayed progress timers are cleaned up when the mini page unmounts.
  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
      clearProgressTimers()
    }
  }, [])

  const uploadFiles = async (files: FileList) => {
    clearProgressTimers()
    setShowProgress(true)
    setHasError(false)
    setProgress(0)

    try {
      miniPageAdapter.uploadChosenFiles(files)
    } catch (error) {
      if (isMountedRef.current) {
        setProgress(100)
        setHasError(true)
      }
      throw error
    } finally {
      if (isMountedRef.current) {
        scheduleProgressCleanup()
      }
    }
  }

  return {
    showProgress,
    progress,
    hasError,
    uploadFiles,
  }
}
