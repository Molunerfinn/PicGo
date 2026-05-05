import type { IPicGoCloudUserInfo } from '#/types/cloud'
import { ExternalLinkIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { resolvePlanLabel } from '@/utils/plan'

interface CloudAccountSummaryProps {
  userInfo: IPicGoCloudUserInfo
  isPaidUser: boolean
  onOpenCloud: () => void
  onLogout: () => void
}

export function CloudAccountSummary ({
  userInfo,
  isPaidUser,
  onOpenCloud,
  onLogout
}: CloudAccountSummaryProps) {
  const { t } = useTranslation()
  const userName = userInfo.user ?? '-'
  const fallbackText = userName.slice(0, 1).toUpperCase()

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-4">
        <Avatar className="size-12 border border-border/60">
          {userInfo.avatar
            ? <AvatarImage src={userInfo.avatar} alt={userName} />
            : null}
          <AvatarFallback>{fallbackText}</AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="truncate text-[28px] leading-none font-semibold tracking-tight text-foreground">
            {userName}
          </div>
          <Badge
            variant={isPaidUser ? 'default' : 'secondary'}
            className={isPaidUser ? 'border-transparent bg-emerald-500 text-white' : undefined}
          >
            {resolvePlanLabel(userInfo.plan)}
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={onOpenCloud}>
          <ExternalLinkIcon className="mr-2 size-4" />
          {t('PICGO_CLOUD_OPEN')}
        </Button>
        <Button variant="destructive" onClick={onLogout}>
          {t('PICGO_CLOUD_LOGOUT')}
        </Button>
      </div>
    </div>
  )
}
