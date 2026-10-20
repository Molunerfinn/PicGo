import type { TFunction } from 'i18next'
import {
  PicGoCloudFixedTermSource,
  PicGoCloudSubscriptionStanding,
  type IPicGoCloudBillingOverview,
  type IPicGoCloudUsageDimension
} from '#/types/cloud'
import { formatBytes, formatDate, formatDateRange } from '@/utils/format'
import { capitalizePlanCode, getDisplayPlan, getPlanRank, isAbnormalLifecyclePhase } from '@/utils/plan'

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

export type PlanPeriodChainItem = {
  /** 套餐展示名。 */
  plan: string
  /** 是否为当前生效的这一段。 */
  current: boolean
}

export enum PlanPeriodBadgeTone {
  /** 中性色，例如「当前生效」。 */
  Neutral = 'neutral',
  /** 警示色，例如「即将到期」。 */
  Warning = 'warning'
}

export type PlanPeriodBadge = {
  label: string
  tone: PlanPeriodBadgeTone
}

export type PlanPeriodBlock = {
  /** 顶行，例如「Yearly」「限时会员」「订阅 · Pro」；没有可展示的类型时为 null。 */
  primary: string | null
  /** 顶行右侧的小标签，例如「当前生效」「即将到期」；没有时为空数组。 */
  badges: PlanPeriodBadge[]
  /** 日期行，例如「续费日 2027-06-30」「有效期至 2026-10-23（剩余 4 天）」。 */
  secondary: string
  /** 叠加兑换的消耗顺序（当前段在前），例如 Max → Pro → Starter；没有排队时为空数组，具体日期见 tooltip。 */
  chain: PlanPeriodChainItem[]
  /** 限时会员剩余天数 <= PLAN_PERIOD_EXPIRING_SOON_DAYS 时为 true，UI 用警示色渲染。 */
  warning: boolean
}

export type PlanPeriodTimelineItem = {
  /** 当前段为「当前」，排队段为「之后」。 */
  tag: string
  /** 套餐展示名。 */
  plan: string
  /** 当前段为「至 {date}」，排队段为「{start} – {end}」。 */
  range: string
}

export type PlanPeriodTooltip = {
  /** 叠加兑换时间线；没有兑换排队时为空数组。 */
  timeline: PlanPeriodTimelineItem[]
  /** 每个限时会员一条：不自动续费 / 与订阅同时计时的说明。 */
  notes: string[]
}

/** 限时会员剩余天数不超过该值时视为即将到期（与 portal 口径一致）。 */
export const PLAN_PERIOD_EXPIRING_SOON_DAYS = 7

const PLAN_PERIOD_SEPARATOR = ' · '

function joinPlanPeriodParts (...parts: Array<string | null | undefined>): string {
  return parts.filter((part): part is string => Boolean(part)).join(PLAN_PERIOD_SEPARATOR)
}

/** 优先用服务端下发的 standing；旧服务端未下发时按 raw status 推导（与旧版 GUI 判定一致）。 */
function resolveSubscriptionStanding (
  billing: IPicGoCloudBillingOverview | null
): PicGoCloudSubscriptionStanding | null {
  const subscription = billing?.subscription
  if (!subscription) return null
  if (subscription.standing) return subscription.standing
  const status = subscription.status?.toLowerCase() ?? ''
  if (SUBSCRIPTION_ACTIVE_STATUSES.has(status)) return PicGoCloudSubscriptionStanding.Live
  if (status === SUBSCRIPTION_SCHEDULED_CANCEL_STATUS) return PicGoCloudSubscriptionStanding.Ending
  return PicGoCloudSubscriptionStanding.Ended
}

function isSubscriptionRecordLive (standing: PicGoCloudSubscriptionStanding | null): boolean {
  return standing === PicGoCloudSubscriptionStanding.Live || standing === PicGoCloudSubscriptionStanding.Ending
}

/** 订阅续费 / 取消日期文案；只有 live / ending 且有账期终点时才有，避免展示已过期的账期。 */
function resolveSubscriptionDateText (
  billing: IPicGoCloudBillingOverview | null,
  standing: PicGoCloudSubscriptionStanding | null,
  t: TFunction
): string | null {
  const date = formatDate(billing?.subscription?.currentPeriodEnd)
  if (!date) return null
  if (standing === PicGoCloudSubscriptionStanding.Live) return t('PICGO_CLOUD_PLAN_PERIOD_RENEWS', { date })
  if (standing === PicGoCloudSubscriptionStanding.Ending) return t('PICGO_CLOUD_PLAN_PERIOD_CANCELS', { date })
  return null
}

/** 没有限时会员（或处于 grace / frozen）时的单块展示，沿用旧版逻辑。 */
function resolveSingleBlock (
  billing: IPicGoCloudBillingOverview | null,
  standing: PicGoCloudSubscriptionStanding | null,
  t: TFunction
): PlanPeriodBlock | null {
  const phase = billing?.lifecycle?.phase
  const isAbnormal = isAbnormalLifecyclePhase(phase)
  const primary = isAbnormal ? null : (capitalizePlanCode(billing?.plan?.billingPeriod) || null)
  const toBlock = (secondary: string): PlanPeriodBlock => ({ primary, badges: [], secondary, chain: [], warning: false })

  const subscriptionDate = resolveSubscriptionDateText(billing, standing, t)
  if (subscriptionDate) return toBlock(subscriptionDate)
  // 已付款但订阅记录还没写入：订阅已生效，只是续费信息未到，不能显示成「无订阅」
  if (!isAbnormal && !isSubscriptionRecordLive(standing) && billing?.pendingSubscription) {
    return toBlock(t('PICGO_CLOUD_PLAN_PERIOD_SYNCING'))
  }
  const phaseEnd = billing?.lifecycle?.currentPhaseEndsAt ?? null
  const phaseEndDate = formatDate(phaseEnd)
  if (phaseEndDate) {
    // grace/frozen 期 label 已经是「宽限期至 / 冻结期至」，secondary 直接给日期避免双重前缀
    return toBlock(isAbnormal ? phaseEndDate : t('PICGO_CLOUD_PLAN_PERIOD_UNTIL', { date: phaseEndDate }))
  }
  if (phase === 'active' && !phaseEnd && !billing?.subscription?.currentPeriodEnd) {
    return toBlock(t('PICGO_CLOUD_PLAN_PERIOD_LIFETIME'))
  }
  return null
}

function resolveSubscriptionPlanCode (billing: IPicGoCloudBillingOverview | null): string {
  return billing?.pendingSubscription?.plan ?? billing?.plan?.subscription ?? billing?.plan?.paid ?? 'free'
}

/**
 * 「套餐周期」行的展示块。规则与 portal BillingOverviewCard 一致：
 * - 免费 → []（UI 显示占位符）；grace / frozen / 没有限时会员 → 旧版单块展示。
 * - 有限时会员时：订阅仍有效（live / ending 或已付款待同步）才单独展示订阅块，已结束的订阅连同其 billingPeriod 一律不展示；之后每个限时会员一块。
 */
export function resolvePlanPeriodBlocks (
  billing: IPicGoCloudBillingOverview | null,
  t: TFunction
): PlanPeriodBlock[] {
  if (getDisplayPlan(billing?.plan?.paid, billing?.plan?.capability) === 'free') return []

  const standing = resolveSubscriptionStanding(billing)
  const fixedTerms = billing?.fixedTerms ?? []
  if (isAbnormalLifecyclePhase(billing?.lifecycle?.phase) || fixedTerms.length === 0) {
    const block = resolveSingleBlock(billing, standing, t)
    return block ? [block] : []
  }

  const blocks: PlanPeriodBlock[] = []
  // 与 blocks 一一对应的套餐等级，用来标出当前实际生效的那一块
  const ranks: number[] = []
  const pendingSubscription = billing?.pendingSubscription ?? null
  const recordLive = isSubscriptionRecordLive(standing)
  if (recordLive || pendingSubscription) {
    const periodLabel = capitalizePlanCode(billing?.plan?.billingPeriod)
    const dateText = !recordLive ? t('PICGO_CLOUD_PLAN_PERIOD_SYNCING') : resolveSubscriptionDateText(billing, standing, t)
    blocks.push({
      primary: t('PICGO_CLOUD_PLAN_PERIOD_SUBSCRIPTION', { plan: capitalizePlanCode(resolveSubscriptionPlanCode(billing)) }),
      badges: [],
      secondary: joinPlanPeriodParts(periodLabel, dateText) || PLAN_PERIOD_PLACEHOLDER,
      chain: [],
      warning: false
    })
    ranks.push(getPlanRank(resolveSubscriptionPlanCode(billing)))
  }

  const queue = billing?.redemptionQueue ?? []
  for (const term of fixedTerms) {
    const showsQueue = term.source === PicGoCloudFixedTermSource.Redemption && queue.length > 0
    const warning = term.daysRemaining <= PLAN_PERIOD_EXPIRING_SOON_DAYS
    const plan = capitalizePlanCode(term.plan)
    const date = formatDate(term.endsAt) ?? PLAN_PERIOD_PLACEHOLDER
    const days = term.daysRemaining
    blocks.push({
      // 和订阅块的「订阅 · Pro」对称，套餐名放在顶行；有排队时当前套餐已经在下面的链条里加粗显示，顶行不再重复
      primary: joinPlanPeriodParts(t('PICGO_CLOUD_PLAN_PERIOD_FIXED_TERM'), showsQueue ? null : plan),
      badges: warning ? [{ label: t('PICGO_CLOUD_PLAN_PERIOD_EXPIRING_SOON'), tone: PlanPeriodBadgeTone.Warning }] : [],
      secondary: t('PICGO_CLOUD_PLAN_PERIOD_TERM_VALID_UNTIL', { date, days }),
      chain: showsQueue
        ? [{ plan, current: true }, ...queue.map((segment) => ({ plan: capitalizePlanCode(segment.plan), current: false }))]
        : [],
      warning
    })
    ranks.push(getPlanRank(term.plan))
  }
  markBlockInUse(blocks, ranks, t)
  return blocks
}

/**
 * 有多块同时生效时（订阅 + 限时会员，或多种限时会员），给等级最高、也就是用户此刻实际在用的那一块加「当前生效」标签。等级相同时取靠前的一块（订阅在前），与 portal 的口径一致：同档位的限时会员只是与订阅同时消耗，不算在用。
 */
function markBlockInUse (blocks: PlanPeriodBlock[], ranks: number[], t: TFunction): void {
  if (blocks.length < 2) return
  const index = ranks.reduce((best, rank, i) => (rank > ranks[best] ? i : best), 0)
  blocks[index].badges.unshift({ label: t('PICGO_CLOUD_PLAN_PERIOD_IN_USE'), tone: PlanPeriodBadgeTone.Neutral })
}

/** 「套餐周期」行的 tooltip：叠加兑换时间线 + 每个限时会员的续费 / 同时计时说明。没有限时会员或处于 grace / frozen 时为 null。 */
export function resolvePlanPeriodTooltip (
  billing: IPicGoCloudBillingOverview | null,
  t: TFunction
): PlanPeriodTooltip | null {
  if (getDisplayPlan(billing?.plan?.paid, billing?.plan?.capability) === 'free') return null
  if (isAbnormalLifecyclePhase(billing?.lifecycle?.phase)) return null
  const fixedTerms = billing?.fixedTerms ?? []
  if (fixedTerms.length === 0) return null

  const queue = billing?.redemptionQueue ?? []
  const redemption = fixedTerms.find((term) => term.source === PicGoCloudFixedTermSource.Redemption)
  const timeline: PlanPeriodTimelineItem[] = []
  if (redemption && queue.length > 0) {
    timeline.push({
      tag: t('PICGO_CLOUD_PLAN_PERIOD_TIMELINE_CURRENT'),
      plan: capitalizePlanCode(redemption.plan),
      range: t('PICGO_CLOUD_PLAN_PERIOD_TIMELINE_UNTIL', { date: formatDate(queue[0].startsAt) ?? PLAN_PERIOD_PLACEHOLDER })
    })
    for (const segment of queue) {
      timeline.push({
        tag: t('PICGO_CLOUD_PLAN_PERIOD_TIMELINE_THEN'),
        plan: capitalizePlanCode(segment.plan),
        range: formatDateRange(segment.startsAt, segment.endsAt) ?? PLAN_PERIOD_PLACEHOLDER
      })
    }
  }

  const subscriptionLive = isSubscriptionRecordLive(resolveSubscriptionStanding(billing)) || Boolean(billing?.pendingSubscription)
  const subscriptionPlanCode = resolveSubscriptionPlanCode(billing)
  const subscriptionPlan = capitalizePlanCode(subscriptionPlanCode)
  const notes = fixedTerms.map((term) => {
    if (!subscriptionLive) return t('PICGO_CLOUD_PLAN_PERIOD_NO_RENEW')
    const args = { plan: capitalizePlanCode(term.plan), date: formatDate(term.endsAt) ?? PLAN_PERIOD_PLACEHOLDER, subscription: subscriptionPlan }
    return getPlanRank(term.plan) > getPlanRank(subscriptionPlanCode)
      ? t('PICGO_CLOUD_PLAN_PERIOD_CONCURRENT', args)
      : t('PICGO_CLOUD_PLAN_PERIOD_CONCURRENT_WASTED', args)
  })
  return { timeline, notes }
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
