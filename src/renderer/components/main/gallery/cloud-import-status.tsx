import { useState } from "react"
import { useTranslation } from "react-i18next"
import { CheckCircle2Icon, LoaderCircleIcon, UploadCloudIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cloudAlbumAdapter } from "@/adapters/cloud-album"
import { galleryAdapter } from "@/adapters/gallery"
import { appActions, useAppStore } from "@/store"
import type { GalleryPhoto } from "./utils"

const PICGO_CLOUD_TYPE = 'picgo-cloud'

type CloudImportStatusProps = {
  images: GalleryPhoto[]
}

export function CloudImportStatus ({ images }: CloudImportStatusProps) {
  const { t } = useTranslation()
  const userInfo = useAppStore.use.picgoCloud().userInfo
  const [importing, setImporting] = useState(false)
  const [localImportedIds, setLocalImportedIds] = useState<Set<string>>(new Set())
  const [showAutoImportDialog, setShowAutoImportDialog] = useState(false)
  const [autoImportEnabling, setAutoImportEnabling] = useState(false)

  const isPaid = (userInfo?.plan ?? 0) > 0
  if (!isPaid) return null

  const autoImportEnabled = userInfo?.autoImport === true

  // Analyze selection status
  const allInCloud = images.every((img) =>
    img.type === PICGO_CLOUD_TYPE || img.raw._importToPicGoCloud === true || localImportedIds.has(img.dbId)
  )
  const noneNeedImport = images.every((img) => img.type === PICGO_CLOUD_TYPE)
  const importableItems = images.filter((img) =>
    img.type !== PICGO_CLOUD_TYPE && img.raw._importToPicGoCloud !== true && !localImportedIds.has(img.dbId)
  )

  const doImport = async (itemsToImport: GalleryPhoto[]) => {
    setImporting(true)
    try {
      const rawItems = itemsToImport.map((img) => img.raw)
      await cloudAlbumAdapter.importItems(rawItems)
      // Mark imported in local DB
      const importedIds = new Set(localImportedIds)
      for (const img of itemsToImport) {
        if (img.dbId) {
          await galleryAdapter.updateImportFlag(img.dbId, true)
          importedIds.add(img.dbId)
        }
      }
      setLocalImportedIds(importedIds)
      toast.success(t("GALLERY_CLOUD_IMPORT_SINGLE_SUCCESS"))
    } catch (error) {
      console.error(error)
      toast.error(t("GALLERY_CLOUD_IMPORT_FAILED"))
    } finally {
      setImporting(false)
    }
  }

  const handleImportClick = (itemsToImport: GalleryPhoto[]) => {
    if (!autoImportEnabled) {
      setShowAutoImportDialog(true)
      return
    }
    const importPromise = doImport(itemsToImport)
    importPromise.catch(() => {})
  }

  const handleAutoImportConfirm = async () => {
    setAutoImportEnabling(true)
    try {
      const result = await cloudAlbumAdapter.setAutoImport(true)
      if (result.success) {
        appActions.setPicGoCloudUserInfo(result.data)
      }
      // Now do the import
      await doImport(importableItems.length > 0 ? importableItems : images.filter((img) => img.type !== PICGO_CLOUD_TYPE))
    } catch (error) {
      console.error(error)
      toast.error(t("GALLERY_CLOUD_IMPORT_FAILED"))
    } finally {
      setAutoImportEnabling(false)
      setShowAutoImportDialog(false)
    }
  }

  // Single image: PicGo Cloud native
  if (images.length === 1 && noneNeedImport) {
    return (
      <div className="space-y-2">
        <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
          {t("GALLERY_CLOUD_IMPORT_STATUS_TITLE")}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2Icon className="size-3.5" />
          <span>{t("GALLERY_CLOUD_NATIVE")}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
        {t("GALLERY_CLOUD_IMPORT_STATUS_TITLE")}
      </div>

      {allInCloud || noneNeedImport ? (
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2Icon className="size-3.5" />
                <span>{t("GALLERY_CLOUD_ALL_IMPORTED")}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-48 text-xs">{t("GALLERY_CLOUD_IMPORTED_TOOLTIP")}</p>
            </TooltipContent>
          </Tooltip>
          <Button
            variant="ghost"
            size="xs"
            className="text-xs"
            disabled={importing}
            onClick={() => handleImportClick(images.filter((img) => img.type !== PICGO_CLOUD_TYPE))}
          >
            {t("GALLERY_CLOUD_REIMPORT")}
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          disabled={importing}
          onClick={() => handleImportClick(importableItems)}
        >
          {importing
            ? <LoaderCircleIcon className="mr-1.5 size-3.5 animate-spin" />
            : <UploadCloudIcon className="mr-1.5 size-3.5" />}
          {importing
            ? t("GALLERY_CLOUD_IMPORTING")
            : t("GALLERY_CLOUD_IMPORT_BUTTON_COUNT", { num: String(importableItems.length) })}
        </Button>
      )}

      <AlertDialog open={showAutoImportDialog} onOpenChange={setShowAutoImportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("GALLERY_CLOUD_AUTO_IMPORT_REQUIRED_TITLE")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("GALLERY_CLOUD_AUTO_IMPORT_REQUIRED_DESC")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={autoImportEnabling}>
              {t("CANCEL")}
            </AlertDialogCancel>
            <AlertDialogAction disabled={autoImportEnabling} onClick={handleAutoImportConfirm}>
              {autoImportEnabling ? <LoaderCircleIcon className="mr-1.5 size-4 animate-spin" /> : null}
              {t("GALLERY_CLOUD_AUTO_IMPORT_ENABLE_AND_IMPORT")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
