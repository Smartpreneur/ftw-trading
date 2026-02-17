import { z } from 'zod'

export const tradeSchema = z.object({
  trade_id: z.string().nullable().optional(),
  datum_eroeffnung: z.string().min(1, 'Pflichtfeld'),
  asset: z.string().trim().min(1, 'Pflichtfeld'),
  asset_klasse: z.enum(['Index', 'Rohstoff', 'Krypto', 'Aktie', 'FX']),
  richtung: z.enum(['LONG', 'SHORT']),
  einstiegspreis: z.number().positive('Muss positiv sein'),
  stop_loss: z.number().nullable().optional(),
  tp1: z.number().nullable().optional(),
  tp2: z.number().nullable().optional(),
  tp3: z.number().nullable().optional(),
  tp4: z.number().nullable().optional(),
  status: z.enum(['Aktiv', 'Erfolgreich', 'Ausgestoppt', 'Ungültig', 'Einstand']),
  datum_schliessung: z.string().nullable().optional(),
  ausstiegspreis: z.number().nullable().optional(),
  bemerkungen: z.string().nullable().optional(),
})

export type TradeSchemaValues = z.infer<typeof tradeSchema>

/** Converts empty-string input to null for optional number fields */
export function toNullableNumber(v: unknown): number | null {
  if (v === '' || v === null || v === undefined) return null
  const n = parseFloat(String(v))
  return isNaN(n) ? null : n
}

/** Converts empty-string input to null for optional string fields */
export function toNullableString(v: unknown): string | null {
  if (v === '' || v === null || v === undefined) return null
  return String(v)
}
