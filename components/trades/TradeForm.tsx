'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { tradeSchema, toNullableNumber, toNullableString, type TradeSchemaValues } from '@/lib/schemas'
import { createTrade, updateTrade } from '@/lib/actions'
import { ASSET_CLASSES, TRADE_DIRECTIONS, TRADE_STATUSES } from '@/lib/constants'
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
          trade_id: trade.trade_id ?? undefined,
          datum_eroeffnung: trade.datum_eroeffnung,
          asset: trade.asset,
          asset_klasse: trade.asset_klasse,
          richtung: trade.richtung,
          einstiegspreis: trade.einstiegspreis,
          stop_loss: trade.stop_loss ?? undefined,
          tp1: trade.tp1 ?? undefined,
          tp2: trade.tp2 ?? undefined,
          tp3: trade.tp3 ?? undefined,
          tp4: trade.tp4 ?? undefined,
          status: trade.status,
          datum_schliessung: trade.datum_schliessung ?? undefined,
          ausstiegspreis: trade.ausstiegspreis ?? undefined,
          bemerkungen: trade.bemerkungen ?? undefined,
        }
      : {
          status: 'Aktiv',
          richtung: 'LONG',
          asset_klasse: 'Index',
          datum_eroeffnung: new Date().toISOString().split('T')[0],
        },
  })

  const status = watch('status')

  async function onSubmit(values: TradeSchemaValues) {
    setIsSubmitting(true)
    try {
      if (trade) {
        await updateTrade(trade.id, values as any)
        toast.success('Trade aktualisiert')
      } else {
        await createTrade(values as any)
        toast.success('Trade erstellt')
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
      {/* Row 1 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Trade-ID" error={errors.trade_id?.message}>
          <Input
            placeholder="FTW001"
            {...register('trade_id', { setValueAs: asNullableStr })}
          />
        </Field>
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

      {/* TP targets */}
      <div className="grid grid-cols-4 gap-3">
        {(['tp1', 'tp2', 'tp3', 'tp4'] as const).map((tp, i) => (
          <Field key={tp} label={`TP${i + 1}`} error={errors[tp]?.message}>
            <Input
              type="number"
              step="any"
              placeholder="0.00"
              {...register(tp, { setValueAs: asNullableNum })}
            />
          </Field>
        ))}
      </div>

      {/* Closing fields */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Schließungsdatum" error={errors.datum_schliessung?.message}>
          <Input
            type="date"
            disabled={status === 'Aktiv'}
            {...register('datum_schliessung', { setValueAs: asNullableStr })}
          />
        </Field>
        <Field label="Ausstiegspreis" error={errors.ausstiegspreis?.message}>
          <Input
            type="number"
            step="any"
            placeholder="0.00"
            disabled={status === 'Aktiv'}
            {...register('ausstiegspreis', { setValueAs: asNullableNum })}
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
