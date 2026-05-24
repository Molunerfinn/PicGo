export enum UserPlanLevel {
  Free = 0,
  Starter = 1,
  Pro = 2,
  Max = 3,
}

export interface IPicGoCloudUserInfo {
  user: string | null
  avatar?: string | null
  plan?: UserPlanLevel
  autoImport?: boolean
}

export type IPicGoCloudUsageDimension = {
  used: number
  limit: number | null
}

export type IPicGoCloudUsagePeriodInfo = {
  used: number
  periodStart: string | null
  periodEnd: string | null
}

export type IPicGoCloudUsageConfigHistory = {
  used: number
  limit: number
  appType: 'gui' | 'cli'
}

export type IPicGoCloudUsage = {
  /** Paid plan code（用于展示）。 */
  plan: string
  /**
   * 当前生效配额对应的 plan code（capabilityPlan）。grace/frozen/pending_cleanup
   * 阶段会降级为 'free'，此时 effectiveQuotaPlan !== plan。
   */
  effectiveQuotaPlan: string
  storage: IPicGoCloudUsageDimension
  mediaCount: IPicGoCloudUsageDimension
  monthlyServes: IPicGoCloudUsagePeriodInfo
  configHistory: IPicGoCloudUsageConfigHistory
}

export type IPicGoCloudBillingPlanInfo = {
  paid: string
  capability: string
  billingPeriod: string | null
  source: 'entitlement' | 'admin_grant' | 'both' | 'free'
}

export type IPicGoCloudLifecyclePhase = 'active' | 'grace' | 'frozen' | 'pending_cleanup'

export type IPicGoCloudLifecycleFlags = {
  customDomainDisabledByLifecycle: boolean
  autoImportDisabledByLifecycle: boolean
}

export type IPicGoCloudLifecycleInfo = {
  phase: IPicGoCloudLifecyclePhase
  daysRemaining: number | null
  graceEndsAt: string | null
  freezeEndsAt: string | null
  /**
   * 当前 lifecycle phase 结束时间。客户端用此字段统一展示套餐到期：
   * - active → max(activeEnt.validUntil, grant.validUntil)；永久 entitlement 为 null
   * - grace → 等同 graceEndsAt
   * - frozen → 等同 freezeEndsAt
   * - pending_cleanup → null
   */
  currentPhaseEndsAt: string | null
  flags: IPicGoCloudLifecycleFlags
}

export type IPicGoCloudSubscriptionInfo = {
  status: string
  currentPeriodEnd: string | null
}

export type IPicGoCloudBillingOverview = {
  plan: IPicGoCloudBillingPlanInfo
  lifecycle: IPicGoCloudLifecycleInfo
  subscription: IPicGoCloudSubscriptionInfo | null
}

export enum IPicGoCloudErrorCode {
  LOGIN_TIMEOUT = 'PICGO_CLOUD_LOGIN_TIMEOUT',
  LOGIN_FAILED = 'PICGO_CLOUD_LOGIN_FAILED'
}
