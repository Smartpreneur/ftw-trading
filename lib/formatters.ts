import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

export function formatPercent(value: number | null | undefined, showSign = true): string {
  if (value === null || value === undefined) return '–'
  const sign = showSign && value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)} %`
}

export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return '–'
  // < 2 (e.g. EUR/USD 1.0850, small crypto) → 4 decimal places
  // ≥ 2 (stocks, indices, gold, BTC, etc.) → 2 decimal places
  const decimals = Math.abs(value) < 2 ? 4 : 2
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '–'
  try {
    return format(parseISO(value), 'dd.MM.yy', { locale: de })
  } catch {
    return value
  }
}

export function formatDays(days: number | null | undefined): string {
  if (days === null || days === undefined) return '–'
  return `${days} ${days === 1 ? 'Tag' : 'Tage'}`
}

export function formatRR(value: number | null | undefined): string {
  if (value === null || value === undefined) return '–'
  return `${value.toFixed(2)}`
}

export function getMonthLabel(isoDate: string): string {
  try {
    return format(parseISO(isoDate), 'MMM yyyy', { locale: de })
  } catch {
    return isoDate
  }
}
