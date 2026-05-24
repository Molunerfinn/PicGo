import { BarChart3Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Separator } from '@/components/ui/separator'
import { usePicGoCloudBillingQuery } from '@/queries/picgo-cloud-billing'
import { usePicGoCloudUsageQuery } from '@/queries/picgo-cloud-usage'
import { CloudCardShell } from './cloud-card-shell'
import { PlanPeriodRow } from './cloud-plan-period-row'
import { UsageBody } from './cloud-usage-body'

export function CloudPlanUsageCard () {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch, isFetching } = usePicGoCloudUsageQuery()
  const { data: billingData, isLoading: isBillingLoading } = usePicGoCloudBillingQuery()

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
        <PlanPeriodRow billing={billingData ?? null} isLoading={isBillingLoading} />
        <Separator />
        <UsageBody
          data={data ?? null}
          billing={billingData ?? null}
          isLoading={isLoading}
          isError={isError}
          isFetching={isFetching}
          onRetry={() => { refetch().catch(() => {}) }}
        />
      </div>
    </CloudCardShell>
  )
}
