import { useTranslation } from "react-i18next"
import { RefreshCwIcon } from "lucide-react"
import { TooltipIconButton } from "@/components/common/tooltip-icon-button"

type CloudRefreshButtonProps = {
  onRefresh: () => Promise<void> | void
  className?: string
}

export function CloudRefreshButton ({ onRefresh, className }: CloudRefreshButtonProps) {
  const { t } = useTranslation()

  return (
    <TooltipIconButton
      tooltip={t("ALBUM_CLOUD_REFRESH")}
      icon={<RefreshCwIcon className="size-4" />}
      onClick={async () => { await onRefresh() }}
      className={className}
    />
  )
}
