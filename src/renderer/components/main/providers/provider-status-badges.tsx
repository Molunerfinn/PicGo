import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const STATUS_TOOLTIP_DELAY = 120

interface ProviderStatusBadgeProps {
  uploaderName?: string
  className?: string
}

export function ProviderActiveUploaderBadge({
  uploaderName,
  className,
}: ProviderStatusBadgeProps) {
  const { t } = useTranslation()

  return (
    <Tooltip delayDuration={STATUS_TOOLTIP_DELAY}>
      <TooltipTrigger asChild>
        <Badge variant="secondary" className={className}>
          {t("PROVIDER_ACTIVE_UPLOADER_LABEL")}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <span>
          {t("PROVIDER_ACTIVE_UPLOADER_TOOLTIP", {
            uploaderName,
          })}
        </span>
      </TooltipContent>
    </Tooltip>
  )
}

export function ProviderDefaultConfigBadge({
  uploaderName,
  className,
}: ProviderStatusBadgeProps) {
  const { t } = useTranslation()

  return (
    <Tooltip delayDuration={STATUS_TOOLTIP_DELAY}>
      <TooltipTrigger asChild>
        <Badge variant="secondary" className={className}>
          {t("PROVIDER_DEFAULT_CONFIG_LABEL")}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <span>
          {t("PROVIDER_DEFAULT_CONFIG_TOOLTIP", {
            uploaderName,
          })}
        </span>
      </TooltipContent>
    </Tooltip>
  )
}
