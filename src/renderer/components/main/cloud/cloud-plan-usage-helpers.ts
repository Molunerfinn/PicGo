import type { TFunction } from 'i18next'
import type {
  IPicGoCloudBillingOverview,
  IPicGoCloudUsageDimension
} from '#/types/cloud'
import { formatBytes, formatDate } from '@/utils/format'
import { capitalizePlanCode, getDisplayPlan, isAbnormalLifecyclePhase } from '@/utils/plan'

export const PLAN_PERIOD_PLACEHOLDER = '-'

const SUBSCRIPTION_ACTIVE_STATUSES = new Set(['active', 'paid', 'trialing'])
const SUBSCRIPTION_SCHEDULED_CANCEL_STATUS = 'scheduled_cancel'

export function resolvePlanPeriodLabelInfo (
  billing: IPicGoCloudBillingOverview | null
): { labelKey: ILocalesKey, tooltipKey: ILocalesKey | null } {
  const phase = billing?.lifecycle?.phase
  switch (phase) {
    case 'grace':
      return {
        labelKey: 'PICGO_CLOUD_PLAN_PERIOD_GRACE_LABEL',
        tooltipKey: 'PICGO_CLOUD_PLAN_PERIOD_GRACE_TOOLTIP'
      }
    case 'frozen':
      return {
        labelKey: 'PICGO_CLOUD_PLAN_PERIOD_FROZEN_LABEL',
        tooltipKey: 'PICGO_CLOUD_PLAN_PERIOD_FROZEN_TOOLTIP'
      }
    default:
      return { labelKey: 'PICGO_CLOUD_PLAN_PERIOD_LABEL', tooltipKey: null }
  }
}

export type PlanPeriodValue = {
  primary: string | null
  secondary: string
}

export function resolvePlanPeriodValue (
  billing: IPicGoCloudBillingOverview | null,
  t: TFunction
): PlanPeriodValue | null {
  const paid = billing?.plan?.paid
  const capability = billing?.plan?.capability
  if (getDisplayPlan(paid, capability) === 'free') return null

  const phase = billing?.lifecycle?.phase
  const isAbnormal = isAbnormalLifecyclePhase(phase)
  const planTypeLabel = isAbnormal ? null : capitalizePlanCode(billing?.plan?.billingPeriod)
  const subStatus = billing?.subscription?.status?.toLowerCase() ?? null
  const subEnd = billing?.subscription?.currentPeriodEnd ?? null
  const phaseEnd = billing?.lifecycle?.currentPhaseEndsAt ?? null

  if (subEnd && subStatus && SUBSCRIPTION_ACTIVE_STATUSES.has(subStatus)) {
    const date = formatDate(subEnd)
    if (date) return { primary: planTypeLabel, secondary: t('PICGO_CLOUD_PLAN_PERIOD_RENEWS', { date }) }
  }
  if (subEnd && subStatus === SUBSCRIPTION_SCHEDULED_CANCEL_STATUS) {
    const date = formatDate(subEnd)
    if (date) return { primary: planTypeLabel, secondary: t('PICGO_CLOUD_PLAN_PERIOD_CANCELS', { date }) }
  }
  if (phaseEnd) {
    const date = formatDate(phaseEnd)
    if (date) {
      // grace/frozen 期 label 已经是「宽限期至 / 冻结期至」，secondary 直接给日期避免双重前缀
      const secondary = isAbnormal ? date : t('PICGO_CLOUD_PLAN_PERIOD_UNTIL', { date })
      return { primary: planTypeLabel, secondary }
    }
  }
  if (phase === 'active' && !phaseEnd && !subEnd) {
    return { primary: planTypeLabel, secondary: t('PICGO_CLOUD_PLAN_PERIOD_LIFETIME') }
  }
  return null
}

export function formatStorageDimension (
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

export function formatCountDimension (
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

export function computePercent (dimension: IPicGoCloudUsageDimension | undefined): number {
  const used = dimension?.used
  const limit = dimension?.limit
  if (typeof used !== 'number' || typeof limit !== 'number' || limit <= 0) {
    return 0
  }
  return Math.min((used / limit) * 100, 100)
}

export function isOverQuota (dimension: IPicGoCloudUsageDimension | undefined): boolean {
  const used = dimension?.used
  const limit = dimension?.limit
  if (typeof used !== 'number' || typeof limit !== 'number' || limit <= 0) {
    return false
  }
  return used > limit
}
