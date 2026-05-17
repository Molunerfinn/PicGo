import { BarChart3Icon, LoaderCircleIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type {
  IPicGoCloudBillingOverview,
  IPicGoCloudUsage,
  IPicGoCloudUsageDimension
} from '#/types/cloud'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { usePicGoCloudBillingQuery } from '@/queries/picgo-cloud-billing'
import { usePicGoCloudUsageQuery } from '@/queries/picgo-cloud-usage'
import { formatBytes, formatDateRange } from '@/utils/format'
import { CloudCardShell } from './cloud-card-shell'

const PLAN_PERIOD_PLACEHOLDER = '-'

function formatPlanPeriodType (billingPeriod: string | null | undefined): string | null {
  if (!billingPeriod) return null
  return billingPeriod.charAt(0).toUpperCase() + billingPeriod.slice(1)
}

function formatStorageDimension (
  dimension: IPicGoCloudUsageDimension | undefined,
  unlimitedLabel: string,
  template: (used: string, total: string) => string
): string {
  const used = formatBytes(dimension?.used)
  const limit = dimension?.limit
  const total = limit === null || limit === undefined
    ? unlimitedLabel
    : formatBytes(limit)
  return template(used, total)
}

function formatCountDimension (
  dimension: IPicGoCloudUsageDimension | undefined,
  unlimitedLabel: string,
  template: (used: string, total: string) => string
): string {
  const used = (dimension?.used ?? 0).toLocaleString()
  const limit = dimension?.limit
  const total = limit === null || limit === undefined
    ? unlimitedLabel
    : limit.toLocaleString()
  return template(used, total)
}

function computePercent (dimension: IPicGoCloudUsageDimension | undefined): number {
  const used = dimension?.used
  const limit = dimension?.limit
  if (typeof used !== 'number' || typeof limit !== 'number' || limit <= 0) {
    return 0
  }
  return Math.min((used / limit) * 100, 100)
}

function UsageProgressRow ({
  label,
  value,
  percent
}: {
  label: string
  value: string
  percent: number
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
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

export function CloudPlanUsageCard () {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch, isFetching } = usePicGoCloudUsageQuery()
  const { data: billingData, isLoading: isBillingLoading } = usePicGoCloudBillingQuery()

  const renderProgressTemplate = (used: string, total: string) =>
    t('PICGO_CLOUD_USAGE_PROGRESS', { used, total })

  return (
    <CloudCardShell className="flex h-full flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
          <BarChart3Icon className="size-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">
            {t('PICGO_CLOUD_PLAN_USAGE_TITLE')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('PICGO_CLOUD_PLAN_USAGE_DESC')}
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <PlanPeriodRow
          label={t('PICGO_CLOUD_PLAN_PERIOD_LABEL')}
          billing={billingData ?? null}
          usage={data ?? null}
          isLoading={isBillingLoading}
        />

        <Separator />

        <UsageBody
          data={data ?? null}
          isLoading={isLoading}
          isError={isError}
          isFetching={isFetching}
          onRetry={() => { refetch().catch(() => {}) }}
          renderProgressTemplate={renderProgressTemplate}
        />
      </div>
    </CloudCardShell>
  )
}

function PlanPeriodRow ({
  label,
  billing,
  usage,
  isLoading
}: {
  label: string
  billing: IPicGoCloudBillingOverview | null
  usage: IPicGoCloudUsage | null
  isLoading: boolean
}) {
  const planTypeLabel = formatPlanPeriodType(billing?.plan?.billingPeriod)
  const dateRange = planTypeLabel
    ? formatDateRange(usage?.monthlyServes?.periodStart, usage?.monthlyServes?.periodEnd)
    : null

  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <div className="flex flex-col items-end gap-0.5 text-right">
        {isLoading
          ? <Skeleton className="h-4 w-24" />
          : planTypeLabel
            ? (
              <>
                <span className="text-muted-foreground">{planTypeLabel}</span>
                {dateRange
                  ? <span className="text-muted-foreground/70 text-xs">{dateRange}</span>
                  : null}
              </>
            )
            : <span className="text-muted-foreground">{PLAN_PERIOD_PLACEHOLDER}</span>
        }
      </div>
    </div>
  )
}

function UsageBody ({
  data,
  isLoading,
  isError,
  isFetching,
  onRetry,
  renderProgressTemplate
}: {
  data: IPicGoCloudUsage | null
  isLoading: boolean
  isError: boolean
  isFetching: boolean
  onRetry: () => void
  renderProgressTemplate: (used: string, total: string) => string
}) {
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
    return (
      <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-border/60 p-4">
        <p className="text-sm text-muted-foreground">
          {t('PICGO_CLOUD_USAGE_LOAD_FAILED')}
        </p>
        <Button
          size="sm"
          variant="outline"
          disabled={isFetching}
          onClick={onRetry}
        >
          {isFetching
            ? <LoaderCircleIcon className="mr-2 size-4 animate-spin" />
            : null}
          {t('PICGO_CLOUD_RETRY')}
        </Button>
      </div>
    )
  }

  const unlimitedLabel = t('PICGO_CLOUD_USAGE_UNLIMITED')

  return (
    <div className="space-y-4">
      <UsageProgressRow
        label={storageLabel}
        value={formatStorageDimension(data?.storage, unlimitedLabel, renderProgressTemplate)}
        percent={computePercent(data?.storage)}
      />
      <UsageProgressRow
        label={filesLabel}
        value={formatCountDimension(data?.mediaCount, unlimitedLabel, renderProgressTemplate)}
        percent={computePercent(data?.mediaCount)}
      />
    </div>
  )
}
