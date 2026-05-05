import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { usePicGoCloudUserInfo } from '@/queries/picgo-cloud'
import { resolvePlanLabel } from '@/utils/plan'
import { UserPlanLevel } from '#/types/cloud'

interface PlanBadgeProps {
  className?: string
}

export function PlanBadge ({ className }: PlanBadgeProps) {
  const { userInfo, isPaid } = usePicGoCloudUserInfo()
  const plan = userInfo?.plan ?? UserPlanLevel.Free

  return (
    <Badge
      variant={isPaid ? 'default' : 'secondary'}
      className={cn(
        isPaid && 'border-transparent bg-emerald-500 text-white',
        className
      )}
    >
      {resolvePlanLabel(plan)}
    </Badge>
  )
}
