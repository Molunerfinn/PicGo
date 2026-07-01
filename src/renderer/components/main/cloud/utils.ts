import dayjs from 'dayjs'
import { DEFAULT_DATE_TIME_FORMAT } from '@/utils/consts'

export function resolveErrorMessage (error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error
  }

  return fallback
}

export function formatCloudSyncTime (
  value: string | undefined,
  fallback: string
) {
  if (!value) {
    return fallback
  }

  const date = dayjs(value)
  if (!date.isValid()) {
    return fallback
  }

  return date.format(DEFAULT_DATE_TIME_FORMAT)
}
