import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

export function formatPercent(value: number | null | undefined, showSign = true): string {
  if (value === null || value === undefined) return '–'
  const sign = showSign && value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)} %`
}

export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return '–'
  // Smart decimals based on magnitude:
  // < 10 (FX, e.g. EUR/USD 1.1850) → 4 decimal places
  // 10–999 (Silver 23.45, LVMH 531.50) → 2 decimal places
  // 1000+ (Gold 2345.50, BTC 67234) → 2 decimal places
  const abs = Math.abs(value)
  const decimals = abs < 10 ? 4 : 2
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
