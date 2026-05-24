import { AlertTriangleIcon, CrownIcon, HardDriveUploadIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { usePicGoCloudBillingQuery } from '@/queries/picgo-cloud-billing'
import { CloudCardShell } from './cloud-card-shell'

interface CloudAutoImportCardProps {
  checked: boolean
  disabled: boolean
  isPaidUser: boolean
  onCheckedChange: (checked: boolean) => Promise<void>
}

export function CloudAutoImportCard ({
  checked,
  disabled,
  isPaidUser,
  onCheckedChange
}: CloudAutoImportCardProps) {
  const { t } = useTranslation()
  const { data: billing } = usePicGoCloudBillingQuery()
  const disabledByLifecycle = billing?.lifecycle?.flags?.autoImportDisabledByLifecycle ?? false
  const switchDisabled = disabled || disabledByLifecycle

  return (
    <CloudCardShell className="flex items-center justify-between gap-4 p-5">
      <div className="flex min-w-0 items-start gap-4">
        <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
          <HardDriveUploadIcon className="size-5" />
        </div>

        <div className="min-w-0 space-y-1">
          <div className="flex min-w-0 items-center gap-1.5 text-base font-semibold text-foreground">
            <span className="truncate">{t('PICGO_CLOUD_AUTO_IMPORT_LABEL')}</span>
            {!isPaidUser
              ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex cursor-help">
                      <CrownIcon className="size-4 text-amber-500" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('ALBUM_CLOUD_UPGRADE_DESC')}</p>
                  </TooltipContent>
                </Tooltip>
              )
              : disabledByLifecycle
                ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex cursor-help">
                        <AlertTriangleIcon className="size-4 text-yellow-600 dark:text-yellow-500" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-72">
                      <p>{t('PICGO_CLOUD_AUTO_IMPORT_DISABLED_BY_LIFECYCLE')}</p>
                    </TooltipContent>
                  </Tooltip>
                )
                : null}
          </div>

          <p className="text-sm text-muted-foreground">
            {t('PICGO_CLOUD_AUTO_IMPORT_DESC')}
          </p>
        </div>
      </div>

      <Switch
        checked={checked && !disabledByLifecycle}
        onCheckedChange={async (nextChecked) => {
          await onCheckedChange(nextChecked)
        }}
        disabled={switchDisabled}
      />
    </CloudCardShell>
  )
}
