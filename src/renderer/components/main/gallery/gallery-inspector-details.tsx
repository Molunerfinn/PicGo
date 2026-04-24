import dayjs from "dayjs"
import { useTranslation } from "react-i18next"
import { resolveTimestampValue } from "@/utils/common"
import { DEFAULT_DATE_TIME_FORMAT } from "@/utils/consts"
import type { GalleryPhoto } from "./utils"

function formatFileSize (sizeBytes: number | undefined): string {
  if (typeof sizeBytes !== 'number' || sizeBytes <= 0) return '-'
  const mb = sizeBytes / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(2)} MB`
  const kb = sizeBytes / 1024
  return `${kb.toFixed(1)} KB`
}

function formatTimestamp (value: number | string | Date | undefined): string {
  const ms = resolveTimestampValue(value)
  if (!ms) return '-'
  return dayjs(ms).format(DEFAULT_DATE_TIME_FORMAT)
}

function DetailRow ({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="shrink-0 text-[11px] text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right text-xs font-medium text-foreground">{value}</span>
    </div>
  )
}

export function GalleryInspectorDetails ({ image }: { image: GalleryPhoto }) {
  const { t } = useTranslation()
  const raw = image.raw

  return (
    <div className="space-y-2">
      <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
        {t("GALLERY_INSPECTOR_DETAILS_TITLE")}
      </div>
      <div className="overflow-hidden rounded-lg border border-border/60 divide-y divide-border/60 px-3">
        <DetailRow label={t("GALLERY_INSPECTOR_FILE_NAME")} value={raw.fileName || image.name || '-'} />
        <DetailRow label={t("GALLERY_INSPECTOR_UPLOADER")} value={image.typeName || image.type || '-'} />
        <DetailRow label={t("GALLERY_INSPECTOR_CONTENT_TYPE")} value={raw.contentType || raw.mimeType || '-'} />
        <DetailRow label={t("GALLERY_INSPECTOR_CREATED_AT")} value={formatTimestamp(raw.createdAt)} />
        <DetailRow label={t("GALLERY_INSPECTOR_UPDATED_AT")} value={formatTimestamp(raw.updatedAt)} />
        <DetailRow label={t("GALLERY_INSPECTOR_FILE_SIZE")} value={formatFileSize(raw.size)} />
      </div>
    </div>
  )
}
