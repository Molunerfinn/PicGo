import { useTranslation } from "react-i18next"
import { CloudIcon, RefreshCwIcon, ShieldCheckIcon } from "lucide-react"

const FEATURES = [
  { icon: CloudIcon, key: 'GALLERY_CLOUD_FEATURE_SYNC' },
  { icon: RefreshCwIcon, key: 'GALLERY_CLOUD_FEATURE_AUTO_IMPORT' },
  { icon: ShieldCheckIcon, key: 'GALLERY_CLOUD_FEATURE_SECURE' },
] as const

export function CloudFeatureHighlights () {
  const { t } = useTranslation()

  return (
    <div className="mx-1 rounded-lg border border-border/60 bg-muted/30 p-3">
      <div className="mb-3 text-[11px] font-medium text-muted-foreground/70">
        {t("GALLERY_CLOUD_FEATURES_TITLE")}
      </div>
      <div className="space-y-2.5">
        {FEATURES.map(({ icon: Icon, key }) => (
          <div key={key} className="flex items-center gap-2">
            <div className="flex size-5 shrink-0 items-center justify-center rounded bg-primary/10">
              <Icon className="size-3 text-primary" />
            </div>
            <span className="text-[13px] text-muted-foreground">
              {t(key)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
