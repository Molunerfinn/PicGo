import { useTranslation } from "react-i18next"
import { useNavigate } from "@tanstack/react-router"
import { CloudIcon, CrownIcon, LogInIcon, UploadCloudIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { openURL } from "@/utils/dataSender"
import type { IPicGoCloudUserInfo } from "#/types/cloud"

const PICGO_CLOUD_PRICING_URL = 'https://cloud.picgo.app/pricing'

type CloudEmptyStateProps = {
  userInfo: IPicGoCloudUserInfo | null | undefined
  cloudTotal: number
  cloudLoading: boolean
  onStartImport: () => void
}

function isPaidUser (userInfo: IPicGoCloudUserInfo | null | undefined): boolean {
  return userInfo !== null && userInfo !== undefined && typeof userInfo.plan === 'number' && userInfo.plan > 0
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
          <h3 className="text-lg font-semibold">{t("GALLERY_CLOUD_LOGIN_REQUIRED_TITLE")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("GALLERY_CLOUD_LOGIN_REQUIRED_DESC")}</p>
        </div>
        <Button onClick={goToCloudTab}>
          <LogInIcon className="mr-2 size-4" />
          {t("GALLERY_CLOUD_LOGIN_BUTTON")}
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
          <h3 className="text-lg font-semibold">{t("GALLERY_CLOUD_UPGRADE_TITLE")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("GALLERY_CLOUD_UPGRADE_DESC")}</p>
        </div>
        <Button
          className="bg-amber-500 text-white hover:bg-amber-600"
          onClick={() => openURL(PICGO_CLOUD_PRICING_URL)}
        >
          {t("GALLERY_CLOUD_UPGRADE_BUTTON")}
        </Button>
      </div>
    )
  }

  // Paid user, empty album, autoImport off
  if (cloudTotal === 0 && !cloudLoading && !userInfo.autoImport) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <UploadCloudIcon className="size-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">{t("GALLERY_CLOUD_IMPORT_GUIDE_TITLE")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("GALLERY_CLOUD_IMPORT_GUIDE_DESC")}</p>
        </div>
        <Button onClick={onStartImport}>
          <UploadCloudIcon className="mr-2 size-4" />
          {t("GALLERY_CLOUD_IMPORT_GUIDE_BUTTON")}
        </Button>
      </div>
    )
  }

  // Paid user, empty album (autoImport on or loading)
  if (cloudTotal === 0 && !cloudLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <CloudIcon className="size-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">{t("GALLERY_CLOUD_EMPTY_TITLE")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("GALLERY_CLOUD_EMPTY_DESC")}</p>
        </div>
      </div>
    )
  }

  return null
}
