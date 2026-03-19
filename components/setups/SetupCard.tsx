'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/formatters'
import { deleteTrade, updateTrade, deleteChartImage } from '@/lib/actions'
import { sendEilmeldung } from '@/lib/email/send-alert'
import { SetupDialog } from './SetupDialog'
import { Clock, TrendingDown, TrendingUp, BarChart3, Pencil, Trash2, Play, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'
import type { Trade } from '@/lib/types'

interface SetupCardProps {
  setup: Trade
  isAdmin?: boolean
  devMode?: boolean
}

export function SetupCard({ setup, isAdmin = false, devMode = false }: SetupCardProps) {
  const isLong = setup.richtung === 'LONG'
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [sendEmail, setSendEmail] = useState(false)

  const date = new Date(setup.datum_eroeffnung)
  const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`

  async function handleConvertToTrade() {
    setIsConverting(true)
    try {
      if (sendEmail) {
        await sendEilmeldung(setup.id)
        toast.success('Eilmeldung versendet')
      }
      await updateTrade(setup.id, { status: 'Aktiv' })
      toast.success('Trade veröffentlicht')
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message ?? 'Fehler beim Veröffentlichen')
    } finally {
      setIsConverting(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Setup wirklich löschen?')) return
    setIsDeleting(true)
    try {
      if (setup.chart_bild_url) {
        await deleteChartImage(setup.chart_bild_url)
      }
      await deleteTrade(setup.id)
      toast.success('Setup gelöscht')
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message ?? 'Fehler beim Löschen')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5 flex-1">
            <h3 className="font-semibold text-base leading-tight" title={setup.asset}>{setup.asset_name || setup.asset}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {setup.asset_klasse}
              </Badge>
              <Badge
                variant="outline"
                className="text-xs"
              >
                {setup.status}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {setup.profil}
              </Badge>
            </div>
          </div>
          <div className="flex items-start gap-1">
            {setup.aktueller_kurs != null && (
              <div className="text-right mr-2">
                <p className="text-xs text-muted-foreground">Kurs bei Signal</p>
                <p className="text-base font-bold tabular-nums">{formatPrice(setup.aktueller_kurs)}</p>
              </div>
            )}
            {isAdmin && (
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <SetupDialog
                  setup={setup}
                  trigger={
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Setup Direction & Entry */}
        <div className="space-y-1.5">
          <p className="text-sm">
            <span className="font-medium">Setup:</span>{' '}
            <span className={isLong ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
              {setup.richtung}
            </span>
          </p>
          {setup.entries && setup.entries.length > 1 ? (
            <div className="text-sm space-y-0.5">
              <span className="font-medium">Einstiege:</span>
              {setup.entries
                .sort((a, b) => a.nummer - b.nummer)
                .map((e) => (
                  <div key={e.id} className="flex items-center gap-2 ml-2">
                    <span className="text-xs text-muted-foreground">E{e.nummer}</span>
                    <span className="font-mono font-semibold">{formatPrice(e.preis)}</span>
                    <span className="text-xs text-muted-foreground">{Math.round(e.anteil * 100)}%</span>
                    {e.erreicht_am && <Check className="h-3 w-3 text-emerald-600" />}
                  </div>
                ))}
              <p className="text-xs text-muted-foreground mt-0.5">
                Mischkurs: <span className="font-mono font-semibold">{formatPrice(setup.einstiegspreis)}</span>
              </p>
            </div>
          ) : setup.einstiegspreis != null ? (
            <p className="text-sm">
              <span className="font-medium">Einstieg:</span>{' '}
              <span className="font-mono font-semibold">
                {formatPrice(setup.einstiegspreis)}
              </span>
            </p>
          ) : null}
        </div>

        {/* Take-Profit Levels */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            {isLong ? (
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-emerald-600" />
            )}
            <span>Take-Profit</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {setup.tp1 != null && (
              <div className="bg-emerald-50 rounded-md p-2">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-xs text-muted-foreground">TP1</p>
                  {setup.tp1_gewichtung != null && (
                    <span className="text-[10px] text-muted-foreground font-medium">{Math.round(setup.tp1_gewichtung * 100)}%</span>
                  )}
                </div>
                <p className="font-mono font-semibold text-sm">{formatPrice(setup.tp1)}</p>
              </div>
            )}
            {setup.tp2 !== null && (
              <div className="bg-emerald-50 rounded-md p-2">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-xs text-muted-foreground">TP2</p>
                  {setup.tp2_gewichtung != null && (
                    <span className="text-[10px] text-muted-foreground font-medium">{Math.round(setup.tp2_gewichtung * 100)}%</span>
                  )}
                </div>
                <p className="font-mono font-semibold text-sm">{formatPrice(setup.tp2)}</p>
              </div>
            )}
            {setup.tp3 !== null && (
              <div className="bg-emerald-50 rounded-md p-2">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-xs text-muted-foreground">TP3</p>
                  {setup.tp3_gewichtung != null && (
                    <span className="text-[10px] text-muted-foreground font-medium">{Math.round(setup.tp3_gewichtung * 100)}%</span>
                  )}
                </div>
                <p className="font-mono font-semibold text-sm">{formatPrice(setup.tp3)}</p>
              </div>
            )}
            {setup.tp4 !== null && (
              <div className="bg-emerald-50 rounded-md p-2">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-xs text-muted-foreground">TP4</p>
                  {setup.tp4_gewichtung != null && (
                    <span className="text-[10px] text-muted-foreground font-medium">{Math.round(setup.tp4_gewichtung * 100)}%</span>
                  )}
                </div>
                <p className="font-mono font-semibold text-sm">{formatPrice(setup.tp4)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Stop-Loss */}
        {setup.stop_loss != null && (
          <p className="text-sm">
            <span className="font-medium">SL:</span>{' '}
            <span className="font-mono font-semibold text-rose-600">
              {formatPrice(setup.stop_loss)}
            </span>
          </p>
        )}

        {/* Risk/Reward & Timing */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t text-sm">
          <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
              <BarChart3 className="h-3 w-3" />
              <span>CRV</span>
            </div>
            <p className="font-semibold text-sm">
              {setup.risiko_reward_min != null && setup.risiko_reward_max != null
                ? `${setup.risiko_reward_min.toFixed(1)}-${setup.risiko_reward_max.toFixed(1)}`
                : '–'}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
              <Clock className="h-3 w-3" />
              <span>Zeiteinheit</span>
            </div>
            <p className="font-semibold text-sm">{setup.zeiteinheit || '–'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Dauer</p>
            <p className="font-semibold text-sm">{setup.dauer_erwartung || '–'}</p>
          </div>
        </div>

        {/* Chart Image */}
        {setup.chart_bild_url && (
          <div className="pt-2 border-t">
            <div className="relative w-full aspect-video rounded-md overflow-hidden bg-muted">
              <Image
                src={setup.chart_bild_url}
                alt={`Chart für ${setup.asset_name || setup.asset}`}
                fill
                className="object-contain"
              />
            </div>
          </div>
        )}

        {/* Bemerkungen */}
        {setup.bemerkungen && (
          <p className="text-xs text-muted-foreground pt-2 border-t">
            {setup.bemerkungen}
          </p>
        )}

        {/* Date */}
        <p className="text-xs text-muted-foreground">
          {formattedDate}
        </p>

        {/* Convert to Trade button - only for drafts, admin only */}
        {isAdmin && setup.status === 'Entwurf' && (
          <div className="space-y-2 mt-2">
            {devMode && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Auch als E-Mail senden (Test)
              </label>
            )}
            <Button
              onClick={handleConvertToTrade}
              disabled={isConverting}
              className="w-full"
              size="sm"
            >
              <Play className="h-3.5 w-3.5 mr-1.5" />
              {isConverting
                ? (sendEmail ? 'Wird versendet...' : 'Wird veröffentlicht...')
                : (sendEmail ? 'Veröffentlichen & E-Mail senden' : 'Trade veröffentlichen')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
