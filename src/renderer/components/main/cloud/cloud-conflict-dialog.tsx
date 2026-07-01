import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  CloudIcon,
  LaptopIcon,
  RefreshCcwIcon,
  TriangleAlertIcon
} from 'lucide-react'
import {
  IPicGoCloudConfigSyncConflictChoice,
  type IPicGoCloudConfigSyncResolution
} from '#/types/cloudConfigSync'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useCloudConfigSyncStateQuery } from '@/queries/picgo-cloud-config-sync'
import { cloudStoreActions, useCloudStore } from '@/store/cloud'

function stringifyValue (value: unknown) {
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function CloudConflictDialog ({
  onAbort,
  onConfirm
}: {
  onAbort: (resolution?: IPicGoCloudConfigSyncResolution) => Promise<void> | void
  onConfirm: (resolution: IPicGoCloudConfigSyncResolution) => Promise<void> | void
}) {
  const { t } = useTranslation()
  const open = useCloudStore.use.isConflictDialogOpen()
  const { data: syncState } = useCloudConfigSyncStateQuery()
  const conflicts = syncState?.conflicts ?? []
  const confirmLoading = useCloudStore.use.isApplyResolutionLoading()
  const [selections, setSelections] = useState<IPicGoCloudConfigSyncResolution>({})

  const remainingCount = conflicts.filter((item) => !selections[item.path]).length

  const isConfirmDisabled = remainingCount > 0 || conflicts.length === 0

  const resetSelections = () => {
    setSelections({})
  }

  const setChoice = (
    path: string,
    choice: IPicGoCloudConfigSyncConflictChoice
  ) => {
    setSelections((current) => ({
      ...current,
      [path]: choice
    }))
  }

  const chooseAll = (choice: IPicGoCloudConfigSyncConflictChoice) => {
    setSelections(
      conflicts.reduce<IPicGoCloudConfigSyncResolution>((result, item) => {
        result[item.path] = choice
        return result
      }, {})
    )
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (confirmLoading) return
    if (!nextOpen) return
    cloudStoreActions.setIsConflictDialogOpen(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="top-8"
        className="flex h-[min(80vh,720px)] min-h-[min(400px,calc(100vh-2rem))] w-[min(90vw,72rem)] min-w-[min(700px,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)] flex-col gap-0 p-0"
      >
        <DialogHeader className="border-b px-6 pt-6 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <TriangleAlertIcon className="text-amber-500" size={20} />
                {t('PICGO_CLOUD_CONFIG_SYNC_CONFLICT_TITLE', {
                  count: conflicts.length
                })}
              </DialogTitle>
              <DialogDescription>
                {t('PICGO_CLOUD_CONFIG_SYNC_CONFLICT_DETECTED')}
              </DialogDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetSelections}>
                <RefreshCcwIcon className="mr-2 size-4" />
                {t('PICGO_CLOUD_CONFIG_SYNC_RESET_ALL')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => chooseAll(IPicGoCloudConfigSyncConflictChoice.LOCAL)}
              >
                {t('PICGO_CLOUD_CONFIG_SYNC_CHOOSE_ALL_LOCAL')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => chooseAll(IPicGoCloudConfigSyncConflictChoice.CLOUD)}
              >
                {t('PICGO_CLOUD_CONFIG_SYNC_CHOOSE_ALL_CLOUD')}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1 px-6 py-5">
          <div className="space-y-4">
            {conflicts.map((item) => {
              const currentChoice = selections[item.path]

              return (
                <div key={item.path} className="overflow-hidden rounded-xl border bg-card">
                  <div className="bg-muted/50 flex items-center justify-between gap-3 border-b px-4 py-3">
                    <code className="text-muted-foreground text-xs break-all">
                      {item.path}
                    </code>
                    {currentChoice ? (
                      <div className="text-primary flex items-center gap-1 text-xs font-medium">
                        <CheckIcon className="size-4" />
                        {currentChoice === IPicGoCloudConfigSyncConflictChoice.LOCAL
                          ? t('PICGO_CLOUD_CONFIG_SYNC_LOCAL_VERSION')
                          : t('PICGO_CLOUD_CONFIG_SYNC_CLOUD_VERSION')}
                      </div>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-3 p-4">
                    <button
                      type="button"
                      onClick={() => setChoice(item.path, IPicGoCloudConfigSyncConflictChoice.LOCAL)}
                      className={cn(
                        'min-w-0 rounded-lg border p-4 text-left transition-colors',
                        currentChoice === IPicGoCloudConfigSyncConflictChoice.LOCAL
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/40'
                      )}
                    >
                      <div className="mb-3 flex items-center gap-2 font-medium">
                        <LaptopIcon className="size-4" />
                        {t('PICGO_CLOUD_CONFIG_SYNC_LOCAL_VERSION')}
                      </div>
                      <pre className="text-sm whitespace-pre-wrap break-words">
                        {stringifyValue(item.localValue)}
                      </pre>
                    </button>

                    <div className="text-muted-foreground flex items-center justify-center">
                      {currentChoice === IPicGoCloudConfigSyncConflictChoice.LOCAL ? (
                        <ArrowLeftIcon className="size-5" />
                      ) : currentChoice === IPicGoCloudConfigSyncConflictChoice.CLOUD ? (
                        <ArrowRightIcon className="size-5" />
                      ) : (
                        <div className="bg-border h-10 w-px" />
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setChoice(item.path, IPicGoCloudConfigSyncConflictChoice.CLOUD)}
                      className={cn(
                        'min-w-0 rounded-lg border p-4 text-left transition-colors',
                        currentChoice === IPicGoCloudConfigSyncConflictChoice.CLOUD
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/40'
                      )}
                    >
                      <div className="mb-3 flex items-center gap-2 font-medium">
                        <CloudIcon className="size-4" />
                        {t('PICGO_CLOUD_CONFIG_SYNC_CLOUD_VERSION')}
                      </div>
                      <pre className="text-sm whitespace-pre-wrap break-words">
                        {stringifyValue(item.remoteValue)}
                      </pre>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="items-center border-t px-6 py-4 sm:justify-between">
          <div className="text-muted-foreground text-sm">
            {remainingCount > 0
              ? t('PICGO_CLOUD_CONFIG_SYNC_CONFLICT_PENDING')
              : t('PICGO_CLOUD_CONFIG_SYNC_CONFLICT_RESOLVED')}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled={confirmLoading} onClick={() => onAbort()}>
              {t('PICGO_CLOUD_CONFIG_SYNC_ABORT')}
            </Button>
            <Button
              disabled={isConfirmDisabled || confirmLoading}
              onClick={() => onConfirm(selections)}
            >
              {t('PICGO_CLOUD_CONFIG_SYNC_CONFIRM_AND_SYNC')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
