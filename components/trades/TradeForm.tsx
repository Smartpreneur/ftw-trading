'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { tradeSchema, toNullableNumber, toNullableString, type TradeSchemaValues } from '@/lib/schemas'
import { createTrade, updateTrade, deleteTradeClose } from '@/lib/actions'
import { ASSET_CLASSES, TRADE_DIRECTIONS, TRADE_STATUSES, TRADING_PROFILES } from '@/lib/constants'
import { INSTRUMENTS } from '@/lib/asset-mapping'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InstrumentSearch } from '@/components/ui/instrument-search'
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
import { useState, useRef } from 'react'
import { TradeCloseForm } from './TradeCloseForm'
import { Plus, Trash2 } from 'lucide-react'
import { formatPrice } from '@/lib/formatters'

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
  const submittingRef = useRef(false)
  const [gewichtungPct, setGewichtungPct] = useState(
    Math.round((trade?.gewichtung ?? 1) * 100)
  )
  const [manuell, setManuell] = useState(trade?.manuell_getrackt ?? false)
  const [datumSchliessung, setDatumSchliessung] = useState(trade?.datum_schliessung?.split('T')[0] ?? '')
  const [currentStatus, setCurrentStatus] = useState(trade?.status ?? 'Aktiv')
  const [showCloseForm, setShowCloseForm] = useState(false)
  const [assetName, setAssetName] = useState(trade?.asset_name ?? '')
  const [tickerValue, setTickerValue] = useState(() => {
    if (!trade?.asset) return ''
    const match = INSTRUMENTS.find(
      (i) => i.symbol.toLowerCase() === trade.asset.toLowerCase() ||
             i.name.toLowerCase() === trade.asset.toLowerCase()
    )
    return match?.name ?? trade.asset
  })
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
          profil: undefined as unknown as 'MB' | 'SJ',
          datum_eroeffnung: new Date().toISOString().split('T')[0],
          gewichtung: 1,
        },
  })

  async function onSubmit(values: TradeSchemaValues) {
    if (submittingRef.current) return
    submittingRef.current = true
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

      const isClosed = values.status === 'Geschlossen' || values.status === 'Ausgestoppt'
      const payload = {
        ...values,
        asset_name: assetName.trim() || null,
        gewichtung: gewichtungPct / 100,
        manuell_getrackt: manuell,
        datum_schliessung: isClosed && datumSchliessung ? datumSchliessung : null,
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
      submittingRef.current = false
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
      {/* Row 1: Ticker (Instrument-Suche) + Bezeichnung */}
      <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
        <Field label="Ticker *" error={errors.asset?.message}>
          <InstrumentSearch
            value={tickerValue}
            placeholder="z.B. Ferrari, DAX, AAPL..."
            onSelect={(instrument) => {
              setTickerValue(instrument.name)
              setValue('asset', instrument.symbol, { shouldValidate: true })
              setValue('asset_klasse', instrument.asset_klasse)
              if (!assetName) setAssetName(instrument.name)
            }}
            onManualInput={(val) => {
              setTickerValue(val)
              setValue('asset', val, { shouldValidate: true })
            }}
          />
        </Field>
        <Field label="Bezeichnung">
          <Input
            className="w-[180px]"
            placeholder="z.B. Ferrari..."
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
          />
        </Field>
      </div>

      {/* Row 2: Eröffnung, Klasse, Profil */}
      <div className="grid grid-cols-3 gap-3">
        <Field label="Eröffnung *" error={errors.datum_eroeffnung?.message}>
          <Input type="date" {...register('datum_eroeffnung')} />
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
            defaultValue={trade?.profil}
            onValueChange={(v) => setValue('profil', v as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wählen..." />
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
            onValueChange={(v) => { setValue('status', v as any); setCurrentStatus(v as typeof currentStatus) }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRADE_STATUSES.filter((s) => s !== 'Gelöscht').map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      {/* Schließdatum — nur bei Geschlossen/Ausgestoppt */}
      {(currentStatus === 'Geschlossen' || currentStatus === 'Ausgestoppt') && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Schließdatum">
            <Input
              type="date"
              value={datumSchliessung}
              onChange={(e) => setDatumSchliessung(e.target.value)}
            />
          </Field>
        </div>
      )}

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

      {/* Manual tracking toggle + Schließungen */}
      <div className="border-t pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-xs font-medium">Manuell tracken</Label>
            <p className="text-[10px] text-muted-foreground">
              Auto-Erkennung deaktivieren, Schließungen manuell pflegen
            </p>
          </div>
          <Switch checked={manuell} onCheckedChange={setManuell} />
        </div>
      </div>

      {/* Schließungen — bei bestehendem Trade */}
      {trade && (
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Schließungen</Label>
            <button
              type="button"
              onClick={() => setShowCloseForm(prev => !prev)}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Plus className="h-3 w-3" />
              Schließung hinzufügen
            </button>
          </div>

          {/* Existing closes */}
          {(trade.closes ?? []).length > 0 && (
            <div className="rounded-lg border bg-muted/30 overflow-hidden divide-y divide-border/50">
              {[...(trade.closes ?? [])].sort((a, b) => (a.nummer ?? 0) - (b.nummer ?? 0)).map(c => (
                <div key={c.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center text-xs px-3 py-2">
                  <span className="font-medium">{c.typ === 'Manuell' ? 'Schließung' : c.typ}</span>
                  <span className="tabular-nums font-semibold">{c.ausstiegspreis != null ? formatPrice(c.ausstiegspreis) : '–'}</span>
                  <span className="tabular-nums text-muted-foreground">{c.anteil != null ? `${Math.round(c.anteil * 100)}%` : '–'}</span>
                  <span className="text-muted-foreground">{c.datum ? new Date(c.datum).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '–'}</span>
                </div>
              ))}
              {(() => {
                const sum = (trade.closes ?? []).reduce((s, c) => s + (c.anteil ?? 0), 0)
                return sum > 0 ? (
                  <div className="px-3 py-1.5 text-xs text-right">
                    <span className={`font-semibold ${Math.round(sum * 100) === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      Gesamt: {Math.round(sum * 100)}%
                    </span>
                  </div>
                ) : null
              })()}
            </div>
          )}

          {(trade.closes ?? []).length === 0 && !showCloseForm && (
            <p className="text-xs text-muted-foreground">Noch keine Schließungen eingetragen.</p>
          )}

          {/* New close form */}
          {showCloseForm && (
            <div className="rounded-lg border bg-muted/20 p-3">
              <TradeCloseForm
                tradeFk={trade.id}
                manuellGetrackt={manuell}
                onSuccess={() => { setShowCloseForm(false); onSuccess() }}
              />
            </div>
          )}
        </div>
      )}

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
