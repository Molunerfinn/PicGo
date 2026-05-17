import dayjs from 'dayjs'
import { DEFAULT_DATE_FORMAT } from './consts'

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const

export function formatBytes (bytes: number | null | undefined): string {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }

  let value = bytes
  let unitIndex = 0
  while (value >= 1024 && unitIndex < BYTE_UNITS.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  if (unitIndex === 0) {
    return `${Math.round(value)} ${BYTE_UNITS[unitIndex]}`
  }

  return `${value.toFixed(1)} ${BYTE_UNITS[unitIndex]}`
}

export function formatDate (
  value: string | number | Date | null | undefined,
  format: string = DEFAULT_DATE_FORMAT
): string | null {
  if (value === null || value === undefined) return null
  const d = dayjs(value)
  if (!d.isValid()) return null
  return d.format(format)
}

export function formatDateRange (
  start: string | number | Date | null | undefined,
  end: string | number | Date | null | undefined,
  format: string = DEFAULT_DATE_FORMAT,
  separator: string = ' – '
): string | null {
  const startStr = formatDate(start, format)
  const endStr = formatDate(end, format)
  if (!startStr || !endStr) return null
  return `${startStr}${separator}${endStr}`
}
