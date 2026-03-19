'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { tradeSchema, toNullableNumber, toNullableString, type TradeSchemaValues } from '@/lib/schemas'
import { createTrade, updateTrade, uploadChartImage, deleteChartImage, saveTradeEntries } from '@/lib/actions'
import { fetchInstrumentPrice, searchTradingView } from '@/lib/price-actions'
import { ASSET_CLASSES, TRADE_DIRECTIONS, TRADING_PROFILES } from '@/lib/constants'
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
import type { Trade } from '@/lib/types'
import { toast } from 'sonner'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Upload, X, ImageIcon, Loader2, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'

interface SetupFormProps {
  setup?: Trade
  onSuccess: () => void
}

const SETUP_STATUS = 'Entwurf' as const
const ZEITEINHEITEN = ['5min', '15min', '1H', '4H', 'Daily', 'Weekly'] as const

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

export function SetupForm({ setup, onSuccess }: SetupFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(setup?.chart_bild_url ?? null)
  const [imagePreview, setImagePreview] = useState<string | null>(setup?.chart_bild_url ?? null)
  const [isUploading, setIsUploading] = useState(false)
  const [isFetchingPrice, setIsFetchingPrice] = useState(false)
  const [assetValue, setAssetValue] = useState(() => {
    if (!setup?.asset) return ''
    const match = INSTRUMENTS.find(
      (i) => i.symbol.toLowerCase() === setup.asset.toLowerCase() ||
             i.name.toLowerCase() === setup.asset.toLowerCase()
    )
    return match?.name ?? setup.asset
  })
  const [assetName, setAssetName] = useState(setup?.asset_name ?? '')
  const [selectedAssetKlasse, setSelectedAssetKlasse] = useState(setup?.asset_klasse ?? 'Index')
  const [tpGewichtung, setTpGewichtung] = useState<Record<string, number | string>>(() => {
    if (setup) {
      return {
        tp1: setup.tp1_gewichtung != null ? Math.round(setup.tp1_gewichtung * 100) : '',
        tp2: setup.tp2_gewichtung != null ? Math.round(setup.tp2_gewichtung * 100) : '',
        tp3: setup.tp3_gewichtung != null ? Math.round(setup.tp3_gewichtung * 100) : '',
        tp4: setup.tp4_gewichtung != null ? Math.round(setup.tp4_gewichtung * 100) : '',
      }
    }
    return { tp1: 100, tp2: '', tp3: '', tp4: '' }
  })
  const [tvSymbol, setTvSymbol] = useState(setup?.tradingview_symbol ?? '')
  const [tvSearch, setTvSearch] = useState('')
  const [tvResults, setTvResults] = useState<Awaited<ReturnType<typeof searchTradingView>>>([])
  const [tvSearching, setTvSearching] = useState(false)
  const tvTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleTvSearch(query: string) {
    setTvSearch(query)
    if (tvTimeoutRef.current) clearTimeout(tvTimeoutRef.current)
    if (query.length < 2) { setTvResults([]); return }
    tvTimeoutRef.current = setTimeout(async () => {
      setTvSearching(true)
      try {
        const results = await searchTradingView(query)
        setTvResults(results)
      } catch { setTvResults([]) }
      finally { setTvSearching(false) }
    }, 300)
  }

  const [entryPoints, setEntryPoints] = useState<Array<{ preis: string; anteil: string }>>(() => {
    if (setup?.entries && setup.entries.length > 0) {
      return setup.entries
        .sort((a, b) => a.nummer - b.nummer)
        .map(e => ({ preis: String(e.preis), anteil: String(Math.round(e.anteil * 100)) }))
    }
    return []
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TradeSchemaValues>({
    resolver: zodResolver(tradeSchema),
    defaultValues: setup
      ? {
          asset: setup.asset,
          asset_klasse: setup.asset_klasse,
          datum_eroeffnung: setup.datum_eroeffnung,
          aktueller_kurs: setup.aktueller_kurs ?? undefined,
          richtung: setup.richtung ?? 'LONG',
          einstiegspreis: setup.einstiegspreis ?? undefined,
          stop_loss: setup.stop_loss ?? undefined,
          tp1: setup.tp1 ?? undefined,
          tp2: setup.tp2 ?? undefined,
          tp3: setup.tp3 ?? undefined,
          tp4: setup.tp4 ?? undefined,
          risiko_reward_min: setup.risiko_reward_min ?? undefined,
          risiko_reward_max: setup.risiko_reward_max ?? undefined,
          zeiteinheit: setup.zeiteinheit ?? undefined,
          dauer_erwartung: setup.dauer_erwartung ?? undefined,
          status: SETUP_STATUS,
          bemerkungen: setup.bemerkungen ?? undefined,
          analyse_text: setup.analyse_text ?? undefined,
          profil: setup.profil,
          gewichtung: 1,
        }
      : {
          status: SETUP_STATUS,
          richtung: 'LONG',
          asset_klasse: 'Index',
          profil: 'MB',
          datum_eroeffnung: new Date().toISOString().split('T')[0],
          zeiteinheit: '4H',
          gewichtung: 1,
        },
  })

  // Auto-calculate blended einstiegspreis from entry points
  useEffect(() => {
    if (entryPoints.length === 0) return
    const valid = entryPoints
      .map(e => ({ preis: parseFloat(e.preis), anteil: parseFloat(e.anteil) }))
      .filter(e => !isNaN(e.preis) && e.preis > 0 && !isNaN(e.anteil) && e.anteil > 0)
    if (valid.length === 0) return
    const totalAnteil = valid.reduce((s, e) => s + e.anteil, 0)
    if (totalAnteil <= 0) return
    const blended = valid.reduce((s, e) => s + e.preis * (e.anteil / totalAnteil), 0)
    setValue('einstiegspreis', Math.round(blended * 100) / 100)
  }, [entryPoints, setValue])

  const watchTp1 = watch('tp1')
  const watchTp2 = watch('tp2')
  const watchTp3 = watch('tp3')
  const watchTp4 = watch('tp4')
  const watchEinstieg = watch('einstiegspreis')
  const watchSL = watch('stop_loss')
  const watchRichtung = watch('richtung')

  // Auto-calculate CRV from entry, SL and TP targets
  useEffect(() => {
    const entry = parseFloat(String(watchEinstieg ?? ''))
    const sl = parseFloat(String(watchSL ?? ''))
    if (!entry || !sl || isNaN(entry) || isNaN(sl)) return

    const risk = Math.abs(entry - sl)
    if (risk <= 0) return

    const crvValues = [watchTp1, watchTp2, watchTp3, watchTp4]
      .map((v) => parseFloat(String(v ?? '')))
      .filter((tp) => !isNaN(tp) && tp > 0)
      .map((tp) => {
        const reward = Math.abs(tp - entry)
        return reward > 0 ? Math.round((reward / risk) * 100) / 100 : null
      })
      .filter((v): v is number => v !== null)

    if (crvValues.length === 0) return
    setValue('risiko_reward_min', Math.min(...crvValues))
    setValue('risiko_reward_max', Math.max(...crvValues))
  }, [watchEinstieg, watchSL, watchRichtung, watchTp1, watchTp2, watchTp3, watchTp4, setValue])

  const hasTp = (v: unknown) => v !== null && v !== undefined && !isNaN(Number(v)) && Number(v) > 0
  const activeCount = [watchTp1, watchTp2, watchTp3, watchTp4].filter(hasTp).length
  const weightSum = (Number(tpGewichtung.tp1) || 0) + (Number(tpGewichtung.tp2) || 0) + (Number(tpGewichtung.tp3) || 0) + (Number(tpGewichtung.tp4) || 0)

  const distributeEvenly = useCallback(() => {
    const active = [hasTp(watchTp1), hasTp(watchTp2), hasTp(watchTp3), hasTp(watchTp4)]
    const count = active.filter(Boolean).length
    if (count === 0) return
    const each = Math.floor(100 / count)
    const remainder = 100 - each * count
    let firstAssigned = false
    setTpGewichtung(() => {
      const next: Record<string, number | string> = { tp1: '', tp2: '', tp3: '', tp4: '' }
      ;['tp1', 'tp2', 'tp3', 'tp4'].forEach((key, i) => {
        if (active[i]) {
          next[key] = each + (!firstAssigned ? remainder : 0)
          firstAssigned = true
        }
      })
      return next
    })
  }, [watchTp1, watchTp2, watchTp3, watchTp4])

  const prevActiveCountRef = useRef(activeCount)
  useEffect(() => {
    if (prevActiveCountRef.current !== activeCount) {
      prevActiveCountRef.current = activeCount
      distributeEvenly()
    }
  }, [activeCount, distributeEvenly])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const url = await uploadChartImage(formData)
      setImageUrl(url)
      setImagePreview(url)
      toast.success('Bild hochgeladen')
    } catch (err: any) {
      toast.error(err?.message ?? 'Upload fehlgeschlagen')
      setImagePreview(imageUrl)
    } finally {
      setIsUploading(false)
    }
  }

  async function handleRemoveImage() {
    if (imageUrl) {
      try {
        await deleteChartImage(imageUrl)
      } catch {
        // ignore delete errors
      }
    }
    setImageUrl(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function onSubmit(values: TradeSchemaValues) {
    if (!assetName.trim()) {
      toast.error('Bezeichnung darf nicht leer sein')
      return
    }
    setIsSubmitting(true)
    try {
      const payload = {
        ...values,
        asset_name: assetName.trim(),
        gewichtung: 1.0,
        manuell_getrackt: false,
        tp1_gewichtung: tpGewichtung.tp1 !== '' ? Number(tpGewichtung.tp1) / 100 : null,
        tp2_gewichtung: tpGewichtung.tp2 !== '' ? Number(tpGewichtung.tp2) / 100 : null,
        tp3_gewichtung: tpGewichtung.tp3 !== '' ? Number(tpGewichtung.tp3) / 100 : null,
        tp4_gewichtung: tpGewichtung.tp4 !== '' ? Number(tpGewichtung.tp4) / 100 : null,
        stop_loss: values.stop_loss ?? null,
        tp2: values.tp2 ?? null,
        tp3: values.tp3 ?? null,
        tp4: values.tp4 ?? null,
        risiko_reward_min: values.risiko_reward_min ?? null,
        risiko_reward_max: values.risiko_reward_max ?? null,
        zeiteinheit: values.zeiteinheit ?? null,
        dauer_erwartung: values.dauer_erwartung ?? null,
        bemerkungen: values.bemerkungen ?? null,
        analyse_text: values.analyse_text ?? null,
        tradingview_symbol: tvSymbol || null,
        chart_bild_url: imageUrl,
      }
      // Parse entry points for saving
      const parsedEntries = entryPoints
        .map(e => ({ preis: parseFloat(e.preis), anteil: parseFloat(e.anteil) / 100 }))
        .filter(e => !isNaN(e.preis) && e.preis > 0 && !isNaN(e.anteil) && e.anteil > 0)

      if (setup) {
        if (setup.chart_bild_url && setup.chart_bild_url !== imageUrl) {
          await deleteChartImage(setup.chart_bild_url)
        }
        await updateTrade(setup.id, payload)
        // Only save entries if the user has defined entry points
        if (parsedEntries.length > 0 || (setup.entries && setup.entries.length > 0)) {
          await saveTradeEntries(setup.id, parsedEntries)
        }
        toast.success('Setup aktualisiert')
      } else {
        const newTradeId = await createTrade(payload as any)
        if (parsedEntries.length > 0) {
          await saveTradeEntries(newTradeId, parsedEntries)
        }
        toast.success('Setup erstellt')
      }
      onSuccess()
    } catch (err: any) {
      toast.error(err?.message ?? 'Fehler beim Speichern')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Row 1: Instrument + Ticker */}
      <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
        <Field label="Instrument *" error={errors.asset?.message}>
          <InstrumentSearch
            value={assetValue}
            placeholder="z.B. Apple, DAX, Gold, BTC, EUR/USD..."
            onSelect={async (instrument) => {
              setAssetValue(instrument.name)
              setValue('asset', instrument.symbol, { shouldValidate: true })
              setAssetName(instrument.name)
              setValue('asset_klasse', instrument.asset_klasse)
              setSelectedAssetKlasse(instrument.asset_klasse)

              setIsFetchingPrice(true)
              try {
                const price = await fetchInstrumentPrice(instrument.api, instrument.type)
                if (price !== null) {
                  setValue('aktueller_kurs', price)
                }
              } catch {
                // silently ignore
              } finally {
                setIsFetchingPrice(false)
              }
            }}
            onManualInput={(val) => {
              setAssetValue(val)
              setValue('asset', val, { shouldValidate: true })
              setAssetName(val)
            }}
          />
        </Field>
        <Field label="Ticker">
          <Input
            value={watch('asset') || ''}
            readOnly
            tabIndex={-1}
            className="w-[120px] bg-muted text-muted-foreground cursor-default"
          />
        </Field>
      </div>

      {/* TradingView Symbol */}
      <Field label="TradingView-Symbol (für Chart-Link in E-Mail)">
        <div className="relative">
          {tvSymbol ? (
            <div className="flex items-center gap-2">
              <a
                href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 border border-blue-200 px-3 py-1.5 text-sm font-mono font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
              >
                {tvSymbol}
                <span className="text-xs font-normal text-blue-500">↗</span>
              </a>
              <button
                type="button"
                onClick={() => { setTvSymbol(''); setTvSearch('') }}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Ändern
              </button>
            </div>
          ) : (
            <>
              <Input
                placeholder="z.B. Gold, XAUUSD, DAX..."
                value={tvSearch}
                onChange={(e) => handleTvSearch(e.target.value)}
              />
              {tvSearching && (
                <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
              )}
              {tvResults.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-[200px] overflow-y-auto">
                  {tvResults.map((r) => (
                    <button
                      key={r.fullSymbol}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between"
                      onClick={() => {
                        setTvSymbol(r.fullSymbol)
                        setTvSearch('')
                        setTvResults([])
                      }}
                    >
                      <div>
                        <span className="font-mono font-semibold">{r.fullSymbol}</span>
                        <span className="ml-2 text-muted-foreground">{r.description}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{r.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </Field>

      {/* Row 2: Bezeichnung, Klasse, Richtung, Profil */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-3 items-end">
        <Field label="Bezeichnung *">
          <Input
            className="max-w-[200px]"
            placeholder="z.B. Ferrari, S&P 500..."
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
          />
        </Field>
        <Field label="Asset-Klasse *" error={errors.asset_klasse?.message}>
          <Select
            value={selectedAssetKlasse}
            onValueChange={(v) => {
              setValue('asset_klasse', v as any)
              setSelectedAssetKlasse(v as any)
            }}
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
        <Field label="Richtung *" error={errors.richtung?.message}>
          <Select
            defaultValue={setup?.richtung ?? 'LONG'}
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
        <Field label="Profil *" error={errors.profil?.message}>
          <Select
            defaultValue={setup?.profil ?? 'MB'}
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

      {/* Row 3: Datum, Aktueller Kurs, Einstiegspreis, Stop Loss */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Datum *" error={errors.datum_eroeffnung?.message}>
          <Input
            type="date"
            className="tabular-nums"
            {...register('datum_eroeffnung')}
          />
        </Field>
        <Field label="Aktueller Kurs *" error={errors.aktueller_kurs?.message}>
          <div className="relative">
            <Input
              type="number"
              step="any"
              placeholder="0.00"
              {...register('aktueller_kurs', { valueAsNumber: true })}
            />
            {isFetchingPrice && (
              <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
            )}
          </div>
        </Field>
        <Field label={entryPoints.length > 0 ? 'Mischkurs (auto)' : 'Einstiegspreis *'} error={errors.einstiegspreis?.message}>
          <Input
            type="number"
            step="any"
            placeholder="0.00"
            readOnly={entryPoints.length > 0}
            className={entryPoints.length > 0 ? 'bg-muted text-muted-foreground cursor-default' : ''}
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
      </div>

      {/* Einstiegspunkte */}
      {entryPoints.length > 0 && (
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Einstiegspunkte</Label>
            <button
              type="button"
              onClick={() => setEntryPoints(prev => [...prev, { preis: '', anteil: '' }])}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Plus className="h-3 w-3" />
              Einstieg hinzufügen
            </button>
          </div>
          <div className="space-y-2">
            {entryPoints.map((ep, i) => (
              <div key={i} className="grid grid-cols-[auto_1fr_80px_auto] gap-2 items-center">
                <span className="text-xs font-medium text-muted-foreground w-5">E{i + 1}</span>
                <Input
                  type="number"
                  step="any"
                  placeholder="Kurs"
                  value={ep.preis}
                  onChange={(e) => setEntryPoints(prev => prev.map((p, j) => j === i ? { ...p, preis: e.target.value } : p))}
                />
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    step={1}
                    placeholder="%"
                    value={ep.anteil}
                    onChange={(e) => setEntryPoints(prev => prev.map((p, j) => j === i ? { ...p, anteil: e.target.value } : p))}
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEntryPoints(prev => prev.filter((_, j) => j !== i))}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          {(() => {
            const sum = entryPoints.reduce((s, e) => s + (parseFloat(e.anteil) || 0), 0)
            return (
              <div className="flex items-center justify-between pt-1 border-t border-border/50">
                <span className="text-xs text-muted-foreground">
                  Mischkurs: <span className="font-semibold font-mono">{watchEinstieg ? watchEinstieg.toFixed(2) : '–'}</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Summe:</span>
                  <span className={`text-sm font-semibold tabular-nums ${sum === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {sum}%
                  </span>
                </div>
              </div>
            )
          })()}
        </div>
      )}
      {entryPoints.length === 0 && (
        <button
          type="button"
          onClick={() => setEntryPoints([{ preis: '', anteil: '50' }, { preis: '', anteil: '50' }])}
          className="w-full text-xs text-muted-foreground hover:text-primary border border-dashed rounded-lg py-2 transition-colors"
        >
          <Plus className="h-3 w-3 inline mr-1" />
          Mehrere Einstiegspunkte definieren
        </button>
      )}

      {/* Take-Profit Ziele & Gewichtung */}
      <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Take-Profit-Ziele & Gewichtung</Label>
          <button
            type="button"
            onClick={distributeEvenly}
            className="text-xs text-primary hover:underline"
          >
            Gleichmäßig verteilen
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {([
            { tp: 'tp1' as const, w: 'tp1', label: 'TP1 *', reg: { valueAsNumber: true } },
            { tp: 'tp2' as const, w: 'tp2', label: 'TP2', reg: { setValueAs: asNullableNum } },
            { tp: 'tp3' as const, w: 'tp3', label: 'TP3', reg: { setValueAs: asNullableNum } },
            { tp: 'tp4' as const, w: 'tp4', label: 'TP4', reg: { setValueAs: asNullableNum } },
          ]).map(({ tp, w, label, reg }) => (
            <div key={tp} className="space-y-2">
              <Field label={label} error={errors[tp]?.message}>
                <Input
                  type="number"
                  step="any"
                  placeholder="Kurs"
                  {...register(tp, reg)}
                />
              </Field>
              <Field label="Anteil %">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  placeholder="%"
                  value={tpGewichtung[w] as number}
                  onChange={(e) =>
                    setTpGewichtung((prev) => ({
                      ...prev,
                      [w]: e.target.value === '' ? '' : Number(e.target.value),
                    }))
                  }
                />
              </Field>
            </div>
          ))}
        </div>
        {activeCount > 0 && (
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/50">
            <span className="text-xs text-muted-foreground">Summe:</span>
            <span className={`text-sm font-semibold tabular-nums ${weightSum === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {weightSum}%
            </span>
            {weightSum === 100 && <span className="text-emerald-600 text-xs">&#10003;</span>}
            {weightSum !== 100 && (
              <span className="text-amber-600 text-xs">(idealerweise 100%)</span>
            )}
          </div>
        )}
      </div>

      {/* Row 5: CRV, Zeiteinheit, Dauer */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="CRV min (auto)" error={errors.risiko_reward_min?.message}>
          <Input
            type="number"
            step="any"
            placeholder="–"
            {...register('risiko_reward_min', { setValueAs: asNullableNum })}
          />
        </Field>
        <Field label="CRV max (auto)" error={errors.risiko_reward_max?.message}>
          <Input
            type="number"
            step="any"
            placeholder="–"
            {...register('risiko_reward_max', { setValueAs: asNullableNum })}
          />
        </Field>
        <Field label="Zeiteinheit" error={errors.zeiteinheit?.message}>
          <Select
            defaultValue={setup?.zeiteinheit ?? '4H'}
            onValueChange={(v) => setValue('zeiteinheit', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ZEITEINHEITEN.map((z) => (
                <SelectItem key={z} value={z}>{z}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Erwartete Dauer" error={errors.dauer_erwartung?.message}>
          <Input
            placeholder="z.B. 2-4 Wochen"
            {...register('dauer_erwartung', { setValueAs: asNullableStr })}
          />
        </Field>
      </div>

      {/* Chart Image Upload */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Chart-Bild</Label>
        {imagePreview ? (
          <div className="relative rounded-md border overflow-hidden bg-muted">
            <div className="relative w-full aspect-video">
              <Image
                src={imagePreview}
                alt="Chart-Vorschau"
                fill
                className="object-contain"
                unoptimized={imagePreview.startsWith('data:')}
              />
            </div>
            <div className="absolute top-2 right-2 flex gap-1">
              {isUploading && (
                <span className="bg-background/80 text-xs px-2 py-1 rounded">
                  Hochladen...
                </span>
              )}
              <button
                type="button"
                onClick={handleRemoveImage}
                className="bg-background/80 hover:bg-destructive hover:text-white p-1.5 rounded-md transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center w-full h-32 rounded-md border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-pointer"
          >
            <ImageIcon className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <span className="text-sm text-muted-foreground">
              Chart-Bild hochladen
            </span>
            <span className="text-xs text-muted-foreground/60 mt-0.5">
              JPG, PNG oder WebP (max. 10MB)
            </span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleImageUpload}
        />
        {imagePreview && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-1.5"
          >
            <Upload className="h-3.5 w-3.5" />
            Bild ersetzen
          </Button>
        )}
      </div>

      {/* Bemerkungen (kurz) */}
      <Field label="Bemerkungen (kurz)" error={errors.bemerkungen?.message}>
        <textarea
          rows={3}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          placeholder="z.B. SL auf Einstand nachziehen sobald TP1 erreicht..."
          {...register('bemerkungen', { setValueAs: asNullableStr })}
        />
      </Field>

      {/* Analyse (lang) */}
      <Field label="Ausführliche Analyse (für E-Mail)" error={errors.analyse_text?.message}>
        <textarea
          rows={12}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-[200px]"
          placeholder="Detaillierte Marktanalyse, technische Einschätzung, Hintergründe..."
          {...register('analyse_text', { setValueAs: asNullableStr })}
        />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={isSubmitting || isUploading}>
          {isSubmitting ? 'Speichern...' : setup ? 'Aktualisieren' : 'Erstellen'}
        </Button>
      </div>
    </form>
  )
}
