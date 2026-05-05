import { UserPlanLevel } from '#/types/cloud'

export function resolvePlanLabel (plan: UserPlanLevel | undefined): string {
  switch (plan) {
    case UserPlanLevel.Starter: return 'Starter Plan'
    case UserPlanLevel.Pro: return 'Pro Plan'
    case UserPlanLevel.Max: return 'Max Plan'
    default: return 'Free Plan'
  }
}
