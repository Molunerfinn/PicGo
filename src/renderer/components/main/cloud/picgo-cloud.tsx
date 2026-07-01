import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CircleAlertIcon,
  LoaderCircleIcon
} from 'lucide-react'
import {
  IPicGoCloudConfigSyncSessionStatus,
  IPicGoCloudEncryptionMethod,
  IPicGoCloudConfigSyncToastType,
  type IPicGoCloudConfigSyncResolution,
  type IPicGoCloudConfigSyncRunResult,
  type IPicGoCloudConfigSyncState
} from '#/types/cloudConfigSync'
import { AppMainCard } from '@/components/common/app-main-card'
import { MainCardHeader } from '@/components/common/main-card-header'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { cloudAdapter } from '@/adapters/cloud'
import { cloudAlbumAdapter } from '@/adapters/cloud-album'
import {
  appActions,
  PicGoCloudLoginStatusValues,
  useAppStore
} from '@/store'
import { cloudStoreActions, useCloudStore } from '@/store/cloud'
import {
  setPicGoCloudUserInfoQueryData,
  usePicGoCloudUserInfo
} from '@/queries/picgo-cloud'
import {
  setCloudConfigSyncStateQueryData,
  updateCloudConfigSyncStateQueryData,
  useCloudConfigSyncStateQuery
} from '@/queries/picgo-cloud-config-sync'
import { usePicGoCloudBillingQuery } from '@/queries/picgo-cloud-billing'
import { invalidatePicGoCloudUsageQuery } from '@/queries/picgo-cloud-usage'
import { resolveCloudErrorMessage } from '@/utils/cloud-error'
import { CloudConflictDialog } from './cloud-conflict-dialog'
import { CloudAccountSummary } from './cloud-account-summary'
import { CloudAutoImportCard } from './cloud-auto-import-card'
import { CloudConfigSyncCard } from './cloud-config-sync-card'
import { LifecycleBanner } from './lifecycle-banner'
import { CloudFreePlanBanner } from './cloud-free-plan-banner'
import { CloudLoginFeaturesCard } from './cloud-login-features-card'
import { CloudLoginHeroCard } from './cloud-login-hero-card'
import { CloudPlanUsageCard } from './cloud-plan-usage-card'
import { cn } from '@/lib/utils'

function showConfigSyncToast (
  toastType: IPicGoCloudConfigSyncToastType,
  message: string
) {
  if (toastType === IPicGoCloudConfigSyncToastType.SUCCESS) {
    toast.success(message)
    return
  }

  if (toastType === IPicGoCloudConfigSyncToastType.WARNING) {
    toast.warning(message)
    return
  }

  if (toastType === IPicGoCloudConfigSyncToastType.ERROR) {
    toast.error(message)
    return
  }

  toast(message)
}

const IDLE_STATE: IPicGoCloudConfigSyncState = {
  sessionStatus: IPicGoCloudConfigSyncSessionStatus.IDLE
}

export function PicGoCloud () {
  const { t } = useTranslation()
  const {
    userInfo,
    isPaid: isPaidUser,
    isLoading: isUserInfoLoading,
    error: userInfoError
  } = usePicGoCloudUserInfo()
  const { data: billing } = usePicGoCloudBillingQuery()
  const billingPhase = billing?.lifecycle?.phase
  const loginStatus = useAppStore.use.picgoCloud().loginStatus
  const loginError = useAppStore.use.picgoCloud().loginError
  const hasAgreedToTermsAndPrivacy = useAppStore.use.picgoCloud().hasAgreedToTermsAndPrivacy
  const [isAutoImportUpdating, setIsAutoImportUpdating] = useState(false)
  const isEnableE2EConfirmOpen = useCloudStore.use.isEnableE2EConfirmOpen()
  const isRestartPromptOpen = useCloudStore.use.isRestartPromptOpen()
  const isEncryptionMethodUpdating = useCloudStore.use.isEncryptionMethodUpdating()

  const { data: syncStateData } = useCloudConfigSyncStateQuery()
  const configSyncState = syncStateData ?? IDLE_STATE

  const isLoginInProgress = loginStatus === PicGoCloudLoginStatusValues.InProgress
  const isConfigSyncBusy =
    configSyncState.sessionStatus !== IPicGoCloudConfigSyncSessionStatus.IDLE
  const isAutoImportEnabled = isPaidUser && userInfo?.autoImport === true

  // sessionStatus 切到 CONFLICT 时自动开冲突 dialog；切走时关掉。
  // 把原来 cloudStoreActions.applyConfigSyncState 里的联动迁移过来。
  useEffect(() => {
    cloudStoreActions.setIsConflictDialogOpen(
      configSyncState.sessionStatus === IPicGoCloudConfigSyncSessionStatus.CONFLICT
    )
  }, [configSyncState.sessionStatus])

  async function refreshAppStateAfterSync () {
    await appActions.refreshAppConfig()
    await appActions.refreshPicBeds()
  }

  async function handleConfigSyncResult (runResult: IPicGoCloudConfigSyncRunResult) {
    setCloudConfigSyncStateQueryData(runResult.state)
    showConfigSyncToast(runResult.toastType, runResult.message)

    if (runResult.authInvalidated) {
      setPicGoCloudUserInfoQueryData(null)
      return
    }

    // 同步成功后 server 端可能修剪了 history，主动刷新 usage（不阻塞 toast / 后续）
    invalidatePicGoCloudUsageQuery().catch((error) => {
      console.warn('Failed to invalidate usage query after sync', error)
    })

    if (runResult.shouldShowRestartPrompt) {
      await refreshAppStateAfterSync()
      cloudStoreActions.setIsRestartPromptOpen(true)
    }
  }

  async function handleLogin () {
    appActions.setPicGoCloudLoginStatus(PicGoCloudLoginStatusValues.InProgress)
    appActions.setPicGoCloudLoginError(null)

    const result = await cloudAdapter.login()

    appActions.setPicGoCloudLoginStatus(PicGoCloudLoginStatusValues.Idle)

    if (!result.success) {
      appActions.setPicGoCloudLoginError(result.error)
      toast.error(result.error)
      return
    }

    setPicGoCloudUserInfoQueryData(result.data)
    appActions.setPicGoCloudLoginError(null)
  }

  async function handleDisposeLoginFlow () {
    const result = await cloudAdapter.disposeLoginFlow()
    appActions.setPicGoCloudLoginStatus(PicGoCloudLoginStatusValues.Idle)

    if (!result.success) {
      toast.error(result.error)
    }
  }

  async function handleLogout () {
    const result = await cloudAdapter.logout()
    if (!result.success) {
      toast.error(result.error)
      return
    }

    setPicGoCloudUserInfoQueryData(null)
  }

  async function handleStartSync () {
    if (isConfigSyncBusy) return

    updateCloudConfigSyncStateQueryData((prev) => ({
      ...(prev ?? IDLE_STATE),
      sessionStatus: IPicGoCloudConfigSyncSessionStatus.SYNCING,
      conflicts: undefined
    }))
    toast(t('PICGO_CLOUD_CONFIG_SYNC_STARTING'))

    const result = await cloudAdapter.startConfigSync()
    if (!result.success) {
      toast.error(result.error)
      // 失败时把 sessionStatus 复位到 IDLE，让用户能再次点击同步
      updateCloudConfigSyncStateQueryData((prev) => ({
        ...(prev ?? IDLE_STATE),
        sessionStatus: IPicGoCloudConfigSyncSessionStatus.IDLE,
        conflicts: undefined
      }))
      return
    }

    await handleConfigSyncResult(result.data)
  }

  async function handleAbortSync () {
    const result = await cloudAdapter.abortConfigSync()
    if (!result.success) {
      toast.error(result.error)
      return
    }

    setCloudConfigSyncStateQueryData(result.data)
    cloudStoreActions.setIsConflictDialogOpen(false)
    toast.warning(t('PICGO_CLOUD_CONFIG_SYNC_ABORTED'))
  }

  async function handleConfirmSyncResolution (resolution: IPicGoCloudConfigSyncResolution) {
    cloudStoreActions.setIsApplyResolutionLoading(true)
    const result = await cloudAdapter.applyConfigSyncResolution(resolution)
    cloudStoreActions.setIsApplyResolutionLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    await handleConfigSyncResult(result.data)
    if (!result.data.authInvalidated && result.data.shouldShowRestartPrompt) {
      cloudStoreActions.setIsConflictDialogOpen(false)
    }
  }

  async function persistEncryptionMethod (mode: IPicGoCloudEncryptionMethod) {
    cloudStoreActions.setIsEncryptionMethodUpdating(true)
    const result = await cloudAdapter.setEncryptionMethod(mode)
    cloudStoreActions.setIsEncryptionMethodUpdating(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    updateCloudConfigSyncStateQueryData((prev) => ({
      ...(prev ?? IDLE_STATE),
      encryptionMethod: result.data
    }))
  }

  const handleAutoImportChange = async (checked: boolean) => {
    if (!isPaidUser) return
    setIsAutoImportUpdating(true)
    try {
      const result = await cloudAlbumAdapter.setAutoImport(checked)
      if (result.success) {
        setPicGoCloudUserInfoQueryData(result.data)
      } else {
        toast.error(resolveCloudErrorMessage(t, result.code, billingPhase, result.error))
      }
    } catch (error) {
      console.error(error)
      toast.error(String(error))
    } finally {
      setIsAutoImportUpdating(false)
    }
  }

  const handleEncryptionChange = async (value: unknown) => {
    if (typeof value !== 'string') {
      return
    }

    const nextMode = value as IPicGoCloudEncryptionMethod
    const currentMode =
      configSyncState.encryptionMethod ?? IPicGoCloudEncryptionMethod.AUTO

    if (nextMode === currentMode || isConfigSyncBusy || isEncryptionMethodUpdating) {
      return
    }

    if (nextMode === IPicGoCloudEncryptionMethod.E2EE) {
      cloudStoreActions.setIsEnableE2EConfirmOpen(true)
      return
    }

    await persistEncryptionMethod(nextMode)
  }

  const queryErrorMessage = userInfoError instanceof Error ? userInfoError.message : null
  const errorMessage = queryErrorMessage ?? loginError

  async function handleViewPlans () {
    cloudAdapter.openPricing()
  }

  return (
    <>
      <AppMainCard>
        <MainCardHeader
          leading={
            <div className="space-y-1">
              <div className="text-base font-semibold">{t('PICGO_CLOUD_TITLE')}</div>
              <div className="text-muted-foreground text-sm">
                {t('PICGO_CLOUD_DESCRIPTION')}
              </div>
            </div>
          }
        />

        <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto px-6 pt-6 pb-8">
          <div className={cn(
            'flex w-full max-w-5xl shrink-0 flex-col gap-4'
          )}>
            {errorMessage ? (
              <div className="border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-3 rounded-lg border px-4 py-3 text-sm">
                <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
                <div>
                  <div className="font-medium">{t('PICGO_CLOUD_ERROR_TITLE')}</div>
                  <div>{errorMessage}</div>
                </div>
              </div>
            ) : null}

            {userInfo ? (
              <>
                <CloudAccountSummary
                  userInfo={userInfo}
                  isPaidUser={isPaidUser}
                  onOpenCloud={() => cloudAdapter.openCloud()}
                  onLogout={handleLogout}
                />

                {!isPaidUser ? (
                  <CloudFreePlanBanner onViewPlans={handleViewPlans} />
                ) : null}

                <LifecycleBanner variant="inline" />

                <div className="grid gap-4 xl:grid-cols-12">
                  <div className="xl:col-span-5">
                    <CloudPlanUsageCard />
                  </div>

                  <div className="xl:col-span-7">
                    <CloudConfigSyncCard
                      onStartSync={handleStartSync}
                      onEncryptionChange={handleEncryptionChange}
                      onOpenEncryptionDocs={() => cloudAdapter.openEncryptionDocs()}
                    />
                  </div>
                </div>

                <CloudAutoImportCard
                  checked={isAutoImportEnabled}
                  disabled={isAutoImportUpdating || !isPaidUser}
                  isPaidUser={isPaidUser}
                  onCheckedChange={handleAutoImportChange}
                />
              </>
            ) : (
              <>
                {isUserInfoLoading ? (
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <LoaderCircleIcon className="size-4 animate-spin" />
                    {t('PICGO_CLOUD_LOADING')}
                  </div>
                ) : null}

                {isLoginInProgress ? (
                  <div className="text-muted-foreground text-sm">
                    {t('PICGO_CLOUD_LOGIN_IN_PROGRESS')}
                  </div>
                ) : null}

                <div className="grid gap-4 lg:grid-cols-2">
                  <CloudLoginHeroCard
                    isLoginInProgress={isLoginInProgress}
                    hasAgreedToTermsAndPrivacy={hasAgreedToTermsAndPrivacy}
                    onLogin={handleLogin}
                    onCancelLogin={handleDisposeLoginFlow}
                    onAgreementChange={(checked) => {
                      appActions.setPicGoCloudHasAgreedToTermsAndPrivacy(checked)
                    }}
                    onOpenTerms={() => cloudAdapter.openTerms()}
                    onOpenPrivacy={() => cloudAdapter.openPrivacy()}
                  />

                  <CloudLoginFeaturesCard />
                </div>
              </>
            )}
          </div>
        </div>
      </AppMainCard>

      <CloudConflictDialog
        onAbort={handleAbortSync}
        onConfirm={handleConfirmSyncResolution}
      />

      <AlertDialog
        open={isEnableE2EConfirmOpen}
        onOpenChange={cloudStoreActions.setIsEnableE2EConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('PICGO_CLOUD_E2E_ENABLE_WARNING_TITLE')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('PICGO_CLOUD_E2E_ENABLE_WARNING_MESSAGE')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={async () => {
                cloudStoreActions.setIsEnableE2EConfirmOpen(false)
                await persistEncryptionMethod(IPicGoCloudEncryptionMethod.SSE)
              }}
            >
              {t('CANCEL')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                cloudStoreActions.setIsEnableE2EConfirmOpen(false)
                await persistEncryptionMethod(IPicGoCloudEncryptionMethod.E2EE)
              }}
            >
              {t('CONFIRM')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isRestartPromptOpen}
        onOpenChange={cloudStoreActions.setIsRestartPromptOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('PICGO_CLOUD_CONFIG_SYNC_RESTART_PROMPT_TITLE')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('PICGO_CLOUD_CONFIG_SYNC_RESTART_PROMPT_MESSAGE')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => cloudStoreActions.setIsRestartPromptOpen(false)}>
              {t('PICGO_CLOUD_CONFIG_SYNC_RESTART_LATER')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const result = await cloudAdapter.reloadApp()
                if (!result.success) {
                  toast.error(result.error)
                }
              }}
            >
              {t('PICGO_CLOUD_CONFIG_SYNC_RESTART_NOW')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
