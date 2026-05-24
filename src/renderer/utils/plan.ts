import { UserPlanLevel } from '#/types/cloud'

export function resolvePlanLabel (plan: UserPlanLevel | undefined): string {
  switch (plan) {
    case UserPlanLevel.Starter: return 'Starter Plan'
    case UserPlanLevel.Pro: return 'Pro Plan'
    case UserPlanLevel.Max: return 'Max Plan'
    default: return 'Free Plan'
  }
}

/** plan code → rank (free=0 < starter=1 < pro=2 < max=3)。未知 plan 视为 free。 */
const PLAN_RANK: Record<string, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  max: 3
}

export function getPlanRank (planCode: string | null | undefined): number {
  if (!planCode) return 0
  return PLAN_RANK[planCode.toLowerCase()] ?? 0
}

/**
 * 当前生效配额相对付费 plan 是否被降级（grace/frozen/pending_cleanup 时为 true）。
 * 用于决定是否在 CloudPlanUsageCard 数字旁显示"配额降级"ⓘ 提示。
 */
export function isQuotaDowngraded (
  paidPlan: string | null | undefined,
  effectiveQuotaPlan: string | null | undefined
): boolean {
  return getPlanRank(effectiveQuotaPlan) < getPlanRank(paidPlan)
}

/**
 * displayPlan = max(paidPlan, capabilityPlan) by rank。跟 picgo-hub whoami
 * 的 plan number 派生口径一致：
 * - admin grant only：paid=free, capability=pro -> pro
 * - grace 期：paid=starter, capability=free -> starter（保留付费身份）
 * - 普通付费：paid===capability -> 不变
 */
export function getDisplayPlan (
  paid: string | null | undefined,
  capability: string | null | undefined
): string {
  return getPlanRank(paid) >= getPlanRank(capability) ? (paid ?? 'free') : (capability ?? 'free')
}

/** 套餐 code 首字母大写，例：'starter' → 'Starter'，未知返回空串。 */
export function capitalizePlanCode (planCode: string | null | undefined): string {
  if (!planCode) return ''
  return planCode.charAt(0).toUpperCase() + planCode.slice(1).toLowerCase()
}
