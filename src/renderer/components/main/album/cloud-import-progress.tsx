import { useState } from "react"
import { useTranslation } from "react-i18next"
import { XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIPCOn } from "@/hooks/useIPC"
import type { CloudImportProgress } from "#/types/cloudAlbum"

type CloudImportProgressBannerProps = {
  onComplete: () => void
}

export function CloudImportProgressBanner ({ onComplete }: CloudImportProgressBannerProps) {
  const { t } = useTranslation()
  const [progress, setProgress] = useState<CloudImportProgress | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useIPCOn('CLOUD_IMPORT_PROGRESS', (_event: unknown, data: CloudImportProgress) => {
    setProgress(data)
    setDismissed(false)
    if (data.current >= data.total) {
      setTimeout(() => {
        setDismissed(true)
        onComplete()
      }, 2000)
    }
  })

  if (!progress || dismissed) return null

  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <div className="mx-5 mt-2 flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>{t("ALBUM_CLOUD_IMPORTING")}</span>
          <span>{progress.current}/{progress.total}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => setDismissed(true)}
      >
        <XIcon className="size-3" />
      </Button>
    </div>
  )
}
