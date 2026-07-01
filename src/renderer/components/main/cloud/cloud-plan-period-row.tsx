import { InfoIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { IPicGoCloudBillingOverview } from '#/types/cloud'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  PLAN_PERIOD_PLACEHOLDER,
  resolvePlanPeriodLabelInfo,
  resolvePlanPeriodValue,
  type PlanPeriodValue
} from './cloud-plan-usage-helpers'

interface PlanPeriodRowProps {
  billing: IPicGoCloudBillingOverview | null
  isLoading: boolean
}

export function PlanPeriodRow ({ billing, isLoading }: PlanPeriodRowProps) {
  const { t } = useTranslation()
  const value = resolvePlanPeriodValue(billing, t)
  const { labelKey, tooltipKey } = resolvePlanPeriodLabelInfo(billing)
  const tooltipText = tooltipKey ? t(tooltipKey) : null

  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="flex items-center gap-1.5 font-medium text-foreground">
        {t(labelKey)}
        {tooltipText
          ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="text-muted-foreground hover:text-foreground size-3.5 cursor-help transition-colors" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-64 text-xs leading-relaxed">{tooltipText}</p>
              </TooltipContent>
            </Tooltip>
          )
          : null}
      </span>
      <div className="flex flex-col items-end gap-0.5 text-right">
        {renderPlanPeriodValue(value, isLoading)}
      </div>
    </div>
  )
}

function renderPlanPeriodValue (value: PlanPeriodValue | null, isLoading: boolean) {
  if (isLoading) return <Skeleton className="h-4 w-24" />
  if (!value) return <span className="text-muted-foreground">{PLAN_PERIOD_PLACEHOLDER}</span>
  if (!value.primary) return <span className="text-muted-foreground">{value.secondary}</span>
  return (
    <>
      <span className="text-muted-foreground">{value.primary}</span>
      <span className="text-muted-foreground/70 text-xs">{value.secondary}</span>
    </>
  )
}
