import type { ReactNode } from 'react'
import { usePicGoCloudUserInfo } from '@/queries/picgo-cloud'
import { UserPlanLevel } from '#/types/cloud'

const PAID_PLAN_LEVELS: UserPlanLevel[] = [
  UserPlanLevel.Starter,
  UserPlanLevel.Pro,
  UserPlanLevel.Max
]

interface PlanGateProps {
  plan: UserPlanLevel | UserPlanLevel[]
  children: ReactNode
  fallback?: ReactNode
}

export function PlanGate ({ plan, children, fallback = null }: PlanGateProps) {
  const { userInfo } = usePicGoCloudUserInfo()
  const currentPlan = userInfo?.plan ?? UserPlanLevel.Free
  const allowed = Array.isArray(plan) ? plan.includes(currentPlan) : currentPlan === plan

  return <>{allowed ? children : fallback}</>
}

type PlanGateSemanticProps = Omit<PlanGateProps, 'plan'>

export function FreePlanOnly ({ children, fallback }: PlanGateSemanticProps) {
  return (
    <PlanGate plan={UserPlanLevel.Free} fallback={fallback}>
      {children}
    </PlanGate>
  )
}

export function PaidPlanOnly ({ children, fallback }: PlanGateSemanticProps) {
  return (
    <PlanGate plan={PAID_PLAN_LEVELS} fallback={fallback}>
      {children}
    </PlanGate>
  )
}
