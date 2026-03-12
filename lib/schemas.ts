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
  gewichtung: z.number().min(0, 'Min. 0%').max(1, 'Max. 100%'),
})

export type TradeSchemaValues = z.infer<typeof tradeSchema>

export const setupSchema = z.object({
  asset: z.string().trim().min(1, 'Pflichtfeld'),
  asset_klasse: z.enum(['Index', 'Rohstoff', 'Krypto', 'Aktie', 'FX']),
  datum: z.string().min(1, 'Pflichtfeld'),
  aktueller_kurs: z.number({ error: 'Pflichtfeld' }).positive('Muss positiv sein'),
  richtung: z.enum(['LONG', 'SHORT']),
  einstiegskurs: z.number({ error: 'Pflichtfeld' }).positive('Muss positiv sein'),
  stop_loss: z.number().positive('Muss positiv sein').nullable().optional(),
  tp1: z.number({ error: 'Pflichtfeld' }).positive('Muss positiv sein'),
  tp2: z.number().nullable().optional(),
  tp3: z.number().nullable().optional(),
  tp4: z.number().nullable().optional(),
  tp1_gewichtung: z.number().min(0).max(100).nullable().optional(),
  tp2_gewichtung: z.number().min(0).max(100).nullable().optional(),
  tp3_gewichtung: z.number().min(0).max(100).nullable().optional(),
  tp4_gewichtung: z.number().min(0).max(100).nullable().optional(),
  risiko_reward_min: z.number().positive('Muss positiv sein').nullable().optional(),
  risiko_reward_max: z.number().positive('Muss positiv sein').nullable().optional(),
  zeiteinheit: z.string().nullable().optional(),
  dauer_erwartung: z.string().nullable().optional(),
  status: z.enum(['Aktiv', 'Getriggert', 'Abgelaufen']),
  bemerkungen: z.string().nullable().optional(),
  profil: z.enum(['MB', 'SJ']),
})

export type SetupSchemaValues = z.infer<typeof setupSchema>

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
