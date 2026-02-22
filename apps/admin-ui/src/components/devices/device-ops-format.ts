import { formatDateTime as formatI18nDateTime } from '@/lib/i18n/format'

export function formatDateTime(value: string | null) {
  return formatI18nDateTime(value, 'n/a')
}

export function formatDurationMs(value: number) {
  if (value < 1000) {
    return `${value} ms`
  }
  if (value < 60_000) {
    return `${Math.round(value / 1000)} sec`
  }
  return `${Math.round(value / 60_000)} min`
}

export function statusBadgeVariant(status: 'ok' | 'stale') {
  return status === 'ok' ? 'default' : 'outline'
}
