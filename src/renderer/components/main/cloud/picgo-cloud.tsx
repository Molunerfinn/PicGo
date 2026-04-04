import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CircleAlertIcon,
  ExternalLinkIcon,
  HelpCircleIcon,
  LoaderCircleIcon
} from 'lucide-react'
import {
  IPicGoCloudConfigSyncSessionStatus,
  IPicGoCloudEncryptionMethod,
  IPicGoCloudConfigSyncToastType,
  type IPicGoCloudConfigSyncResolution,
  type IPicGoCloudConfigSyncRunResult
} from '#/types/cloudConfigSync'
import { AppMainCard } from '@/components/common/app-main-card'
import { MainCardHeader } from '@/components/common/main-card-header'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { cloudAdapter } from '@/adapters/cloud'
import {
  appActions,
  PicGoCloudLoginStatusValues,
  PicGoCloudRequestStatusValues,
  useAppStore
} from '@/store'
import { cloudStoreActions, useCloudStore } from '@/store/cloud'
import { CloudConflictDialog } from './cloud-conflict-dialog'
import { formatCloudSyncTime } from './utils'

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

export function PicGoCloud () {
  const { t } = useTranslation()
  const userInfo = useAppStore.use.picgoCloud().userInfo
  const userInfoStatus = useAppStore.use.picgoCloud().userInfoStatus
  const userInfoError = useAppStore.use.picgoCloud().userInfoError
  const loginStatus = useAppStore.use.picgoCloud().loginStatus
  const loginError = useAppStore.use.picgoCloud().loginError
  const hasAgreedToTermsAndPrivacy = useAppStore.use.picgoCloud().hasAgreedToTermsAndPrivacy
  const configSyncState = useCloudStore.use.configSyncState()
  const isConfigSyncStateLoading = useCloudStore.use.isConfigSyncStateLoading()
  const isEnableE2EConfirmOpen = useCloudStore.use.isEnableE2EConfirmOpen()
  const isRestartPromptOpen = useCloudStore.use.isRestartPromptOpen()
  const isEncryptionMethodUpdating = useCloudStore.use.isEncryptionMethodUpdating()

  const isUserInfoLoading = userInfoStatus === PicGoCloudRequestStatusValues.Loading
  const isLoginInProgress = loginStatus === PicGoCloudLoginStatusValues.InProgress
  const isConfigSyncRunning =
    configSyncState.sessionStatus === IPicGoCloudConfigSyncSessionStatus.SYNCING
  const isConfigSyncBusy =
    configSyncState.sessionStatus !== IPicGoCloudConfigSyncSessionStatus.IDLE
  const isEncryptionDisabled = isConfigSyncBusy || isConfigSyncStateLoading || isEncryptionMethodUpdating
  const lastSyncedAtText = formatCloudSyncTime(
    configSyncState.lastSyncedAt,
    t('PICGO_CLOUD_LAST_SYNC_TIME_NONE')
  )

  async function loadConfigSyncState () {
    cloudStoreActions.setIsConfigSyncStateLoading(true)
    const result = await cloudAdapter.getConfigSyncState()
    cloudStoreActions.setIsConfigSyncStateLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    cloudStoreActions.applyConfigSyncState(result.data)
  }

  async function refreshAppStateAfterSync () {
    await appActions.refreshAppConfig()
    await appActions.refreshPicBeds()
  }

  async function handleConfigSyncResult (runResult: IPicGoCloudConfigSyncRunResult) {
    cloudStoreActions.applyConfigSyncState(runResult.state)
    showConfigSyncToast(runResult.toastType, runResult.message)

    if (runResult.authInvalidated) {
      appActions.setPicGoCloudUserInfo(null)
      appActions.setPicGoCloudUserInfoError(null)
      appActions.setPicGoCloudUserInfoStatus(PicGoCloudRequestStatusValues.Idle)
      return
    }

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

    appActions.setPicGoCloudUserInfo(result.data)
    appActions.setPicGoCloudUserInfoError(null)
    appActions.setPicGoCloudUserInfoStatus(PicGoCloudRequestStatusValues.Idle)
    await loadConfigSyncState()
  }

  useEffect(() => {
    let disposed = false

    async function bootstrap () {
      if (userInfo !== undefined) {
        if (userInfo) {
          await loadConfigSyncState()
        }
        return
      }

      appActions.setPicGoCloudUserInfoStatus(PicGoCloudRequestStatusValues.Loading)
      appActions.setPicGoCloudUserInfoError(null)

      const result = await cloudAdapter.getUserInfo()
      if (disposed) {
        return
      }

      if (!result.success) {
        appActions.setPicGoCloudUserInfoStatus(PicGoCloudRequestStatusValues.Error)
        appActions.setPicGoCloudUserInfoError(result.error)
        return
      }

      appActions.setPicGoCloudUserInfo(result.data)
      appActions.setPicGoCloudUserInfoStatus(PicGoCloudRequestStatusValues.Idle)

      if (result.data) {
        await loadConfigSyncState()
      }
    }

    bootstrap()

    return () => {
      disposed = true
    }
  }, [userInfo])

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

    appActions.setPicGoCloudUserInfo(null)
    appActions.setPicGoCloudUserInfoError(null)
    appActions.setPicGoCloudUserInfoStatus(PicGoCloudRequestStatusValues.Idle)
  }

  async function handleStartSync () {
    if (isConfigSyncBusy) return

    cloudStoreActions.setOptimisticSyncing()
    toast(t('PICGO_CLOUD_CONFIG_SYNC_STARTING'))

    const result = await cloudAdapter.startConfigSync()
    if (!result.success) {
      toast.error(result.error)
      await loadConfigSyncState()
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

    cloudStoreActions.applyConfigSyncState(result.data)
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

    cloudStoreActions.applyConfigSyncState({
      ...useCloudStore.getState().configSyncState,
      encryptionMethod: result.data
    })
  }

  const handleEncryptionChange = async (value: unknown) => {
    if (typeof value !== 'string') {
      return
    }

    const nextMode = value as IPicGoCloudEncryptionMethod
    const currentMode =
      configSyncState.encryptionMethod ?? IPicGoCloudEncryptionMethod.AUTO

    if (nextMode === currentMode || isEncryptionDisabled) {
      return
    }

    if (nextMode === IPicGoCloudEncryptionMethod.E2EE) {
      cloudStoreActions.setIsEnableE2EConfirmOpen(true)
      return
    }

    await persistEncryptionMethod(nextMode)
  }

  const errorMessage = userInfoError ?? loginError

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

        <div className="flex min-h-0 flex-1 justify-center overflow-auto p-6">
          <div className="flex w-full max-w-4xl flex-col gap-6">
            <section className="rounded-xl border bg-card p-6 shadow-xs">
              {isUserInfoLoading ? (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <LoaderCircleIcon className="size-4 animate-spin" />
                  {t('PICGO_CLOUD_LOADING')}
                </div>
              ) : null}

              {errorMessage ? (
                <div className="border-destructive/30 bg-destructive/5 text-destructive mb-4 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm">
                  <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
                  <div>
                    <div className="font-medium">{t('PICGO_CLOUD_ERROR_TITLE')}</div>
                    <div>{errorMessage}</div>
                  </div>
                </div>
              ) : null}

              {isLoginInProgress ? (
                <div className="text-muted-foreground mb-4 text-sm">
                  {t('PICGO_CLOUD_LOGIN_IN_PROGRESS')}
                </div>
              ) : null}

              {userInfo ? (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold">
                        {t('PICGO_CLOUD_LOGGED_IN_AS', { user: userInfo.user })}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" onClick={() => cloudAdapter.openCloud()}>
                        <ExternalLinkIcon className="mr-2 size-4" />
                        {t('PICGO_CLOUD_OPEN')}
                      </Button>
                      <Button variant="destructive" onClick={handleLogout}>
                        {t('PICGO_CLOUD_LOGOUT')}
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      disabled={isConfigSyncBusy}
                      onClick={handleStartSync}
                      className="min-w-28"
                    >
                      {isConfigSyncRunning ? (
                        <LoaderCircleIcon className="mr-2 size-4 animate-spin" />
                      ) : null}
                      {t('PICGO_CLOUD_CONFIG_SYNC')}
                    </Button>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-muted-foreground text-sm">
                        {t('PICGO_CLOUD_ENCRYPTION_MODE_LABEL')}
                      </span>
                      <Select
                        value={configSyncState.encryptionMethod ?? IPicGoCloudEncryptionMethod.AUTO}
                        onValueChange={handleEncryptionChange}
                        disabled={isEncryptionDisabled}
                      >
                        <SelectTrigger className="w-52">
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

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground inline-flex size-8 items-center justify-center rounded-md transition-colors"
                          >
                            <HelpCircleIcon className="size-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-80 space-y-2">
                          <p>{t('PICGO_CLOUD_ENCRYPTION_MODE_TIP_AUTO')}</p>
                          <p>{t('PICGO_CLOUD_ENCRYPTION_MODE_TIP_SERVER')}</p>
                          <p>{t('PICGO_CLOUD_ENCRYPTION_MODE_TIP_E2E')}</p>
                          <button
                            type="button"
                            onClick={() => cloudAdapter.openEncryptionDocs()}
                            className="text-primary text-sm"
                          >
                            {t('PICGO_CLOUD_ENCRYPTION_MODE_TIP_DOC')}
                          </button>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="text-muted-foreground text-sm">
                    {t('PICGO_CLOUD_LAST_SYNC_TIME', {
                      time: lastSyncedAtText
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-muted-foreground text-sm">
                    {t('PICGO_CLOUD_NOT_LOGGED_IN')}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      disabled={isLoginInProgress || !hasAgreedToTermsAndPrivacy}
                      onClick={handleLogin}
                    >
                      {isLoginInProgress ? (
                        <LoaderCircleIcon className="mr-2 size-4 animate-spin" />
                      ) : null}
                      {t('PICGO_CLOUD_LOGIN')}
                    </Button>

                    {isLoginInProgress ? (
                      <Button variant="outline" onClick={handleDisposeLoginFlow}>
                        {t('PICGO_CLOUD_CANCEL_LOGIN')}
                      </Button>
                    ) : null}
                  </div>

                  <label className="flex items-start gap-3">
                    <Checkbox
                      checked={hasAgreedToTermsAndPrivacy}
                      onCheckedChange={(checked) => {
                        appActions.setPicGoCloudHasAgreedToTermsAndPrivacy(Boolean(checked))
                      }}
                      disabled={isLoginInProgress}
                      className="mt-0.5"
                    />
                    <span className="text-muted-foreground text-sm leading-6">
                      {t('PICGO_CLOUD_AGREE_PREFIX')}{' '}
                      <button
                        type="button"
                        className="text-primary"
                        onClick={() => cloudAdapter.openTerms()}
                      >
                        {t('PICGO_CLOUD_TERMS_OF_SERVICE')}
                      </button>{' '}
                      {t('PICGO_CLOUD_AGREE_AND')}{' '}
                      <button
                        type="button"
                        className="text-primary"
                        onClick={() => cloudAdapter.openPrivacy()}
                      >
                        {t('PICGO_CLOUD_PRIVACY_POLICY')}
                      </button>
                    </span>
                  </label>
                </div>
              )}
            </section>
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
