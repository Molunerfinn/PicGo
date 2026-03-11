import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { settingsStoreActions } from '@/store'
import type { SettingsConfigSaveTarget } from './utils'

function resolveErrorMessage (error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}

export function useSettingsSave () {
  const { t } = useTranslation()

  return async (
    path: SettingsConfigSaveTarget,
    value?: unknown
  ) => {
    try {
      await settingsStoreActions.saveSettingsConfig(path, value)
      toast.success(t('SUCCESS'))
      return true
    } catch (error) {
      toast.error(resolveErrorMessage(error, t('FAILED')))
      return false
    }
  }
}
