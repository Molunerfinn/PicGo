import { InfoIcon, LoaderCircleIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { IPicGoCloudBillingOverview, IPicGoCloudUsage } from '#/types/cloud'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { capitalizePlanCode, isQuotaDowngraded } from '@/utils/plan'
import {
  computePercent,
  formatCountDimension,
  formatStorageDimension,
  isOverQuota
} from './cloud-plan-usage-helpers'

interface UsageBodyProps {
  data: IPicGoCloudUsage | null
  billing: IPicGoCloudBillingOverview | null
  isLoading: boolean
  isError: boolean
  isFetching: boolean
  onRetry: () => void
}

export function UsageBody ({
  data,
  billing,
  isLoading,
  isError,
  isFetching,
  onRetry
}: UsageBodyProps) {
  const { t } = useTranslation()
  const storageLabel = t('PICGO_CLOUD_STORAGE_LABEL')
  const filesLabel = t('PICGO_CLOUD_FILES_LABEL')

  if (isLoading) {
    return (
      <div className="space-y-4">
        <UsageProgressSkeleton label={storageLabel} />
        <UsageProgressSkeleton label={filesLabel} />
      </div>
    )
  }

  if (isError || !data) {
    return <UsageErrorState isFetching={isFetching} onRetry={onRetry} />
  }

  const unlimitedLabel = t('PICGO_CLOUD_USAGE_UNLIMITED')
  const renderProgressTemplate = (used: string, total: string) =>
    t('PICGO_CLOUD_USAGE_PROGRESS', { used, total })
  const effective = data.effectiveQuotaPlan ?? null
  const downgraded = isQuotaDowngraded(billing?.plan?.paid ?? data.plan ?? null, effective)
  const downgradeTooltip = downgraded
    ? t('PICGO_CLOUD_QUOTA_DOWNGRADED', { plan: capitalizePlanCode(effective) })
    : undefined

  return (
    <div className="space-y-4">
      <UsageProgressRow
        label={storageLabel}
        value={formatStorageDimension(data.storage, unlimitedLabel, renderProgressTemplate)}
        percent={computePercent(data.storage)}
        overQuota={isOverQuota(data.storage)}
        tooltipMessage={downgradeTooltip}
      />
      <UsageProgressRow
        label={filesLabel}
        value={formatCountDimension(data.mediaCount, unlimitedLabel, renderProgressTemplate)}
        percent={computePercent(data.mediaCount)}
        overQuota={isOverQuota(data.mediaCount)}
        tooltipMessage={downgradeTooltip}
      />
    </div>
  )
}

interface UsageProgressRowProps {
  label: string
  value: string
  percent: number
  overQuota: boolean
  tooltipMessage?: string
}

function UsageProgressRow ({ label, value, percent, overQuota, tooltipMessage }: UsageProgressRowProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className={cn('text-muted-foreground', overQuota && 'text-destructive font-medium')}>{value}</span>
          {tooltipMessage
            ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground inline-flex size-4 items-center justify-center transition-colors"
                  >
                    <InfoIcon className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-72">{tooltipMessage}</TooltipContent>
              </Tooltip>
            )
            : null}
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full', overQuota ? 'bg-destructive' : 'bg-primary')}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function UsageProgressSkeleton ({ label }: { label: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-1.5 w-full rounded-full" />
    </div>
  )
}

function UsageErrorState ({ isFetching, onRetry }: { isFetching: boolean, onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-border/60 p-4">
      <p className="text-sm text-muted-foreground">{t('PICGO_CLOUD_USAGE_LOAD_FAILED')}</p>
      <Button size="sm" variant="outline" disabled={isFetching} onClick={onRetry}>
        {isFetching ? <LoaderCircleIcon className="mr-2 size-4 animate-spin" /> : null}
        {t('PICGO_CLOUD_RETRY')}
      </Button>
    </div>
  )
}
