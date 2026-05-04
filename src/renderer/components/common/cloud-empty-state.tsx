import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "@tanstack/react-router"
import { CrownIcon, LoaderCircleIcon, LogInIcon, UploadCloudIcon } from "lucide-react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { openURL } from "@/utils/dataSender"
import { UserPlanLevel, type IPicGoCloudUserInfo } from "#/types/cloud"

const PICGO_CLOUD_PRICING_URL = 'https://cloud.picgo.app/pricing'

type CloudEmptyStateProps = {
  userInfo: IPicGoCloudUserInfo | null | undefined
  cloudTotal: number
  cloudLoading: boolean
  onStartImport: () => Promise<void> | void
}

function isPaidUser (userInfo: IPicGoCloudUserInfo | null | undefined): boolean {
  return (userInfo?.plan ?? UserPlanLevel.Free) > UserPlanLevel.Free
}

function ImportButton ({ onStartImport, needsConfirm }: { onStartImport: () => Promise<void> | void, needsConfirm: boolean }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleImport = async () => {
    setLoading(true)
    try {
      await onStartImport()
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  if (!needsConfirm) {
    return (
      <Button disabled={loading} onClick={() => { handleImport().catch(() => {}) }}>
        {loading ? <LoaderCircleIcon className="mr-1.5 size-4 animate-spin" /> : <UploadCloudIcon className="mr-2 size-4" />}
        {t("ALBUM_CLOUD_IMPORT_GUIDE_BUTTON")}
      </Button>
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button>
          <UploadCloudIcon className="mr-2 size-4" />
          {t("ALBUM_CLOUD_IMPORT_GUIDE_BUTTON")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("ALBUM_CLOUD_IMPORT_CONFIRM_TITLE")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("ALBUM_CLOUD_IMPORT_CONFIRM_DESC")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{t("CANCEL")}</AlertDialogCancel>
          <Button
            disabled={loading}
            onClick={(event) => {
              event.preventDefault()
              handleImport().catch(() => {})
            }}
          >
            {loading ? <LoaderCircleIcon className="mr-1.5 size-4 animate-spin" /> : null}
            {t("CONFIRM")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function CloudEmptyState ({
  userInfo,
  cloudTotal,
  cloudLoading,
  onStartImport,
}: CloudEmptyStateProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const goToCloudTab = () => {
    navigate({ to: '/main/cloud' })
  }

  // Not logged in
  if (userInfo === null || userInfo === undefined) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <LogInIcon className="size-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">{t("ALBUM_CLOUD_LOGIN_REQUIRED_TITLE")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("ALBUM_CLOUD_LOGIN_REQUIRED_DESC")}</p>
        </div>
        <Button onClick={goToCloudTab}>
          <LogInIcon className="mr-2 size-4" />
          {t("ALBUM_CLOUD_LOGIN_BUTTON")}
        </Button>
      </div>
    )
  }

  // Free user
  if (!isPaidUser(userInfo)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <div className="flex size-16 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/30">
          <CrownIcon className="size-8 text-amber-500" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">{t("ALBUM_CLOUD_UPGRADE_TITLE")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("ALBUM_CLOUD_UPGRADE_DESC")}</p>
        </div>
        <Button
          className="bg-amber-500 text-white hover:bg-amber-600"
          onClick={() => openURL(PICGO_CLOUD_PRICING_URL)}
        >
          {t("ALBUM_CLOUD_UPGRADE_BUTTON")}
        </Button>
      </div>
    )
  }

  // Paid user, empty album
  if (cloudTotal === 0 && !cloudLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <UploadCloudIcon className="size-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">{t("ALBUM_CLOUD_IMPORT_GUIDE_TITLE")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("ALBUM_CLOUD_IMPORT_GUIDE_DESC")}</p>
        </div>
        <ImportButton onStartImport={onStartImport} needsConfirm={!isPaidUser(userInfo) || !userInfo.autoImport} />
      </div>
    )
  }

  return null
}
