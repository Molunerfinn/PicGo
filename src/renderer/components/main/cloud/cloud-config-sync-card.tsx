import type { ReactNode } from 'react'
import { Clock3Icon, CloudIcon, HelpCircleIcon, LoaderCircleIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { IPicGoCloudEncryptionMethod } from '#/types/cloudConfigSync'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { CloudCardShell } from './cloud-card-shell'

const PlaceholderSyncQuota = '3/3'

function ConfigDetailRow ({
  label,
  labelHelp,
  labelHelpContent,
  value
}: {
  label: string
  labelHelp?: string
  labelHelpContent?: ReactNode
  value: ReactNode
}) {
  return (
    <div className="grid gap-3 md:grid-cols-[164px_minmax(0,1fr)] md:items-center">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <span>{label}</span>
        {labelHelp
          ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground inline-flex size-5 items-center justify-center rounded-sm transition-colors"
                >
                  <HelpCircleIcon className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-80 space-y-2">
                {labelHelpContent ?? labelHelp}
              </TooltipContent>
            </Tooltip>
          )
          : null}
      </div>

      <div className="min-w-0">{value}</div>
    </div>
  )
}

interface CloudConfigSyncCardProps {
  encryptionMethod: IPicGoCloudEncryptionMethod
  isConfigSyncRunning: boolean
  isConfigSyncBusy: boolean
  isEncryptionDisabled: boolean
  lastSyncedAtText: string
  onStartSync: () => Promise<void>
  onEncryptionChange: (value: unknown) => Promise<void>
  onOpenEncryptionDocs: () => void
}

export function CloudConfigSyncCard ({
  encryptionMethod,
  isConfigSyncRunning,
  isConfigSyncBusy,
  isEncryptionDisabled,
  lastSyncedAtText,
  onStartSync,
  onEncryptionChange,
  onOpenEncryptionDocs
}: CloudConfigSyncCardProps) {
  const { t } = useTranslation()

  // TODO(picgo-cloud): Replace the placeholder sync quota with real plan/history quota data.
  return (
    <CloudCardShell className="flex h-full flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
            <CloudIcon className="size-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">
              {t('PICGO_CLOUD_CONFIG_SYNC_TITLE')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('PICGO_CLOUD_CONFIG_SYNC_CARD_DESC')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-transparent bg-emerald-50 text-emerald-700">
            {t('PICGO_CLOUD_CONFIG_SYNC_STATUS_UP_TO_DATE')}
          </Badge>
          <Button
            size="sm"
            disabled={isConfigSyncBusy}
            onClick={async () => {
              await onStartSync()
            }}
          >
            {isConfigSyncRunning
              ? <LoaderCircleIcon className="mr-2 size-4 animate-spin" />
              : null}
            {t('PICGO_CLOUD_SYNC_NOW')}
          </Button>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <ConfigDetailRow
          label={t('PICGO_CLOUD_ENCRYPTION_MODE_LABEL')}
          labelHelp={t('PICGO_CLOUD_ENCRYPTION_MODE_TIP_AUTO')}
          labelHelpContent={
            <>
              <p>{t('PICGO_CLOUD_ENCRYPTION_MODE_TIP_AUTO')}</p>
              <p>{t('PICGO_CLOUD_ENCRYPTION_MODE_TIP_SERVER')}</p>
              <p>{t('PICGO_CLOUD_ENCRYPTION_MODE_TIP_E2E')}</p>
              <button
                type="button"
                onClick={onOpenEncryptionDocs}
                className="text-primary text-sm"
              >
                {t('PICGO_CLOUD_ENCRYPTION_MODE_TIP_DOC')}
              </button>
            </>
          }
          value={
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={encryptionMethod}
                onValueChange={async (value) => {
                  await onEncryptionChange(value)
                }}
                disabled={isEncryptionDisabled}
              >
                <SelectTrigger className="w-full min-w-44 sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={IPicGoCloudEncryptionMethod.AUTO}>
                    {t('PICGO_CLOUD_ENCRYPTION_MODE_AUTO')}
                  </SelectItem>
                  <SelectItem value={IPicGoCloudEncryptionMethod.SSE}>
                    {t('PICGO_CLOUD_ENCRYPTION_MODE_SERVER')}
                  </SelectItem>
                  <SelectItem value={IPicGoCloudEncryptionMethod.E2EE}>
                    {t('PICGO_CLOUD_ENCRYPTION_MODE_E2E')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />

        <Separator />

        <ConfigDetailRow
          label={t('PICGO_CLOUD_LAST_SYNC_LABEL')}
          value={
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Clock3Icon className="size-4" />
              <span>{lastSyncedAtText}</span>
            </div>
          }
        />

        <Separator />

        <ConfigDetailRow
          label={t('PICGO_CLOUD_SYNC_QUOTA_LABEL')}
          labelHelp={t('PICGO_CLOUD_SYNC_QUOTA_TIP')}
          value={
            <div className="text-sm font-medium text-foreground">
              {PlaceholderSyncQuota}
            </div>
          }
        />
      </div>
    </CloudCardShell>
  )
}
