import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "motion/react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

import type { GalleryPhoto } from "./utils"

type GalleryPreviewProps = {
  isOpen: boolean
  images: GalleryPhoto[]
  activeId: number | null
  onClose: () => void
  onActiveIdChange: (id: number) => void
}

export function GalleryPreview({
  isOpen,
  images,
  activeId,
  onClose,
  onActiveIdChange,
}: GalleryPreviewProps) {
  const { t } = useTranslation()
  const [direction, setDirection] = useState(0)
  const [isSlideMode, setIsSlideMode] = useState(false)
  const pendingCloseRef = useRef(false)
  const activeIndex = images.findIndex((image) => image.id === activeId)
  const resolvedIndex = activeIndex >= 0 ? activeIndex : 0
  const activeImage = images[resolvedIndex]
  const canNavigate = images.length > 1
  const isSingle = images.length === 1
  const isActive = isOpen && Boolean(activeImage)
  const portalRoot = typeof document === "undefined" ? null : document.body
  const activeImageName = activeImage?.name ?? ""
  const countLabel = t("GALLERY_PREVIEW_COUNT", {
    current: resolvedIndex + 1,
    total: images.length,
  })
  const activeImageUrl = activeImage ? activeImage.imgUrl ?? activeImage.originImgUrl ?? "" : ""

  const handleClose = () => {
    setDirection(0)
    if (isSingle || !isSlideMode) {
      onClose()
      return
    }
    pendingCloseRef.current = true
    setIsSlideMode(false)
  }

  const handleSlideExitComplete = () => {
    if (!pendingCloseRef.current) return
    pendingCloseRef.current = false
    onClose()
  }

  const goToIndex = (index: number) => {
    const nextImage = images[index]
    if (!nextImage) return
    onActiveIdChange(nextImage.id)
  }

  const navigateToIndex = (nextIndex: number, nextDirection: number) => {
    setDirection(nextDirection)
    setIsSlideMode(true)
    goToIndex(nextIndex)
  }

  const handlePrev = () => {
    if (!canNavigate) return
    const nextIndex = (resolvedIndex - 1 + images.length) % images.length
    navigateToIndex(nextIndex, -1)
  }

  const handleNext = () => {
    if (!canNavigate) return
    const nextIndex = (resolvedIndex + 1) % images.length
    navigateToIndex(nextIndex, 1)
  }

  useEffect(() => {
    if (!isActive) return
    const originalOverflow = document.body.style.overflow
    const originalPadding = document.body.style.paddingRight
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth

    document.body.style.overflow = "hidden"
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }

    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.paddingRight = originalPadding
    }
  }, [isActive])

  useEffect(() => {
    if (!isOpen) {
      pendingCloseRef.current = false
    }
  }, [isOpen])

  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        setDirection(0)
        if (isSingle || !isSlideMode) {
          onClose()
          return
        }
        pendingCloseRef.current = true
        setIsSlideMode(false)
        return
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        if (!canNavigate) return
        const nextIndex = (resolvedIndex - 1 + images.length) % images.length
        const nextImage = images[nextIndex]
        if (nextImage) {
          setDirection(-1)
          setIsSlideMode(true)
          onActiveIdChange(nextImage.id)
        }
        return
      }
      if (event.key === "ArrowRight") {
        event.preventDefault()
        if (!canNavigate) return
        const nextIndex = (resolvedIndex + 1) % images.length
        const nextImage = images[nextIndex]
        if (nextImage) {
          setDirection(1)
          setIsSlideMode(true)
          onActiveIdChange(nextImage.id)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    canNavigate,
    images,
    isActive,
    isSingle,
    isSlideMode,
    onActiveIdChange,
    onClose,
    resolvedIndex,
  ])

  if (!portalRoot) return null

  return createPortal(
    <AnimatePresence>
      {isActive ? (
        <motion.div
          layoutRoot
          className="bg-gallery-preview-overlay fixed inset-0 z-[60] flex items-center justify-center supports-backdrop-filter:backdrop-blur-(--blur-gallery-preview)"
          role="dialog"
          aria-modal="true"
          aria-label={t("GALLERY_PREVIEW")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <div className="relative flex h-full w-full items-center justify-center p-(--app-gallery-preview-padding)">
            <motion.img
              key={activeImage.id}
              src={activeImageUrl}
              alt={activeImage.alt ?? ""}
              className={cn(
                "max-h-full max-w-full rounded-(--radius-gallery-preview) object-contain shadow-(--app-gallery-preview-shadow)",
                isSlideMode
                  ? "opacity-0 pointer-events-none"
                  : "opacity-100"
              )}
              loading="lazy"
              decoding="async"
              draggable={false}
              onClick={(event) => {
                event.stopPropagation()
                handleClose()
              }}
            />
            <AnimatePresence
              custom={direction}
              mode="wait"
              initial={false}
              onExitComplete={handleSlideExitComplete}
            >
              {isSlideMode ? (
                <motion.img
                  key={activeImage.id}
                  custom={direction}
                  variants={{
                    enter: (value: number) => ({
                      x: value > 0 ? 60 : value < 0 ? -60 : 0,
                      opacity: value === 0 ? 1 : 0,
                    }),
                    center: { x: 0, opacity: 1 },
                    exit: (value: number) => ({
                      x: value > 0 ? -60 : value < 0 ? 60 : 0,
                      opacity: value === 0 ? 1 : 0,
                    }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.26, ease: "easeOut" }}
                  src={activeImageUrl}
                  alt={activeImage.alt ?? ""}
                  className="absolute inset-0 m-auto max-h-full max-w-full rounded-(--radius-gallery-preview) object-contain shadow-(--app-gallery-preview-shadow)"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  onClick={(event) => {
                    event.stopPropagation()
                    handleClose()
                  }}
                />
              ) : null}
            </AnimatePresence>
          </div>

          {canNavigate ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-4">
              <Button
                variant="outline"
                size="icon-lg"
                onClick={(event) => {
                  event.stopPropagation()
                  handlePrev()
                }}
                aria-label={t("GALLERY_PREVIEW_PREV")}
                className="bg-gallery-preview-control border-gallery-preview-control-border pointer-events-auto shadow-sm"
              >
                <ChevronLeft className="size-5" />
              </Button>
              <Button
                variant="outline"
                size="icon-lg"
                onClick={(event) => {
                  event.stopPropagation()
                  handleNext()
                }}
                aria-label={t("GALLERY_PREVIEW_NEXT")}
                className="bg-gallery-preview-control border-gallery-preview-control-border pointer-events-auto shadow-sm"
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>
          ) : null}

          <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2">
            <div
              title={activeImageName}
              className="bg-gallery-preview-control border-gallery-preview-control-border text-foreground max-w-[min(60vw,28rem)] truncate rounded-full border px-3 py-1 text-xs font-medium shadow-sm"
            >
              {activeImageName}
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2">
            <div className="bg-gallery-preview-control border-gallery-preview-control-border text-foreground rounded-full border px-3 py-1 text-xs font-medium shadow-sm">
              {countLabel}
            </div>
          </div>

          <div className="absolute right-4 top-4">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={(event) => {
                event.stopPropagation()
                handleClose()
              }}
              aria-label={t("GALLERY_PREVIEW_CLOSE")}
              className="bg-gallery-preview-control border-gallery-preview-control-border shadow-sm"
            >
              <X className="size-4" />
            </Button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    portalRoot
  )
}
