import { type CSSProperties, type ChangeEvent, type DragEvent, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { miniPageAdapter } from "@/adapters/mini-page"
import { cn } from "@/lib/utils"
import { showNotification } from "@/utils/notification"
import { isLinux } from "@/utils/bridge"
import { UtilityWindowLayout } from "@/components/independent-window/utility-window-layout"
import { resolveIndependentWindowErrorMessage } from "@/components/independent-window/utils"
import { useMiniUpload } from "./hooks/use-mini-upload"

const picGoSquareLogoUrl = "/squareLogo.png"

function buildMiniPageStyle(): CSSProperties {
  const backgroundSize = "100% 100%"

  return {
    backgroundImage: `url(${picGoSquareLogoUrl})`,
    backgroundSize,
    backgroundPosition: "center center",
    backgroundRepeat: "no-repeat",
  }
}

function buildUploadAreaStyle(
  showProgress: boolean,
  progress: number
): CSSProperties {
  if (!showProgress) {
    return {}
  }

  const normalizedProgress = Math.min(100, Math.max(0, progress))

  return {
    backgroundImage: `linear-gradient(to top, var(--primary) ${normalizedProgress}%, var(--card) ${normalizedProgress}%)`,
  }
}

export function PicGoMiniPage() {
  const { t } = useTranslation()
  const isLinuxPlatform = isLinux()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const didDragRef = useRef(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [mouseDownX, setMouseDownX] = useState(-1)
  const [mouseDownY, setMouseDownY] = useState(-1)
  const [mouseDownScreenX, setMouseDownScreenX] = useState(-1)
  const [mouseDownScreenY, setMouseDownScreenY] = useState(-1)
  const { showProgress, progress, hasError, uploadFiles } = useMiniUpload()

  useEffect(() => {
    document.body.style.background = 'transparent'
    document.documentElement.style.background = 'transparent'
  }, [])

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click()
  }

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      setDragging(true)
      didDragRef.current = false
      setMouseDownX(event.pageX)
      setMouseDownY(event.pageY)
      setMouseDownScreenX(event.screenX)
      setMouseDownScreenY(event.screenY)
    }

    const handleMouseMove = (event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()

      if (!dragging) {
        return
      }

      didDragRef.current = true
      miniPageAdapter.moveMiniWindow({
        x: event.screenX - mouseDownX,
        y: event.screenY - mouseDownY,
        width: 64,
        height: 64
      })
    }

    const handleMouseUp = (event: MouseEvent) => {
      setDragging(false)
      if (mouseDownScreenX === event.screenX && mouseDownScreenY === event.screenY) {
        if (event.button === 0) {
          handleOpenFilePicker()
        } else {
          miniPageAdapter.openMiniMenu()
        }
      }
    }

    window.addEventListener("mousedown", handleMouseDown, false)
    window.addEventListener("mousemove", handleMouseMove, false)
    window.addEventListener("mouseup", handleMouseUp, false)

    return () => {
      window.removeEventListener("mousedown", handleMouseDown, false)
      window.removeEventListener("mousemove", handleMouseMove, false)
      window.removeEventListener("mouseup", handleMouseUp, false)
    }
  }, [dragging, mouseDownScreenX, mouseDownScreenY, mouseDownX, mouseDownY])

  const handleSelectFiles = async (files: FileList) => {
    if (files.length === 0) {
      return
    }

    try {
      await uploadFiles(files)
    } catch (error) {
      console.error(
        `[mini-page] upload failed: ${resolveIndependentWindowErrorMessage(error, t("UPLOAD_FAILED"))}`
      )
    }
  }

  const handleFileInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = event.target.files
    event.target.value = ""
    if (!nextFiles) {
      return
    }
    await handleSelectFiles(nextFiles)
  }

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
    const droppedFiles = event.dataTransfer?.files

    if (droppedFiles?.length) {
      await handleSelectFiles(droppedFiles)
      return
    }

    const dataTransfer = event.dataTransfer
    if (!dataTransfer) {
      return
    }

    const uriList = dataTransfer.getData("text/uri-list")
    if (uriList) {
      const { urls, invalidLines } = miniPageAdapter.parseDroppedUriList(
        uriList,
        dataTransfer.getData("text/html")
      )
      if (urls.length) {
        miniPageAdapter.uploadUrlList(urls, invalidLines)
        return
      }
    }

    const plainText = dataTransfer.getData("text/plain")
    if (plainText) {
      const { urls, invalidLines } = miniPageAdapter.parseDroppedPlainText(plainText)
      if (urls.length) {
        miniPageAdapter.uploadUrlList(urls, invalidLines)
        return
      }
    }

    showNotification({
      title: t("TIPS_ERROR"),
      body: t("TIPS_DRAG_VALID_PICTURE_OR_URL")
    })
  }

  return (
    <UtilityWindowLayout page="mini" shellClassName="flex" className="bg-transparent">
      <div
        id="mini-page"
        className={cn(
          "relative h-(--app-utility-shell-height) w-(--app-utility-shell-width) cursor-pointer border-4 border-white bg-primary",
          isLinuxPlatform ? "linux rounded-none" : "rounded-full",
          hasError ? "border-destructive" : ""
        )}
        style={buildMiniPageStyle()}
        title="mini-upload-surface"
      >
        <div
          id="upload-area"
          className={cn(
            "h-full w-full transition-all duration-200",
            isLinuxPlatform ? "linux rounded-none" : "rounded-full",
            isDragOver ? "is-dragover bg-black/30" : "",
            showProgress ? "uploading" : ""
          )}
          style={buildUploadAreaStyle(showProgress, progress)}
          onDrop={handleDrop}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={(event) => {
            event.preventDefault()
            setIsDragOver(false)
          }}
        >
          <div
            id="upload-dragger"
            role="button"
            tabIndex={0}
            aria-label={t("CLICK_TO_UPLOAD")}
            className="h-full w-full"
            onClick={() => { if (!didDragRef.current) handleOpenFilePicker() }}
            onDoubleClick={() => { if (!didDragRef.current) handleOpenFilePicker() }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                handleOpenFilePicker()
              }
            }}
          >
            <input
              id="file-uploader"
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileInputChange}
              aria-label={t("CLICK_TO_UPLOAD")}
              title="mini-file-input"
            />
          </div>
        </div>
      </div>
    </UtilityWindowLayout>
  )
}
