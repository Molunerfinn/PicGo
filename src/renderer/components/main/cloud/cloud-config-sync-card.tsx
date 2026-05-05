import type { ReactNode } from 'react'
import { Clock3Icon, CloudIcon, HelpCircleIcon, LoaderCircleIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  IPicGoCloudConfigSyncSessionStatus,
  IPicGoCloudEncryptionMethod
} from '#/types/cloudConfigSync'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useCloudConfigSyncStateQuery } from '@/queries/picgo-cloud-config-sync'
import { usePicGoCloudUsageQuery } from '@/queries/picgo-cloud-usage'
import { useCloudStore } from '@/store/cloud'
import { CloudCardShell } from './cloud-card-shell'
import { formatCloudSyncTime } from './utils'

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
  onStartSync: () => Promise<void>
  onEncryptionChange: (value: unknown) => Promise<void>
  onOpenEncryptionDocs: () => void
}

export function CloudConfigSyncCard ({
  onStartSync,
  onEncryptionChange,
  onOpenEncryptionDocs
}: CloudConfigSyncCardProps) {
  const { t } = useTranslation()
  const isEncryptionMethodUpdating = useCloudStore.use.isEncryptionMethodUpdating()

  const {
    data: syncState,
    isLoading: isSyncStateLoading,
    isError: isSyncStateError,
    isFetching: isSyncStateFetching,
    refetch: refetchSyncState
  } = useCloudConfigSyncStateQuery()

  const {
    data: usageData,
    isLoading: isUsageLoading,
    isError: isUsageError,
    isFetching: isUsageFetching,
    refetch: refetchUsage
  } = usePicGoCloudUsageQuery()

  const sessionStatus = syncState?.sessionStatus ?? IPicGoCloudConfigSyncSessionStatus.IDLE
  const isConfigSyncRunning = sessionStatus === IPicGoCloudConfigSyncSessionStatus.SYNCING
  const isConfigSyncBusy = sessionStatus !== IPicGoCloudConfigSyncSessionStatus.IDLE
  const isEncryptionDisabled = isConfigSyncBusy || isSyncStateLoading || isEncryptionMethodUpdating

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
          <Button
            size="sm"
            disabled={isConfigSyncBusy || isSyncStateLoading || isSyncStateError}
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

      {isSyncStateError ? (
        <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-border/60 p-4">
          <p className="text-sm text-muted-foreground">
            {t('PICGO_CLOUD_CONFIG_SYNC_LOAD_FAILED')}
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={isSyncStateFetching}
            onClick={() => { refetchSyncState().catch(() => {}) }}
          >
            {isSyncStateFetching
              ? <LoaderCircleIcon className="mr-2 size-4 animate-spin" />
              : null}
            {t('PICGO_CLOUD_RETRY')}
          </Button>
        </div>
      ) : (
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
              isSyncStateLoading
                ? <Skeleton className="h-9 w-full sm:w-44" />
                : (
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={syncState?.encryptionMethod ?? IPicGoCloudEncryptionMethod.AUTO}
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
                )
            }
          />

          <Separator />

          <ConfigDetailRow
            label={t('PICGO_CLOUD_LAST_SYNC_LABEL')}
            value={
              isSyncStateLoading
                ? <Skeleton className="h-4 w-40" />
                : (
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Clock3Icon className="size-4" />
                    <span>
                      {formatCloudSyncTime(
                        syncState?.lastSyncedAt,
                        t('PICGO_CLOUD_LAST_SYNC_TIME_NONE')
                      )}
                    </span>
                  </div>
                )
            }
          />

          <Separator />

          <ConfigDetailRow
            label={t('PICGO_CLOUD_SYNC_QUOTA_LABEL')}
            labelHelp={
              usageData
                ? t('PICGO_CLOUD_SYNC_QUOTA_TIP', {
                  limit: usageData.configHistory.limit
                })
                : undefined
            }
            value={
              <SyncQuotaValue
                isLoading={isUsageLoading}
                isError={isUsageError}
                isFetching={isUsageFetching}
                used={usageData?.configHistory.used}
                limit={usageData?.configHistory.limit}
                onRetry={() => { refetchUsage().catch(() => {}) }}
              />
            }
          />
        </div>
      )}
    </CloudCardShell>
  )
}

function SyncQuotaValue ({
  isLoading,
  isError,
  isFetching,
  used,
  limit,
  onRetry
}: {
  isLoading: boolean
  isError: boolean
  isFetching: boolean
  used: number | undefined
  limit: number | undefined
  onRetry: () => void
}) {
  const { t } = useTranslation()

  if (isLoading) {
    return <Skeleton className="h-4 w-16" />
  }

  if (isError || used === undefined || limit === undefined) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">
          {t('PICGO_CLOUD_USAGE_LOAD_FAILED')}
        </span>
        <Button
          size="xs"
          variant="link"
          className="h-auto px-0 text-xs"
          disabled={isFetching}
          onClick={onRetry}
        >
          {isFetching
            ? <LoaderCircleIcon className="mr-1 size-3 animate-spin" />
            : null}
          {t('PICGO_CLOUD_RETRY')}
        </Button>
      </div>
    )
  }

  return (
    <div className="text-muted-foreground text-sm">
      {t('PICGO_CLOUD_USAGE_PROGRESS', {
        used: used.toLocaleString(),
        total: limit.toLocaleString()
      })}
    </div>
  )
}
