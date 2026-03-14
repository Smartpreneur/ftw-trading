'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { tradeSchema, toNullableNumber, toNullableString, type TradeSchemaValues } from '@/lib/schemas'
import { createTrade, updateTrade, uploadChartImage, deleteChartImage } from '@/lib/actions'
import { fetchInstrumentPrice } from '@/lib/price-actions'
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
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react'
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

  const watchTp1 = watch('tp1')
  const watchTp2 = watch('tp2')
  const watchTp3 = watch('tp3')
  const watchTp4 = watch('tp4')
  const watchEinstieg = watch('einstiegspreis')
  const watchSL = watch('stop_loss')
  const watchRichtung = watch('richtung')

  // Auto-calculate CRV from entry, SL and TP targets
  useEffect(() => {
    const entry = Number(watchEinstieg)
    const sl = Number(watchSL)
    const richtung = watchRichtung ?? 'LONG'
    if (!entry || !sl || entry <= 0 || sl <= 0) return

    const risk = richtung === 'LONG' ? entry - sl : sl - entry
    if (risk <= 0) return

    const crvValues = [watchTp1, watchTp2, watchTp3, watchTp4]
      .map(Number)
      .filter((tp) => tp > 0)
      .map((tp) => {
        const reward = richtung === 'LONG' ? tp - entry : entry - tp
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
    setIsSubmitting(true)
    try {
      const payload = {
        ...values,
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
        chart_bild_url: imageUrl,
      }
      if (setup) {
        if (setup.chart_bild_url && setup.chart_bild_url !== imageUrl) {
          await deleteChartImage(setup.chart_bild_url)
        }
        await updateTrade(setup.id, payload)
        toast.success('Setup aktualisiert')
      } else {
        await createTrade(payload as any)
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
      {/* Row 1: Instrument-Suche (volle Breite) */}
      <Field label="Instrument *" error={errors.asset?.message}>
        <InstrumentSearch
          value={assetValue}
          placeholder="z.B. Apple, DAX, Gold, BTC, EUR/USD..."
          onSelect={async (instrument) => {
            setAssetValue(instrument.name)
            setValue('asset', instrument.symbol, { shouldValidate: true })
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
          }}
        />
      </Field>

      {/* Row 2: Klasse, Richtung, Profil */}
      <div className="grid grid-cols-3 gap-3">
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

      {/* Row 3: Datum, Aktueller Kurs, Status */}
      <div className="grid grid-cols-3 gap-3">
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
        {/* Status is always 'Entwurf' for setups */}
      </div>

      {/* Row 4: Einstiegspreis, Stop Loss */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Einstiegspreis *" error={errors.einstiegspreis?.message}>
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
      </div>

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

      {/* Bemerkungen */}
      <Field label="Bemerkungen" error={errors.bemerkungen?.message}>
        <textarea
          rows={6}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          placeholder="Setup-Analyse, Positionsmanagement, besondere Hinweise..."
          {...register('bemerkungen', { setValueAs: asNullableStr })}
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
