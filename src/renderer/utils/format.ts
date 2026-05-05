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
