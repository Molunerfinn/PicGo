import { InfoIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { CloudCardShell } from './cloud-card-shell'

interface CloudFreePlanBannerProps {
  onViewPlans: () => void
}

export function CloudFreePlanBanner ({
  onViewPlans
}: CloudFreePlanBannerProps) {
  const { t } = useTranslation()

  return (
    <CloudCardShell className="border-primary/15 bg-primary/5 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
            <InfoIcon className="size-4" />
          </div>

          <p className="min-w-0 text-sm text-muted-foreground">
            {t('PICGO_CLOUD_FREE_PLAN_BANNER')}
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-primary hover:text-primary"
          onClick={onViewPlans}
        >
          {t('PICGO_CLOUD_VIEW_PLANS')}
        </Button>
      </div>
    </CloudCardShell>
  )
}
