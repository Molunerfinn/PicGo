import fs from 'node:fs'
import path from 'node:path'
import i18next, { type TFunction } from 'i18next'
import { parse } from 'yaml'
import { beforeAll, describe, expect, it } from 'vitest'
import {
  PicGoCloudFixedTermSource,
  PicGoCloudSubscriptionStanding,
  type IPicGoCloudBillingOverview,
  type IPicGoCloudLifecyclePhase
} from '#/types/cloud'
import {
  PlanPeriodBadgeTone,
  resolvePlanPeriodBlocks,
  resolvePlanPeriodTooltip
} from '@/components/main/cloud/cloud-plan-usage-helpers'

// 用真实的 en.yml + 与渲染进程相同的 `${var}` 插值配置，断言的就是用户最终看到的英文文案
let t: TFunction

beforeAll(async () => {
  const raw = fs.readFileSync(path.resolve(__dirname, '../../../../public/i18n/en.yml'), 'utf8')
  const instance = i18next.createInstance()
  await instance.init({
    resources: { en: { translation: parse(raw) } },
    lng: 'en',
    showSupportNotice: false,
    interpolation: { escapeValue: false, prefix: '${', suffix: '}' }
  })
  t = instance.t
})

// 统一用 UTC 正午，避免本地时区把日期挪到前一天 / 后一天
const day = (date: string) => `${date}T12:00:00.000Z`

type BillingOverrides = {
  paid?: string
  capability?: string
  billingPeriod?: string | null
  subscriptionPlan?: string
  phase?: IPicGoCloudLifecyclePhase
  currentPhaseEndsAt?: string | null
  subscription?: IPicGoCloudBillingOverview['subscription']
  fixedTerms?: IPicGoCloudBillingOverview['fixedTerms']
  redemptionQueue?: IPicGoCloudBillingOverview['redemptionQueue']
  pendingSubscription?: IPicGoCloudBillingOverview['pendingSubscription']
}

function makeBilling (overrides: BillingOverrides = {}): IPicGoCloudBillingOverview {
  const billing: IPicGoCloudBillingOverview = {
    plan: {
      paid: overrides.paid ?? 'pro',
      capability: overrides.capability ?? overrides.paid ?? 'pro',
      billingPeriod: overrides.billingPeriod === undefined ? 'yearly' : overrides.billingPeriod,
      source: 'entitlement',
      ...(overrides.subscriptionPlan ? { subscription: overrides.subscriptionPlan } : {})
    },
    lifecycle: {
      phase: overrides.phase ?? 'active',
      daysRemaining: null,
      graceEndsAt: null,
      freezeEndsAt: null,
      currentPhaseEndsAt: overrides.currentPhaseEndsAt === undefined ? null : overrides.currentPhaseEndsAt,
      flags: { customDomainDisabledByLifecycle: false, autoImportDisabledByLifecycle: false }
    },
    subscription: overrides.subscription === undefined ? null : overrides.subscription
  }
  if (overrides.fixedTerms !== undefined) billing.fixedTerms = overrides.fixedTerms
  if (overrides.redemptionQueue !== undefined) billing.redemptionQueue = overrides.redemptionQueue
  if (overrides.pendingSubscription !== undefined) billing.pendingSubscription = overrides.pendingSubscription
  return billing
}

describe('resolvePlanPeriodBlocks / resolvePlanPeriodTooltip', () => {
  it('free plan → no blocks and no tooltip', () => {
    const billing = makeBilling({ paid: 'free', capability: 'free', billingPeriod: null })
    expect(resolvePlanPeriodBlocks(billing, t)).toEqual([])
    expect(resolvePlanPeriodTooltip(billing, t)).toBeNull()
    expect(resolvePlanPeriodBlocks(null, t)).toEqual([])
  })

  it('plain live subscription keeps the previous single-block output', () => {
    const billing = makeBilling({
      currentPhaseEndsAt: day('2027-06-30'),
      subscription: { status: 'active', standing: PicGoCloudSubscriptionStanding.Live, currentPeriodEnd: day('2027-06-30') },
      fixedTerms: [],
      redemptionQueue: [],
      pendingSubscription: null
    })
    expect(resolvePlanPeriodBlocks(billing, t)).toEqual([
      { primary: 'Yearly', secondary: 'Renews on 2027-06-30', badges: [], chain: [], warning: false }
    ])
    expect(resolvePlanPeriodTooltip(billing, t)).toBeNull()
  })

  it('ending subscription shows the cancel date', () => {
    const billing = makeBilling({
      subscription: { status: 'scheduled_cancel', standing: PicGoCloudSubscriptionStanding.Ending, currentPeriodEnd: day('2027-06-30') },
      fixedTerms: [],
      redemptionQueue: [],
      pendingSubscription: null
    })
    expect(resolvePlanPeriodBlocks(billing, t)[0].secondary).toBe('Cancels on 2027-06-30')
  })

  it('old payload without standing / fixedTerms / queue / pending falls back to raw status', () => {
    const live = makeBilling({ subscription: { status: 'trialing', currentPeriodEnd: day('2027-01-15') } })
    expect(resolvePlanPeriodBlocks(live, t)).toEqual([
      { primary: 'Yearly', secondary: 'Renews on 2027-01-15', badges: [], chain: [], warning: false }
    ])
    expect(resolvePlanPeriodTooltip(live, t)).toBeNull()

    const canceled = makeBilling({
      billingPeriod: 'monthly',
      currentPhaseEndsAt: day('2027-02-01'),
      subscription: { status: 'canceled', currentPeriodEnd: day('2026-09-01') }
    })
    expect(resolvePlanPeriodBlocks(canceled, t)).toEqual([
      { primary: 'Monthly', secondary: 'Valid until 2027-02-01', badges: [], chain: [], warning: false }
    ])

    const lifetime = makeBilling({ billingPeriod: 'lifetime' })
    expect(resolvePlanPeriodBlocks(lifetime, t)).toEqual([
      { primary: 'Lifetime', secondary: 'Lifetime', badges: [], chain: [], warning: false }
    ])
  })

  it('pending subscription without fixed terms says renewal details are syncing', () => {
    const billing = makeBilling({
      billingPeriod: null,
      currentPhaseEndsAt: day('2027-10-19'),
      subscription: null,
      fixedTerms: [],
      redemptionQueue: [],
      pendingSubscription: { plan: 'pro' }
    })
    expect(resolvePlanPeriodBlocks(billing, t)).toEqual([
      { primary: null, secondary: 'Active, renewal details syncing', badges: [], chain: [], warning: false }
    ])
    expect(resolvePlanPeriodTooltip(billing, t)).toBeNull()
  })

  it('stacked redemption with a queue: expiring badge, plan chain and a 3-item timeline', () => {
    const billing = makeBilling({
      paid: 'max',
      billingPeriod: null,
      currentPhaseEndsAt: day('2026-10-23'),
      subscription: null,
      fixedTerms: [{ source: PicGoCloudFixedTermSource.Redemption, plan: 'max', endsAt: day('2026-10-23'), daysRemaining: 4 }],
      redemptionQueue: [
        { plan: 'pro', startsAt: day('2026-10-20'), endsAt: day('2026-10-21') },
        { plan: 'starter', startsAt: day('2026-10-21'), endsAt: day('2026-10-23') }
      ],
      pendingSubscription: null
    })
    expect(resolvePlanPeriodBlocks(billing, t)).toEqual([
      {
        primary: 'Fixed-term membership',
        badges: [{ label: 'Expiring soon', tone: PlanPeriodBadgeTone.Warning }],
        secondary: 'Valid until 2026-10-23 (4 days left)',
        chain: [
          { plan: 'Max', current: true },
          { plan: 'Pro', current: false },
          { plan: 'Starter', current: false }
        ],
        warning: true
      }
    ])
    expect(resolvePlanPeriodTooltip(billing, t)).toEqual({
      timeline: [
        { tag: 'Current', plan: 'Max', range: 'until 2026-10-20' },
        { tag: 'Then', plan: 'Pro', range: '2026-10-20 – 2026-10-21' },
        { tag: 'Then', plan: 'Starter', range: '2026-10-21 – 2026-10-23' }
      ],
      notes: ['Does not renew automatically.']
    })
  })

  it('live subscription + higher redemption: two blocks and the concurrent note', () => {
    const billing = makeBilling({
      paid: 'max',
      subscriptionPlan: 'pro',
      currentPhaseEndsAt: day('2027-06-30'),
      subscription: { status: 'active', standing: PicGoCloudSubscriptionStanding.Live, currentPeriodEnd: day('2027-06-30') },
      fixedTerms: [{ source: PicGoCloudFixedTermSource.Redemption, plan: 'max', endsAt: day('2026-12-31'), daysRemaining: 73 }],
      redemptionQueue: [],
      pendingSubscription: null
    })
    expect(resolvePlanPeriodBlocks(billing, t)).toEqual([
      { primary: 'Subscription · Pro', secondary: 'Yearly · Renews on 2027-06-30', badges: [], chain: [], warning: false },
      {
        primary: 'Fixed-term membership · Max',
        secondary: 'Valid until 2026-12-31 (73 days left)',
        badges: [{ label: 'In use', tone: PlanPeriodBadgeTone.Neutral }],
        chain: [],
        warning: false
      }
    ])
    expect(resolvePlanPeriodTooltip(billing, t)).toEqual({
      timeline: [],
      notes: ["Max is in use until 2026-12-31 and counts down alongside your subscription. After that you're back on Pro."]
    })
  })

  it('live subscription + lower admin grant: the concurrentWasted note', () => {
    const billing = makeBilling({
      paid: 'max',
      subscriptionPlan: 'max',
      subscription: { status: 'active', standing: PicGoCloudSubscriptionStanding.Live, currentPeriodEnd: day('2027-06-30') },
      fixedTerms: [{ source: PicGoCloudFixedTermSource.Admin, plan: 'starter', endsAt: day('2026-12-31'), daysRemaining: 73 }],
      redemptionQueue: [],
      pendingSubscription: null
    })
    // 订阅等级更高：「当前生效」落在订阅那一块
    expect(resolvePlanPeriodBlocks(billing, t).map((block) => [block.primary, block.badges.map((badge) => badge.label)])).toEqual([
      ['Subscription · Max', ['In use']],
      ['Fixed-term membership · Starter', []]
    ])
    expect(resolvePlanPeriodTooltip(billing, t)?.notes).toEqual([
      "You're on Max through your subscription. Starter counts down at the same time until 2026-12-31 and is not saved for later."
    ])
  })

  it('pending subscription + fixed term shows the subscription block as syncing', () => {
    const billing = makeBilling({
      paid: 'max',
      billingPeriod: null,
      subscription: null,
      fixedTerms: [{ source: PicGoCloudFixedTermSource.Purchase, plan: 'max', endsAt: day('2026-12-31'), daysRemaining: 73 }],
      redemptionQueue: [],
      pendingSubscription: { plan: 'starter' }
    })
    expect(resolvePlanPeriodBlocks(billing, t)[0]).toEqual({
      primary: 'Subscription · Starter',
      secondary: 'Active, renewal details syncing',
      badges: [], chain: [],
      warning: false
    })
    expect(resolvePlanPeriodBlocks(billing, t)[1].badges).toEqual([{ label: 'In use', tone: PlanPeriodBadgeTone.Neutral }])
    expect(resolvePlanPeriodTooltip(billing, t)?.notes).toEqual([
      "Max is in use until 2026-12-31 and counts down alongside your subscription. After that you're back on Starter."
    ])
  })

  it('same plan on both: the subscription block is the one in use, an expiring term gets only its warning badge', () => {
    const billing = makeBilling({
      paid: 'pro',
      subscriptionPlan: 'pro',
      subscription: { status: 'active', standing: PicGoCloudSubscriptionStanding.Live, currentPeriodEnd: day('2027-06-30') },
      fixedTerms: [{ source: PicGoCloudFixedTermSource.Redemption, plan: 'pro', endsAt: day('2026-10-22'), daysRemaining: 3 }],
      redemptionQueue: [],
      pendingSubscription: null
    })
    expect(resolvePlanPeriodBlocks(billing, t).map((block) => block.badges)).toEqual([
      [{ label: 'In use', tone: PlanPeriodBadgeTone.Neutral }],
      [{ label: 'Expiring soon', tone: PlanPeriodBadgeTone.Warning }]
    ])
  })

  it('ended subscription + redemption hides the subscription and its billing period', () => {
    const billing = makeBilling({
      paid: 'pro',
      billingPeriod: 'yearly',
      currentPhaseEndsAt: day('2026-11-30'),
      subscription: { status: 'canceled', standing: PicGoCloudSubscriptionStanding.Ended, currentPeriodEnd: day('2026-09-01') },
      fixedTerms: [{ source: PicGoCloudFixedTermSource.Redemption, plan: 'pro', endsAt: day('2026-11-30'), daysRemaining: 42 }],
      redemptionQueue: [],
      pendingSubscription: null
    })
    const blocks = resolvePlanPeriodBlocks(billing, t)
    expect(blocks).toEqual([
      { primary: 'Fixed-term membership · Pro', secondary: 'Valid until 2026-11-30 (42 days left)', badges: [], chain: [], warning: false }
    ])
    expect(JSON.stringify(blocks)).not.toContain('Yearly')
    expect(resolvePlanPeriodTooltip(billing, t)).toEqual({ timeline: [], notes: ['Does not renew automatically.'] })
  })

  it('grace / frozen keep the single bare-date block and never show a tooltip', () => {
    const fixedTerms = [{ source: PicGoCloudFixedTermSource.Redemption, plan: 'pro', endsAt: day('2026-11-30'), daysRemaining: 42 }]
    const grace = makeBilling({
      capability: 'free',
      currentPhaseEndsAt: day('2026-10-26'),
      subscription: { status: 'canceled', standing: PicGoCloudSubscriptionStanding.Ended, currentPeriodEnd: day('2026-10-12') },
      fixedTerms,
      redemptionQueue: [],
      pendingSubscription: null,
      phase: 'grace'
    })
    expect(resolvePlanPeriodBlocks(grace, t)).toEqual([
      { primary: null, secondary: '2026-10-26', badges: [], chain: [], warning: false }
    ])
    expect(resolvePlanPeriodTooltip(grace, t)).toBeNull()

    const frozen = makeBilling({ capability: 'free', currentPhaseEndsAt: day('2026-11-09'), phase: 'frozen', fixedTerms })
    expect(resolvePlanPeriodBlocks(frozen, t)).toEqual([
      { primary: null, secondary: '2026-11-09', badges: [], chain: [], warning: false }
    ])
    expect(resolvePlanPeriodTooltip(frozen, t)).toBeNull()
  })
})
