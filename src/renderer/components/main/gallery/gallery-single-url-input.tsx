import { useState, type FocusEvent } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import type { GalleryUrlRewriteChange } from "./gallery-url-rewrite-dialog"
import { getGalleryImageUrl, type GalleryPhoto } from "./utils"

type GallerySingleUrlInputProps = {
  image: GalleryPhoto
  onApply: (changes: GalleryUrlRewriteChange[]) => void
}

export function GallerySingleUrlInput({
  image,
  onApply,
}: GallerySingleUrlInputProps) {
  const { t } = useTranslation()
  const currentUrl = getGalleryImageUrl(image)
  const [draftUrl, setDraftUrl] = useState(() => currentUrl)
  const [isEditing, setIsEditing] = useState(false)

  const hasPendingChange =
    isEditing && draftUrl.trim() !== "" && draftUrl.trim() !== currentUrl

  const resetDraft = () => {
    setDraftUrl(currentUrl)
    setIsEditing(false)
  }

  const handleContainerBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextFocused = event.relatedTarget
    if (nextFocused instanceof Node && event.currentTarget.contains(nextFocused)) {
      return
    }
    resetDraft()
  }

  const handleConfirm = () => {
    const nextUrl = draftUrl.trim()
    if (!nextUrl || nextUrl === currentUrl) {
      resetDraft()
      return
    }

    onApply([
      {
        id: image.id,
        nextSrc: nextUrl,
        originImgUrl: image.originImgUrl ?? currentUrl,
      },
    ])
    toast.success(t("GALLERY_URL_REWRITE_RESULT_TITLE"))
    setIsEditing(false)
  }

  return (
    <div className="flex items-center gap-2" onBlur={handleContainerBlur}>
      <Input
        value={draftUrl}
        onFocus={() => setIsEditing(true)}
        onChange={(event) => {
          setDraftUrl(event.target.value)
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return
          event.preventDefault()
          handleConfirm()
        }}
        aria-label={t("GALLERY_URL")}
        className={cn("min-w-0 flex-1 bg-background/70 transition-[width] duration-200")}
      />
      <div
        className={cn(
          "overflow-hidden transition-[width,opacity] duration-200 ease-out",
          hasPendingChange ? "w-20 opacity-100" : "w-0 opacity-0"
        )}
      >
        <Button
          type="button"
          size="sm"
          className="h-9 w-20 shrink-0"
          onMouseDown={(event) => event.preventDefault()}
          onClick={handleConfirm}
          tabIndex={hasPendingChange ? 0 : -1}
          aria-hidden={!hasPendingChange}
        >
          {t("CONFIRM")}
        </Button>
      </div>
    </div>
  )
}
