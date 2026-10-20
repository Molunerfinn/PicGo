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
  /** 订阅来源的 plan code；旧服务端不下发。 */
  subscription?: string
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

/** 服务端由 raw status + 账期终点派生的订阅有效状态，判断续费 / 取消 / 已结束优先看它。 */
export enum PicGoCloudSubscriptionStanding {
  Live = 'live',
  Ending = 'ending',
  Ended = 'ended',
  None = 'none'
}

export type IPicGoCloudSubscriptionInfo = {
  status: string
  /** 旧服务端不下发，此时由客户端按 raw status 推导。 */
  standing?: PicGoCloudSubscriptionStanding
  currentPeriodEnd: string | null
}

export enum PicGoCloudFixedTermSource {
  Redemption = 'redemption',
  Admin = 'admin',
  Purchase = 'purchase'
}

/** 当前生效的一种限时会员来源（兑换 / 赠送 / 买断），不会自动续费，可与订阅同时计时。 */
export type IPicGoCloudFixedTerm = {
  source: PicGoCloudFixedTermSource
  /** 该来源当前生效的 plan code（多段兑换时即当前这一段）。 */
  plan: string
  /** 该来源的结束时间；兑换来源为整条叠加时间线的终点。 */
  endsAt: string
  daysRemaining: number
}

/** 叠加兑换里排在当前这一段之后的一段，按消耗顺序排列；queue[0].startsAt 即当前段的结束时间。 */
export type IPicGoCloudRedemptionSegment = {
  plan: string
  startsAt: string
  endsAt: string
}

export type IPicGoCloudBillingOverview = {
  plan: IPicGoCloudBillingPlanInfo
  lifecycle: IPicGoCloudLifecycleInfo
  subscription: IPicGoCloudSubscriptionInfo | null
  /** 以下字段由新版 PicGo-Core 填充；旧版 Core 不返回，读取时按 [] / null 兜底。 */
  redemptionQueue?: IPicGoCloudRedemptionSegment[]
  fixedTerms?: IPicGoCloudFixedTerm[]
  /** 已付款但订阅记录尚未由 webhook 写入时，该订阅的 plan；否则为 null。 */
  pendingSubscription?: { plan: string } | null
}

export enum IPicGoCloudErrorCode {
  LOGIN_TIMEOUT = 'PICGO_CLOUD_LOGIN_TIMEOUT',
  LOGIN_FAILED = 'PICGO_CLOUD_LOGIN_FAILED'
}
