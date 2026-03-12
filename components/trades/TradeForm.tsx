'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { tradeSchema, toNullableNumber, toNullableString, type TradeSchemaValues } from '@/lib/schemas'
import { createTrade, updateTrade } from '@/lib/actions'
import { ASSET_CLASSES, TRADE_DIRECTIONS, TRADE_STATUSES, TRADING_PROFILES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { Trade } from '@/lib/types'
import { toast } from 'sonner'
import { useState } from 'react'

interface TradeFormProps {
  trade?: Trade
  onSuccess: () => void
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

const asNullableNum = (v: unknown) => toNullableNumber(v)
const asNullableStr = (v: unknown) => toNullableString(v)

export function TradeForm({ trade, onSuccess }: TradeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [gewichtungPct, setGewichtungPct] = useState(
    Math.round((trade?.gewichtung ?? 1) * 100)
  )
  const [manuell, setManuell] = useState(trade?.manuell_getrackt ?? false)
  const [tpGewichtung, setTpGewichtung] = useState(() => {
    // If any tp_gewichtung is set, use stored values
    const hasStored = trade && (trade.tp1_gewichtung != null || trade.tp2_gewichtung != null || trade.tp3_gewichtung != null || trade.tp4_gewichtung != null)
    if (hasStored) {
      return {
        tp1: trade.tp1_gewichtung != null ? Math.round(trade.tp1_gewichtung * 100) : '',
        tp2: trade.tp2_gewichtung != null ? Math.round(trade.tp2_gewichtung * 100) : '',
        tp3: trade.tp3_gewichtung != null ? Math.round(trade.tp3_gewichtung * 100) : '',
        tp4: trade.tp4_gewichtung != null ? Math.round(trade.tp4_gewichtung * 100) : '',
      } as Record<string, number | string>
    }
    // Auto-distribute based on defined TPs (first TP gets remainder)
    const tpKeys = ['tp1', 'tp2', 'tp3', 'tp4'] as const
    const defined = tpKeys.filter(k => trade?.[k] != null)
    const count = defined.length
    const base = count > 0 ? Math.floor(100 / count) : 0
    const remainder = count > 0 ? 100 - base * count : 0
    const result: Record<string, number | string> = { tp1: '', tp2: '', tp3: '', tp4: '' }
    defined.forEach((k, i) => { result[k] = i === 0 ? base + remainder : base })
    return result
  })
  const [tpSlTimestamps, setTpSlTimestamps] = useState({
    tp1_erreicht_am: trade?.tp1_erreicht_am?.split('T')[0] ?? '',
    tp2_erreicht_am: trade?.tp2_erreicht_am?.split('T')[0] ?? '',
    tp3_erreicht_am: trade?.tp3_erreicht_am?.split('T')[0] ?? '',
    tp4_erreicht_am: trade?.tp4_erreicht_am?.split('T')[0] ?? '',
    sl_erreicht_am: trade?.sl_erreicht_am?.split('T')[0] ?? '',
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TradeSchemaValues>({
    resolver: zodResolver(tradeSchema),
    defaultValues: trade
      ? {
          datum_eroeffnung: trade.datum_eroeffnung,
          asset: trade.asset,
          asset_klasse: trade.asset_klasse,
          richtung: trade.richtung ?? 'LONG',
          einstiegspreis: trade.einstiegspreis ?? 0,
          stop_loss: trade.stop_loss ?? undefined,
          tp1: trade.tp1 ?? undefined,
          tp2: trade.tp2 ?? undefined,
          tp3: trade.tp3 ?? undefined,
          tp4: trade.tp4 ?? undefined,
          status: trade.status,
          bemerkungen: trade.bemerkungen ?? undefined,
          gewichtung: trade.gewichtung ?? 1,
          profil: trade.profil,
        }
      : {
          status: 'Aktiv',
          richtung: 'LONG',
          asset_klasse: 'Index',
          datum_eroeffnung: new Date().toISOString().split('T')[0],
          gewichtung: 1,
          profil: 'SJ' as const,
        },
  })

  async function onSubmit(values: TradeSchemaValues) {
    setIsSubmitting(true)
    try {
      // Detect if TP/SL levels changed (for reference-date-aware auto-detection)
      let tp_sl_geaendert_am: string | undefined = undefined
      if (trade) {
        const tpSlChanged =
          (values.tp1 ?? null) !== (trade.tp1 ?? null) ||
          (values.tp2 ?? null) !== (trade.tp2 ?? null) ||
          (values.tp3 ?? null) !== (trade.tp3 ?? null) ||
          (values.tp4 ?? null) !== (trade.tp4 ?? null) ||
          (values.stop_loss ?? null) !== (trade.stop_loss ?? null)
        if (tpSlChanged) {
          tp_sl_geaendert_am = new Date().toISOString()
        }
      }

      const payload = {
        ...values,
        gewichtung: gewichtungPct / 100,
        manuell_getrackt: manuell,
        tp1_gewichtung: tpGewichtung.tp1 !== '' ? Number(tpGewichtung.tp1) / 100 : null,
        tp2_gewichtung: tpGewichtung.tp2 !== '' ? Number(tpGewichtung.tp2) / 100 : null,
        tp3_gewichtung: tpGewichtung.tp3 !== '' ? Number(tpGewichtung.tp3) / 100 : null,
        tp4_gewichtung: tpGewichtung.tp4 !== '' ? Number(tpGewichtung.tp4) / 100 : null,
        ...(tp_sl_geaendert_am ? { tp_sl_geaendert_am } : {}),
        ...(manuell ? {
          tp1_erreicht_am: tpSlTimestamps.tp1_erreicht_am || null,
          tp2_erreicht_am: tpSlTimestamps.tp2_erreicht_am || null,
          tp3_erreicht_am: tpSlTimestamps.tp3_erreicht_am || null,
          tp4_erreicht_am: tpSlTimestamps.tp4_erreicht_am || null,
          sl_erreicht_am: tpSlTimestamps.sl_erreicht_am || null,
        } : {}),
      }
      if (trade) {
        await updateTrade(trade.id, payload as any)
        toast.success('Trade aktualisiert')
      } else {
        await createTrade(payload as any)
        toast.success('Trade erstellt')
      }
      onSuccess()
    } catch (err: any) {
      toast.error(err?.message ?? 'Fehler beim Speichern')
    } finally {
      setIsSubmitting(false)
    }
  }

  function onValidationError(errs: Record<string, any>) {
    const messages = Object.entries(errs)
      .map(([field, err]) => `${field}: ${err?.message ?? 'Ungültig'}`)
      .join('\n')
    toast.error(`Validierungsfehler:\n${messages}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onValidationError)} className="space-y-4">
      {/* Row 1 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Eröffnung *" error={errors.datum_eroeffnung?.message}>
          <Input type="date" {...register('datum_eroeffnung')} />
        </Field>
        <Field label="Asset *" error={errors.asset?.message}>
          <Input placeholder="z.B. DAX, BTC/USD" {...register('asset')} />
        </Field>
        <Field label="Asset-Klasse *" error={errors.asset_klasse?.message}>
          <Select
            defaultValue={trade?.asset_klasse ?? 'Index'}
            onValueChange={(v) => setValue('asset_klasse', v as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSET_CLASSES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Profil *" error={errors.profil?.message}>
          <Select
            defaultValue={trade?.profil ?? 'SJ'}
            onValueChange={(v) => setValue('profil', v as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRADING_PROFILES.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Richtung *" error={errors.richtung?.message}>
          <Select
            defaultValue={trade?.richtung ?? 'LONG'}
            onValueChange={(v) => setValue('richtung', v as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRADE_DIRECTIONS.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Einstieg *" error={errors.einstiegspreis?.message}>
          <Input
            type="number"
            step="any"
            placeholder="0.00"
            {...register('einstiegspreis', { valueAsNumber: true })}
          />
        </Field>
        <Field label="Stop Loss" error={errors.stop_loss?.message}>
          <Input
            type="number"
            step="any"
            placeholder="0.00"
            {...register('stop_loss', { setValueAs: asNullableNum })}
          />
        </Field>
        <Field label="Status *" error={errors.status?.message}>
          <Select
            defaultValue={trade?.status ?? 'Aktiv'}
            onValueChange={(v) => setValue('status', v as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRADE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      {/* TP targets with percentage */}
      <div className="space-y-1">
        <div className="grid grid-cols-4 gap-3">
          {(['tp1', 'tp2', 'tp3', 'tp4'] as const).map((tp, i) => (
            <div key={tp} className="space-y-1">
              <Field label={`TP${i + 1}`} error={errors[tp]?.message}>
                <Input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  {...register(tp, { setValueAs: asNullableNum })}
                />
              </Field>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  placeholder="%"
                  className="h-7 text-xs"
                  value={tpGewichtung[tp]}
                  onChange={(e) =>
                    setTpGewichtung((prev) => ({ ...prev, [tp]: e.target.value === '' ? '' : Number(e.target.value) }))
                  }
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>
          ))}
        </div>
        {/* TP weight sum indicator */}
        {(['tp1', 'tp2', 'tp3', 'tp4'] as const).some((tp) => tpGewichtung[tp] !== '') && (() => {
          const sum = (['tp1', 'tp2', 'tp3', 'tp4'] as const).reduce(
            (s, tp) => s + (tpGewichtung[tp] !== '' ? Number(tpGewichtung[tp]) : 0), 0
          )
          return (
            <p className={`text-xs ${sum === 100 ? 'text-emerald-600' : 'text-rose-600'}`}>
              Summe: {sum}% {sum !== 100 && '— muss 100% ergeben'}
            </p>
          )
        })()}
      </div>

      {/* Gewichtung */}
      <div className="grid grid-cols-3 gap-3">
        <Field label="Gewichtung (%)">
          <Input
            type="number"
            min="0"
            max="100"
            step="1"
            value={gewichtungPct}
            onChange={(e) => setGewichtungPct(Number(e.target.value) || 100)}
          />
        </Field>
      </div>

      {/* Notes */}
      <Field label="Bemerkungen" error={errors.bemerkungen?.message}>
        <textarea
          className="flex min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          placeholder="Notizen, Setup-Beschreibung, Learnings..."
          {...register('bemerkungen', { setValueAs: asNullableStr })}
        />
      </Field>

      {/* Manual tracking toggle */}
      <div className="border-t pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-xs font-medium">Manuell tracken</Label>
            <p className="text-[10px] text-muted-foreground">
              Auto-Erkennung deaktivieren, TP/SL manuell pflegen
            </p>
          </div>
          <Switch checked={manuell} onCheckedChange={setManuell} />
        </div>

        {manuell && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(['tp1', 'tp2', 'tp3', 'tp4', 'sl'] as const).map((key) => {
              const field = `${key}_erreicht_am` as keyof typeof tpSlTimestamps
              const label = key === 'sl' ? 'SL erreicht am' : `${key.toUpperCase()} erreicht am`
              return (
                <Field key={field} label={label}>
                  <Input
                    type="date"
                    value={tpSlTimestamps[field]}
                    onChange={(e) =>
                      setTpSlTimestamps((prev) => ({ ...prev, [field]: e.target.value }))
                    }
                  />
                </Field>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Speichern...' : trade ? 'Aktualisieren' : 'Erstellen'}
        </Button>
      </div>
    </form>
  )
}
