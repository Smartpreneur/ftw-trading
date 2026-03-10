'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { setupSchema, toNullableNumber, toNullableString, type SetupSchemaValues } from '@/lib/schemas'
import { createSetup, updateSetup, uploadChartImage, deleteChartImage } from '@/lib/setup-actions'
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
import type { TradeSetup } from '@/lib/types'
import { toast } from 'sonner'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface SetupFormProps {
  setup?: TradeSetup
  onSuccess: () => void
}

const SETUP_STATUSES = ['Aktiv', 'Getriggert', 'Abgelaufen'] as const
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

function getBerlinNow(): string {
  return new Date()
    .toLocaleString('sv-SE', { timeZone: 'Europe/Berlin' })
    .replace(' ', 'T')
    .slice(0, 16)
}

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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SetupSchemaValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: setup
      ? {
          asset: setup.asset,
          asset_klasse: setup.asset_klasse,
          datum: setup.datum.slice(0, 16),
          aktueller_kurs: setup.aktueller_kurs,
          richtung: setup.richtung,
          einstiegskurs: setup.einstiegskurs,
          stop_loss: setup.stop_loss ?? undefined,
          tp1: setup.tp1,
          tp2: setup.tp2 ?? undefined,
          tp3: setup.tp3 ?? undefined,
          tp4: setup.tp4 ?? undefined,
          tp1_gewichtung: setup.tp1_gewichtung ?? undefined,
          tp2_gewichtung: setup.tp2_gewichtung ?? undefined,
          tp3_gewichtung: setup.tp3_gewichtung ?? undefined,
          tp4_gewichtung: setup.tp4_gewichtung ?? undefined,
          risiko_reward_min: setup.risiko_reward_min ?? undefined,
          risiko_reward_max: setup.risiko_reward_max ?? undefined,
          zeiteinheit: setup.zeiteinheit ?? undefined,
          dauer_erwartung: setup.dauer_erwartung ?? undefined,
          status: setup.status,
          bemerkungen: setup.bemerkungen ?? undefined,
          profil: setup.profil,
        }
      : {
          status: 'Aktiv',
          richtung: 'LONG',
          asset_klasse: 'Index',
          profil: 'MB',
          datum: getBerlinNow(),
          zeiteinheit: '4H',
          tp1_gewichtung: 100,
        },
  })

  // Watch TP values to manage weights
  const watchTp1 = watch('tp1')
  const watchTp2 = watch('tp2')
  const watchTp3 = watch('tp3')
  const watchTp4 = watch('tp4')
  const watchW1 = watch('tp1_gewichtung')
  const watchW2 = watch('tp2_gewichtung')
  const watchW3 = watch('tp3_gewichtung')
  const watchW4 = watch('tp4_gewichtung')

  const hasTp = (v: unknown) => v !== null && v !== undefined && !isNaN(Number(v)) && Number(v) > 0
  const activeCount = [watchTp1, watchTp2, watchTp3, watchTp4].filter(hasTp).length
  const weightSum = (watchW1 ?? 0) + (watchW2 ?? 0) + (watchW3 ?? 0) + (watchW4 ?? 0)

  const distributeEvenly = useCallback(() => {
    const active = [hasTp(watchTp1), hasTp(watchTp2), hasTp(watchTp3), hasTp(watchTp4)]
    const count = active.filter(Boolean).length
    if (count === 0) return
    const each = Math.floor(100 / count)
    const remainder = 100 - each * count
    const keys = ['tp1_gewichtung', 'tp2_gewichtung', 'tp3_gewichtung', 'tp4_gewichtung'] as const
    let firstAssigned = false
    keys.forEach((key, i) => {
      if (active[i]) {
        const w = each + (!firstAssigned ? remainder : 0)
        setValue(key, w)
        firstAssigned = true
      } else {
        setValue(key, null)
      }
    })
  }, [watchTp1, watchTp2, watchTp3, watchTp4, setValue])

  // Auto-distribute when TP count changes
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

  async function onSubmit(values: SetupSchemaValues) {
    setIsSubmitting(true)
    try {
      const formData = {
        ...values,
        stop_loss: values.stop_loss ?? null,
        tp2: values.tp2 ?? null,
        tp3: values.tp3 ?? null,
        tp4: values.tp4 ?? null,
        tp1_gewichtung: values.tp1_gewichtung ?? null,
        tp2_gewichtung: values.tp2_gewichtung ?? null,
        tp3_gewichtung: values.tp3_gewichtung ?? null,
        tp4_gewichtung: values.tp4_gewichtung ?? null,
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
        await updateSetup(setup.id, formData)
        toast.success('Setup aktualisiert')
      } else {
        await createSetup(formData)
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label="Datum *" error={errors.datum?.message}>
          <Input type="datetime-local" {...register('datum')} />
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
        <Field label="Status *" error={errors.status?.message}>
          <Select
            defaultValue={setup?.status ?? 'Aktiv'}
            onValueChange={(v) => setValue('status', v as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SETUP_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      {/* Row 4: Einstiegskurs, Stop Loss */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Einstiegskurs *" error={errors.einstiegskurs?.message}>
          <Input
            type="number"
            step="any"
            placeholder="0.00"
            {...register('einstiegskurs', { valueAsNumber: true })}
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
            Gleichm. verteilen
          </button>
        </div>
        <div className="space-y-2">
          {/* TP1 */}
          <div className="grid grid-cols-[1fr_100px] gap-3 items-end">
            <Field label="TP1 (Pflicht)" error={errors.tp1?.message}>
              <Input
                type="number"
                step="any"
                placeholder="Zielpreis"
                {...register('tp1', { valueAsNumber: true })}
              />
            </Field>
            <Field label="Anteil %" error={errors.tp1_gewichtung?.message}>
              <Input
                type="number"
                min={0}
                max={100}
                step={5}
                placeholder="%"
                {...register('tp1_gewichtung', { setValueAs: asNullableNum })}
              />
            </Field>
          </div>
          {/* TP2 */}
          <div className="grid grid-cols-[1fr_100px] gap-3 items-end">
            <Field label="TP2" error={errors.tp2?.message}>
              <Input
                type="number"
                step="any"
                placeholder="Zielpreis"
                {...register('tp2', { setValueAs: asNullableNum })}
              />
            </Field>
            <Field label="Anteil %" error={errors.tp2_gewichtung?.message}>
              <Input
                type="number"
                min={0}
                max={100}
                step={5}
                placeholder="%"
                {...register('tp2_gewichtung', { setValueAs: asNullableNum })}
              />
            </Field>
          </div>
          {/* TP3 */}
          <div className="grid grid-cols-[1fr_100px] gap-3 items-end">
            <Field label="TP3" error={errors.tp3?.message}>
              <Input
                type="number"
                step="any"
                placeholder="Zielpreis"
                {...register('tp3', { setValueAs: asNullableNum })}
              />
            </Field>
            <Field label="Anteil %" error={errors.tp3_gewichtung?.message}>
              <Input
                type="number"
                min={0}
                max={100}
                step={5}
                placeholder="%"
                {...register('tp3_gewichtung', { setValueAs: asNullableNum })}
              />
            </Field>
          </div>
          {/* TP4 */}
          <div className="grid grid-cols-[1fr_100px] gap-3 items-end">
            <Field label="TP4" error={errors.tp4?.message}>
              <Input
                type="number"
                step="any"
                placeholder="Zielpreis"
                {...register('tp4', { setValueAs: asNullableNum })}
              />
            </Field>
            <Field label="Anteil %" error={errors.tp4_gewichtung?.message}>
              <Input
                type="number"
                min={0}
                max={100}
                step={5}
                placeholder="%"
                {...register('tp4_gewichtung', { setValueAs: asNullableNum })}
              />
            </Field>
          </div>
        </div>
        {/* Summe indicator */}
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/50">
          <span className="text-xs text-muted-foreground">Summe:</span>
          <span className={`text-sm font-semibold tabular-nums ${weightSum === 100 ? 'text-emerald-600' : 'text-destructive'}`}>
            {weightSum}%
          </span>
          {weightSum === 100 && <span className="text-emerald-600 text-xs">&#10003;</span>}
          {weightSum !== 100 && activeCount > 0 && (
            <span className="text-destructive text-xs">(muss 100% sein)</span>
          )}
        </div>
      </div>

      {/* Row 5: CRV, Zeiteinheit, Dauer */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="CRV min" error={errors.risiko_reward_min?.message}>
          <Input
            type="number"
            step="any"
            placeholder="1.5"
            {...register('risiko_reward_min', { setValueAs: asNullableNum })}
          />
        </Field>
        <Field label="CRV max" error={errors.risiko_reward_max?.message}>
          <Input
            type="number"
            step="any"
            placeholder="3.0"
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
          className="flex min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
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
