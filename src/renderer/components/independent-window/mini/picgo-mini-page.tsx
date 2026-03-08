import { type CSSProperties, type ChangeEvent, type DragEvent, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { isLinux } from "@/lib/platform"
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
  const [isDragOver, setIsDragOver] = useState(false)
  const { showProgress, progress, hasError, uploadFiles } = useMiniUpload()

  const handleSelectFiles = async (files: File[]) => {
    if (files.length === 0) {
      return
    }

    try {
      const uploadedCount = await uploadFiles(files)
      if (uploadedCount > 0) {
        console.info(`[mini-page] upload succeeded: ${uploadedCount} file(s)`)
      }
    } catch (error) {
      console.error(
        `[mini-page] upload failed: ${resolveIndependentWindowErrorMessage(error, t("UPLOAD_FAILED"))}`
      )
    }
  }

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = event.target.files ? Array.from(event.target.files) : []
    event.target.value = ""
    await handleSelectFiles(nextFiles)
  }

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
    const droppedFiles = event.dataTransfer?.files
    if (!droppedFiles || droppedFiles.length === 0) {
      return
    }
    await handleSelectFiles(Array.from(droppedFiles))
  }

  return (
    <UtilityWindowLayout page="mini" shellClassName="flex">
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
            onClick={handleOpenFilePicker}
            onDoubleClick={handleOpenFilePicker}
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
