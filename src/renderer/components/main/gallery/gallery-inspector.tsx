import type { ReactNode } from "react"
import { Copy, Trash2, X } from "lucide-react"
import type { ValueOf } from "@/types/utils"
import { AlbumSource } from "#/types/cloudAlbum"
import { CloudImportStatus } from "./cloud-import-status"
import { GalleryDeleteDialog } from "./gallery-delete-dialog"
import { GalleryInspectorDetails } from "./gallery-inspector-details"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FloatingPanelSheetContent } from "@/components/common/floating-panel-sheet-content"
import { Sheet, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { galleryAdapter } from "@/adapters/gallery"
import {
  GalleryUrlRewriteDialog,
  type GalleryUrlRewriteChange,
} from "./gallery-url-rewrite-dialog"
import { GallerySingleUrlInput } from "./gallery-single-url-input"
import type { GalleryPhoto } from "./utils"
import { getGalleryImageUrl } from "./utils"

const INSPECTOR_ACTION_BUTTON_VARIANT = {
  DEFAULT: "default",
  DESTRUCTIVE: "destructive",
} as const

type InspectorActionButtonVariant =
  ValueOf<typeof INSPECTOR_ACTION_BUTTON_VARIANT>

type GalleryInspectorProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  selectedIds: number[]
  selectedImages: GalleryPhoto[]
  // TODO(v3-post-launch): Restore tag + collection props when Gallery Tags/Collections UI returns.
  // selectedTags: string[]
  // collections: string[]
  // tagSuggestions: string[]
  // tagInput: string
  // onTagInputChange: (value: string) => void
  // onTagSubmit: () => void
  // onAddTag: (tag: string) => void
  // onRemoveTag: (tag: string) => void
  // onCollectionChange: (value: string) => void
  onDelete: () => Promise<void>
  onPreviewOpen: (imageId: number) => void
  onUrlRewrite: (changes: GalleryUrlRewriteChange[]) => void
  albumSource?: AlbumSource
}

function InspectorActionButton({
  icon,
  label,
  variant = INSPECTOR_ACTION_BUTTON_VARIANT.DEFAULT,
  disabled = false,
  onClick,
}: {
  icon: ReactNode
  label: string
  variant?: InspectorActionButtonVariant
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <Button
      variant="ghost"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-auto flex-col gap-1.5 rounded-lg px-3 py-2 text-xs transition-colors",
        variant === INSPECTOR_ACTION_BUTTON_VARIANT.DESTRUCTIVE
          ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
          : "hover:bg-primary/10"
      )}
    >
      {icon}
      <span>{label}</span>
    </Button>
  )
}

export function GalleryInspector({
  isOpen,
  onOpenChange,
  selectedIds,
  selectedImages,
  // TODO(v3-post-launch): Restore tag + collection prop wiring when Gallery Tags/Collections UI returns.
  // selectedTags,
  // collections,
  // tagSuggestions,
  // tagInput,
  // onTagInputChange,
  // onTagSubmit,
  // onAddTag,
  // onRemoveTag,
  // onCollectionChange,
  onDelete,
  onPreviewOpen,
  onUrlRewrite,
  albumSource: _albumSource,
}: GalleryInspectorProps) {
  const { t } = useTranslation()
  const canAct = selectedImages.length > 0

  const handleCopy = async () => {
    if (!canAct) return
    try {
      const copiedLinks = await Promise.all(
        selectedImages.map(async (image) => {
          return galleryAdapter.copyImageLink(image.raw)
        })
      )

      galleryAdapter.copyBatchLinks(copiedLinks)
      toast.success(
        selectedImages.length > 1
          ? t("BATCH_COPY_LINK_SUCCEED")
          : t("COPY_LINK_SUCCEED")
      )
    } catch {
      toast.error(t("OPERATION_FAILED"))
    }
  }

  // TODO(v3-post-launch): Restore inspector single/batch download handler when download action returns.
  // const handleDownload = () => {
  //   if (!canAct) return
  //   selectedImages.forEach((image, index) => {
  //     const downloadUrl = getGalleryImageUrl(image)
  //     const link = document.createElement("a")
  //     link.href = downloadUrl
  //     link.download = image.name || `image-${index + 1}`
  //     link.rel = "noreferrer"
  //     link.target = "_blank"
  //     document.body.appendChild(link)
  //     link.click()
  //     link.remove()
  //   })
  // }


  return (
    <Sheet
      open={isOpen}
      onOpenChange={onOpenChange}
      modal={false}
      disablePointerDismissal={true}
    >
      <FloatingPanelSheetContent
        side="right"
        showOverlay={false}
        showCloseButton={false}
        data-gallery-inspector="true"
        style={{
          backgroundImage: "var(--app-gallery-inspector-bg-image)",
          backdropFilter: "blur(var(--app-gallery-inspector-backdrop-blur))",
        }}
        className="bg-gallery-inspector text-sidebar-foreground border-sidebar-border w-(--app-gallery-inspector-width) bg-cover bg-center bg-no-repeat sm:max-w-none"
      >
        <SheetTitle className="sr-only">
          {t("GALLERY_INSPECTOR_TITLE")}
        </SheetTitle>
        <SheetDescription className="sr-only">
          {t("GALLERY_INSPECTOR_DESCRIPTION")}
        </SheetDescription>
        <div className="border-border/60 flex items-center justify-between border-b px-4 py-3">
          <div className="font-semibold">
            {t("GALLERY_SELECTED_COUNT", {
              count: selectedIds.length,
            })}
          </div>
          <Button variant="ghost" size="icon-xs" onClick={() => onOpenChange(false)}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="border-border/60 bg-primary/5 border-b px-3 py-3">
            <div className="grid grid-cols-2 gap-2">
              <InspectorActionButton icon={<Copy />} label={t("COPY")} onClick={handleCopy} />
              {/* TODO(v3-post-launch): Restore inspector download action when feature scope is re-enabled.
              <InspectorActionButton
                icon={<Download />}
                label={t("GALLERY_EXPORT")}
                onClick={handleDownload}
              />
              */}
              <GalleryDeleteDialog
                selectedCount={selectedIds.length}
                onConfirm={onDelete}
                trigger={
                  <InspectorActionButton
                    icon={<Trash2 />}
                    label={t("DELETE")}
                    variant="destructive"
                    disabled={!canAct}
                  />
                }
              />
            </div>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-5 px-4 py-4">
              <div className="border-border/60 mb-2 aspect-video overflow-hidden rounded-lg border">
                {selectedImages.length > 1 ? (
                  <div className="grid h-full grid-cols-2 gap-1 p-1">
                    {selectedImages.slice(0, 4).map((image, index) => {
                      const isOverflow = index === 3 && selectedImages.length > 4
                      return (
                        <button
                          key={image.id}
                          type="button"
                          onClick={() => onPreviewOpen(image.id)}
                          title={t("GALLERY_PREVIEW")}
                          aria-label={t("GALLERY_PREVIEW")}
                          className="relative h-full w-full overflow-hidden rounded-lg cursor-zoom-in"
                        >
                          {image.isVideo ? (
                            <video
                              src={image.imgUrl}
                              className="h-full w-full object-cover"
                              draggable={false}
                              preload="metadata"
                              muted
                              playsInline
                            />
                          ) : (
                            <img
                              src={image.imgUrl}
                              alt={image.alt}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              decoding="async"
                              draggable={false}
                            />
                          )}
                          {!isOverflow ? (
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 overflow-hidden bg-background/60 text-foreground shadow-sm backdrop-blur-sm dark:bg-background/45">
                              <div className="truncate px-2 py-1 text-center text-[10px] font-medium leading-none sm:text-xs">
                                {image.name}
                              </div>
                            </div>
                          ) : null}
                          {isOverflow && (
                            <div className="absolute inset-0 flex items-center justify-center bg-foreground/70 text-sm font-semibold text-background">
                              +{selectedImages.length - 4}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ) : selectedImages.length === 1 ? (
                  <button
                    type="button"
                    onClick={() => onPreviewOpen(selectedImages[0].id)}
                    title={t("GALLERY_PREVIEW")}
                    aria-label={t("GALLERY_PREVIEW")}
                    className="relative h-full w-full cursor-zoom-in overflow-hidden"
                  >
                    {selectedImages[0].isVideo ? (
                      <video
                        src={selectedImages[0].imgUrl}
                        className="h-full w-full object-cover"
                        draggable={false}
                        preload="metadata"
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={selectedImages[0].imgUrl}
                        alt={selectedImages[0].alt}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                      />
                    )}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 overflow-hidden bg-background/60 text-foreground shadow-sm backdrop-blur-sm dark:bg-background/45">
                      <div className="truncate px-2 py-1 text-center text-[10px] font-medium leading-none sm:text-xs">
                        {selectedImages[0].name}
                      </div>
                    </div>
                  </button>
                ) : (
                  <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                    {t("GALLERY_SELECTED_COUNT", { count: 0 })}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                  {t("GALLERY_URL")}
                </div>
                {selectedIds.length === 1 ? (
                  selectedImages[0] ? (
                    <GallerySingleUrlInput
                      key={`${selectedImages[0].id}-${getGalleryImageUrl(selectedImages[0])}`}
                      image={selectedImages[0]}
                      onApply={onUrlRewrite}
                    />
                  ) : null
                ) : (
                  <GalleryUrlRewriteDialog
                    selectedImages={selectedImages}
                    onApply={onUrlRewrite}
                  />
                )}
              </div>

              {/* TODO(v3-post-launch): Restore collection editor in inspector when Collections feature returns.
              <div className="space-y-2">
                <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                  {t("GALLERY_COLLECTION")}
                </div>
                <Select
                  value={selectedImages[0]?.collection ?? ""}
                  onValueChange={onCollectionChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("GALLERY_COLLECTION")} />
                  </SelectTrigger>
                  <SelectContent>
                    {collections.map((collection) => (
                      <SelectItem key={collection} value={collection}>
                        {collection}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              */}

              {_albumSource === AlbumSource.LOCAL && selectedImages.length > 0 ? (
                <CloudImportStatus images={selectedImages} />
              ) : null}

              {selectedImages.length === 1 && selectedImages[0] ? (
                <GalleryInspectorDetails image={selectedImages[0]} />
              ) : null}

              {/* TODO(v3-post-launch): Restore tags editor in inspector when Tags feature returns.
              <div className="space-y-3">
                <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                  {t("GALLERY_TAGS")}
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.length === 0 ? (
                    <div className="text-muted-foreground text-xs">
                      {t("GALLERY_TAG_SUGGESTIONS")}
                    </div>
                  ) : (
                    selectedTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => onRemoveTag(tag)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {tagSuggestions.map((tag) => (
                    <Button
                      key={tag}
                      variant={selectedTags.includes(tag) ? "secondary" : "outline"}
                      size="xs"
                      onClick={() => onAddTag(tag)}
                    >
                      #{tag}
                    </Button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    value={tagInput}
                    onChange={(event) => onTagInputChange(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        onTagSubmit()
                      }
                    }}
                    placeholder={t("GALLERY_ADD_TAG")}
                  />
                  <Button variant="outline" size="sm" onClick={onTagSubmit}>
                    {t("GALLERY_ADD")}
                  </Button>
                </div>
              </div>
              */}
            </div>
          </ScrollArea>
        </div>
      </FloatingPanelSheetContent>
    </Sheet>
  )
}
