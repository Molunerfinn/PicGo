import { CrownIcon, HardDriveUploadIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
              : null}
          </div>

          <p className="text-sm text-muted-foreground">
            {t('PICGO_CLOUD_AUTO_IMPORT_DESC')}
          </p>
        </div>
      </div>

      <Switch
        checked={checked}
        onCheckedChange={async (nextChecked) => {
          await onCheckedChange(nextChecked)
        }}
        disabled={disabled}
      />
    </CloudCardShell>
  )
}
