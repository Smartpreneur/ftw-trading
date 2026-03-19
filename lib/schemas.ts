import { z } from 'zod'

export const tradeSchema = z.object({
  datum_eroeffnung: z.string().min(1, 'Pflichtfeld'),
  asset: z.string().trim().min(1, 'Pflichtfeld'),
  asset_name: z.string().trim().nullable().optional(),
  asset_klasse: z.enum(['Index', 'Rohstoff', 'Krypto', 'Aktie', 'FX']),
  richtung: z.enum(['LONG', 'SHORT']),
  einstiegspreis: z.number().positive('Muss positiv sein'),
  stop_loss: z.number().nullable().optional(),
  tp1: z.number().nullable().optional(),
  tp2: z.number().nullable().optional(),
  tp3: z.number().nullable().optional(),
  tp4: z.number().nullable().optional(),
  status: z.enum([
    'Entwurf',
    'Aktiv',
    'Geschlossen',
    'Ausgestoppt',
    'Ungültig',
  ]),
  bemerkungen: z.string().nullable().optional(),
  gewichtung: z.number().min(0, 'Min. 0%').max(1, 'Max. 100%'),
  profil: z.enum(['MB', 'SJ']),
  // Setup-specific optional fields
  aktueller_kurs: z.number().positive().nullable().optional(),
  risiko_reward_min: z.number().positive().nullable().optional(),
  risiko_reward_max: z.number().positive().nullable().optional(),
  zeiteinheit: z.string().nullable().optional(),
  dauer_erwartung: z.string().nullable().optional(),
  chart_bild_url: z.string().nullable().optional(),
})

export type TradeSchemaValues = z.infer<typeof tradeSchema>

export const tradeCloseSchema = z.object({
  typ: z.enum(['TP1', 'TP2', 'TP3', 'TP4', 'SL', 'Manuell']),
  datum: z.string().min(1, 'Pflichtfeld'),
  ausstiegspreis: z.number().positive('Muss positiv sein').nullable().optional(),
  anteil: z.number().min(1, 'Min. 1%').max(100, 'Max. 100%'),
  bemerkungen: z.string().nullable().optional(),
})

export type TradeCloseSchemaValues = z.infer<typeof tradeCloseSchema>

export const tradeEntrySchema = z.object({
  preis: z.number().positive('Muss positiv sein'),
  anteil: z.number().min(1, 'Min. 1%').max(100, 'Max. 100%'),
  bemerkungen: z.string().nullable().optional(),
})

export type TradeEntrySchemaValues = z.infer<typeof tradeEntrySchema>

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
