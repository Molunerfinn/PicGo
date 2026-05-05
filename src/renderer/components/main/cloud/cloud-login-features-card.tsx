import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { HardDriveUploadIcon, ImageIcon, RefreshCwIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Separator } from '@/components/ui/separator'
import { CloudCardShell } from './cloud-card-shell'

function LoginFeatureItem ({
  icon,
  title,
  description,
  badge
}: {
  icon: ReactNode
  title: string
  description: string
  badge?: string
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
        {icon}
      </div>

      <div className="min-w-0 space-y-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate text-base font-semibold text-foreground">
            {title}
          </h3>
          {badge
            ? (
              <Badge
                variant="secondary"
                className="h-5 bg-amber-50 px-2 text-[11px] text-amber-700"
              >
                {badge}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}

export function CloudLoginFeaturesCard () {
  const { t } = useTranslation()

  return (
    <CloudCardShell className="flex h-full flex-col gap-4 px-5 py-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {t('PICGO_CLOUD_LOGIN_FEATURES_TITLE')}
        </h2>
      </div>

      <Separator />

      <div className="space-y-4">
        <LoginFeatureItem
          icon={<ImageIcon className="size-5" />}
          title={t('PICGO_CLOUD_OFFICIAL_IMAGE_HOST_TITLE')}
          description={t('PICGO_CLOUD_OFFICIAL_IMAGE_HOST_DESC')}
        />

        <Separator />

        <LoginFeatureItem
          icon={<RefreshCwIcon className="size-5" />}
          title={t('PICGO_CLOUD_CONFIG_SYNC_TITLE')}
          description={t('PICGO_CLOUD_CONFIG_SYNC_CARD_DESC')}
        />

        <Separator />

        <LoginFeatureItem
          icon={<HardDriveUploadIcon className="size-5" />}
          title={t('PICGO_CLOUD_AUTO_IMPORT_LABEL')}
          description={t('PICGO_CLOUD_AUTO_IMPORT_DESC')}
          badge={t('PICGO_CLOUD_PAID_PLAN_BADGE')}
        />
      </div>
    </CloudCardShell>
  )
}
