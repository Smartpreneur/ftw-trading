'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { tradeCloseSchema, type TradeCloseSchemaValues } from '@/lib/schemas'
import { createTradeClose, updateTradeClose, deleteTradeClose } from '@/lib/actions'
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
import type { TradeClose } from '@/lib/types'
import { toast } from 'sonner'
import { useState, useRef } from 'react'
import { Trash2 } from 'lucide-react'

const CLOSE_TYPES = ['TP1', 'TP2', 'TP3', 'TP4', 'SL', 'Manuell'] as const

interface TradeCloseFormProps {
  tradeFk: string      // UUID of the parent trade
  close?: TradeClose   // undefined = create mode
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

export function TradeCloseForm({ tradeFk, close, onSuccess }: TradeCloseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const submittingRef = useRef(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TradeCloseSchemaValues>({
    resolver: zodResolver(tradeCloseSchema),
    defaultValues: close
      ? {
          typ: close.typ ?? 'TP1',
          datum: close.datum,
          ausstiegspreis: close.ausstiegspreis ?? undefined,
          anteil: close.anteil != null ? Math.round(close.anteil * 100) : undefined,
          bemerkungen: close.bemerkungen ?? undefined,
        }
      : {
          typ: 'TP1',
          datum: new Date().toISOString().split('T')[0],
        },
  })

  async function onSubmit(values: TradeCloseSchemaValues) {
    if (submittingRef.current) return
    submittingRef.current = true
    setIsSubmitting(true)
    try {
      const payload = {
        ...values,
        trade_fk: tradeFk,
        anteil: values.anteil / 100,
      }
      if (close) {
        await updateTradeClose(close.id, payload)
        toast.success('Schließung aktualisiert')
      } else {
        await createTradeClose(payload as any)
        toast.success('Schließung gespeichert')
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

  async function handleDelete() {
    if (!close) return
    setIsDeleting(true)
    try {
      await deleteTradeClose(close.id)
      toast.success('Schließung gelöscht')
      onSuccess()
    } catch (err: any) {
      toast.error(err?.message ?? 'Fehler beim Löschen')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onValidationError)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Typ *" error={errors.typ?.message}>
          <Select
            defaultValue={close?.typ ?? 'TP1'}
            onValueChange={(v) => setValue('typ', v as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLOSE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Datum *" error={errors.datum?.message}>
          <Input type="date" {...register('datum')} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Ausstiegspreis" error={errors.ausstiegspreis?.message}>
          <Input
            type="number"
            step="any"
            placeholder="0.00"
            {...register('ausstiegspreis', { valueAsNumber: true })}
          />
        </Field>
        <Field label="Anteil (%)" error={errors.anteil?.message}>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min="1"
              max="100"
              step="1"
              placeholder="50"
              {...register('anteil', { valueAsNumber: true })}
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        </Field>
      </div>

      <Field label="Bemerkungen" error={errors.bemerkungen?.message}>
        <Input placeholder="Optional" {...register('bemerkungen')} />
      </Field>

      <div className="flex items-center justify-between gap-2 pt-1">
        {close ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            {isDeleting ? 'Löschen…' : 'Löschen'}
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? 'Speichern…' : 'Speichern'}
        </Button>
      </div>
    </form>
  )
}
