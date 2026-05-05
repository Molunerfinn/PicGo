import { CloudIcon, LoaderCircleIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { CloudCardShell } from './cloud-card-shell'

interface CloudLoginHeroCardProps {
  isLoginInProgress: boolean
  hasAgreedToTermsAndPrivacy: boolean
  onLogin: () => Promise<void>
  onCancelLogin: () => Promise<void>
  onAgreementChange: (checked: boolean) => void
  onOpenTerms: () => void
  onOpenPrivacy: () => void
}

export function CloudLoginHeroCard ({
  isLoginInProgress,
  hasAgreedToTermsAndPrivacy,
  onLogin,
  onCancelLogin,
  onAgreementChange,
  onOpenTerms,
  onOpenPrivacy
}: CloudLoginHeroCardProps) {
  const { t } = useTranslation()

  return (
    <CloudCardShell className="flex h-full flex-col gap-4 px-5 py-5">
      <div className="space-y-4">
        <div className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-xl">
          <CloudIcon className="size-6" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-[26px] leading-none font-semibold tracking-tight text-foreground">
            {t('PICGO_CLOUD_LOGIN_PANEL_TITLE')}
          </h2>
          <p className="max-w-xl text-[15px] leading-7 text-muted-foreground">
            {t('PICGO_CLOUD_LOGIN_PANEL_DESC')}
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            size="lg"
            className={isLoginInProgress ? 'w-full' : 'w-full sm:col-span-2'}
            disabled={isLoginInProgress || !hasAgreedToTermsAndPrivacy}
            onClick={async () => {
              await onLogin()
            }}
          >
            {isLoginInProgress
              ? <LoaderCircleIcon className="mr-2 size-4 animate-spin" />
              : null}
            {t('PICGO_CLOUD_LOGIN')}
          </Button>

          {isLoginInProgress
            ? (
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={async () => {
                  await onCancelLogin()
                }}
              >
                {t('PICGO_CLOUD_CANCEL_LOGIN')}
              </Button>
            )
            : null}
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/25 px-4 py-2.5">
          <label className="flex items-start gap-3">
            <Checkbox
              checked={hasAgreedToTermsAndPrivacy}
              onCheckedChange={(checked) => {
                onAgreementChange(Boolean(checked))
              }}
              disabled={isLoginInProgress}
              className="mt-0.5"
            />
            <span className="text-sm leading-6 text-muted-foreground">
              {t('PICGO_CLOUD_AGREE_PREFIX')}{' '}
              <button
                type="button"
                className="text-primary"
                onClick={onOpenTerms}
              >
                {t('PICGO_CLOUD_TERMS_OF_SERVICE')}
              </button>{' '}
              {t('PICGO_CLOUD_AGREE_AND')}{' '}
              <button
                type="button"
                className="text-primary"
                onClick={onOpenPrivacy}
              >
                {t('PICGO_CLOUD_PRIVACY_POLICY')}
              </button>
            </span>
          </label>
        </div>
      </div>
    </CloudCardShell>
  )
}
