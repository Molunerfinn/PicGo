import { useState } from 'react'
import { AlertTriangleIcon, ShieldAlertIcon, XIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type {
  IPicGoCloudLifecycleInfo,
  IPicGoCloudLifecyclePhase
} from '#/types/cloud'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { cloudAdapter } from '@/adapters/cloud'
import { usePicGoCloudBillingQuery } from '@/queries/picgo-cloud-billing'
import { PICGO_GUI_LIFECYCLE_BANNER_DISMISSED_PHASE_KEY } from '@/utils/consts'

type LifecycleBannerVariant = 'inline' | 'floating'

interface LifecycleBannerProps {
  variant: LifecycleBannerVariant
}

const VISIBLE_PHASES: ReadonlyArray<IPicGoCloudLifecyclePhase> = ['grace', 'frozen', 'pending_cleanup']

function isVisiblePhase (phase: IPicGoCloudLifecyclePhase | undefined): phase is IPicGoCloudLifecyclePhase {
  return phase !== undefined && (VISIBLE_PHASES as ReadonlyArray<string>).includes(phase)
}

function resolveBannerCopy (phase: IPicGoCloudLifecyclePhase): {
  titleKey: ILocalesKey
  descKey: ILocalesKey
} {
  switch (phase) {
    case 'grace':
      return {
        titleKey: 'PICGO_CLOUD_LIFECYCLE_BANNER_GRACE_TITLE',
        descKey: 'PICGO_CLOUD_LIFECYCLE_BANNER_GRACE_DESC'
      }
    case 'frozen':
      return {
        titleKey: 'PICGO_CLOUD_LIFECYCLE_BANNER_FROZEN_TITLE',
        descKey: 'PICGO_CLOUD_LIFECYCLE_BANNER_FROZEN_DESC'
      }
    case 'pending_cleanup':
      return {
        titleKey: 'PICGO_CLOUD_LIFECYCLE_BANNER_PENDING_CLEANUP_TITLE',
        descKey: 'PICGO_CLOUD_LIFECYCLE_BANNER_PENDING_CLEANUP_DESC'
      }
    default:
      return {
        titleKey: 'PICGO_CLOUD_LIFECYCLE_BANNER_GRACE_TITLE',
        descKey: 'PICGO_CLOUD_LIFECYCLE_BANNER_GRACE_DESC'
      }
  }
}

const PHASE_TONE: Record<IPicGoCloudLifecyclePhase, {
  container: string
  icon: string
  Icon: typeof AlertTriangleIcon
  button: string
}> = {
  active: {
    container: '',
    icon: '',
    Icon: AlertTriangleIcon,
    button: ''
  },
  grace: {
    container: 'border-yellow-500/40 bg-yellow-50 text-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-200',
    icon: 'text-yellow-600 dark:text-yellow-400',
    Icon: AlertTriangleIcon,
    button: 'bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-500 dark:text-white dark:hover:bg-orange-600'
  },
  frozen: {
    container: 'border-red-500/40 bg-red-50 text-red-900 dark:bg-red-950/30 dark:text-red-200',
    icon: 'text-red-600 dark:text-red-400',
    Icon: ShieldAlertIcon,
    button: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700'
  },
  pending_cleanup: {
    container: 'border-red-600/50 bg-red-100 text-red-950 dark:bg-red-950/40 dark:text-red-100',
    icon: 'text-red-700 dark:text-red-300',
    Icon: ShieldAlertIcon,
    button: 'bg-red-700 text-white hover:bg-red-800 dark:bg-red-700 dark:text-white dark:hover:bg-red-800'
  }
}

export function LifecycleBanner ({ variant }: LifecycleBannerProps) {
  const { data: billing } = usePicGoCloudBillingQuery()
  const lifecycle: IPicGoCloudLifecycleInfo | undefined = billing?.lifecycle
  const phase = lifecycle?.phase

  const [dismissedPhase, setDismissedPhase] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      return window.localStorage.getItem(PICGO_GUI_LIFECYCLE_BANNER_DISMISSED_PHASE_KEY)
    } catch {
      return null
    }
  })

  if (!isVisiblePhase(phase)) return null
  if (variant === 'floating' && dismissedPhase === phase) return null

  const { titleKey, descKey } = resolveBannerCopy(phase)
  const tone = PHASE_TONE[phase]
  const days = lifecycle?.daysRemaining ?? 0

  const handleRenew = () => {
    cloudAdapter.openPricing()
  }

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(PICGO_GUI_LIFECYCLE_BANNER_DISMISSED_PHASE_KEY, phase)
    } catch {
      // ignore storage failure
    }
    setDismissedPhase(phase)
  }

  return (
    <LifecycleBannerView
      variant={variant}
      phase={phase}
      days={days}
      tone={tone}
      titleKey={titleKey}
      descKey={descKey}
      onRenew={handleRenew}
      onDismiss={handleDismiss}
    />
  )
}

interface LifecycleBannerViewProps {
  variant: LifecycleBannerVariant
  phase: IPicGoCloudLifecyclePhase
  days: number
  tone: typeof PHASE_TONE[IPicGoCloudLifecyclePhase]
  titleKey: ILocalesKey
  descKey: ILocalesKey
  onRenew: () => void
  onDismiss: () => void
}

function LifecycleBannerView ({
  variant,
  days,
  tone,
  titleKey,
  descKey,
  onRenew,
  onDismiss
}: LifecycleBannerViewProps) {
  const { t } = useTranslation()
  const Icon = tone.Icon

  const containerClass = variant === 'floating'
    ? cn(
      'fixed bottom-6 right-6 z-50 w-[22rem] max-w-[calc(100vw-3rem)] rounded-lg border shadow-lg',
      tone.container
    )
    : cn('w-full rounded-lg border', tone.container)

  // floating 因宽度受限保持原上下布局；inline 走左右一行（按钮垂直居中右对齐）
  if (variant === 'floating') {
    return (
      <div className={containerClass}>
        <div className="flex items-start gap-3 p-4">
          <Icon className={cn('mt-0.5 size-5 shrink-0', tone.icon)} />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold">{t(titleKey)}</p>
              <button
                type="button"
                onClick={onDismiss}
                aria-label={t('PICGO_CLOUD_LIFECYCLE_BANNER_DISMISS')}
                className="text-current/60 hover:text-current -mr-1 -mt-1 inline-flex size-6 shrink-0 items-center justify-center rounded-md transition-colors"
              >
                <XIcon className="size-4" />
              </button>
            </div>
            <p className="text-sm leading-relaxed">{t(descKey, { days: String(days) })}</p>
            <div className="flex justify-end">
              <Button size="sm" onClick={onRenew} className={tone.button}>
                {t('PICGO_CLOUD_LIFECYCLE_BANNER_CTA')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={containerClass}>
      <div className="flex items-center gap-3 p-4">
        <Icon className={cn('size-5 shrink-0', tone.icon)} />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-semibold">{t(titleKey)}</p>
          <p className="text-sm leading-relaxed">{t(descKey, { days: String(days) })}</p>
        </div>
        <Button size="sm" onClick={onRenew} className={cn('shrink-0', tone.button)}>
          {t('PICGO_CLOUD_LIFECYCLE_BANNER_CTA')}
        </Button>
      </div>
    </div>
  )
}
