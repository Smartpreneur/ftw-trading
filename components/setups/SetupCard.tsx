'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/formatters'
import { deleteTrade, updateTrade, deleteChartImage } from '@/lib/actions'
import { sendEilmeldung } from '@/lib/email/send-alert'
import { updateAssetPrice } from '@/lib/price-actions'
import { SetupDialog } from './SetupDialog'
import { Clock, TrendingDown, TrendingUp, BarChart3, Pencil, Trash2, Play, Check, Mail, Eye } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [sendEmail, setSendEmail] = useState(false)

  const date = new Date(setup.datum_eroeffnung)
  const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`

  async function handleConvertToTrade() {
    setIsConverting(true)
    try {
      if (sendEmail) {
        const result = await sendEilmeldung(setup.id)
        if (!result.ok) {
          toast.error(result.error ?? 'E-Mail-Versand fehlgeschlagen')
          setIsConverting(false)
          return
        }
        toast.success('Eilmeldung versendet')
      }
      await updateTrade(setup.id, { status: 'Aktiv', published_at: new Date().toISOString() })
      // Fetch current price immediately so it shows in active trades
      await updateAssetPrice(setup.id, setup.asset).catch(() => {})
      toast.success('Trade veröffentlicht')
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message ?? 'Fehler beim Veröffentlichen')
    } finally {
      setIsConverting(false)
    }
  }

  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  async function handlePreview() {
    setIsLoadingPreview(true)
    try {
      const res = await fetch(`/api/email-preview?trade_id=${setup.trade_id}`, { credentials: 'include' })
      if (res.ok) {
        const html = await res.text()
        setPreviewHtml(html)
        setShowPreview(true)
      } else {
        toast.error('Vorschau konnte nicht geladen werden')
      }
    } catch {
      toast.error('Fehler beim Laden der Vorschau')
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const [isSendingTest, setIsSendingTest] = useState(false)
  async function handleTestEmail() {
    setIsSendingTest(true)
    try {
      const result = await sendEilmeldung(setup.id)
      if (result.ok) {
        toast.success('Test-Mail versendet')
      } else {
        toast.error(result.error ?? 'Fehler beim Versenden')
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Fehler beim Versenden')
    } finally {
      setIsSendingTest(false)
    }
  }

  async function handleDelete() {
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
              <div className="flex gap-0.5">
                <SetupDialog
                  setup={setup}
                  trigger={
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
                <Popover open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-3" side="bottom" align="end">
                    <p className="text-sm font-medium mb-1">Setup löschen?</p>
                    <p className="text-xs text-muted-foreground mb-3">Kann nicht rückgängig gemacht werden.</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1 h-7 text-xs"
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Löscht...' : 'Löschen'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-xs"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isDeleting}
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
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
          <div
            className="text-xs text-muted-foreground pt-2 border-t [&_p]:mb-1 last:[&_p]:mb-0"
            dangerouslySetInnerHTML={{ __html: setup.bemerkungen }}
          />
        )}

        {/* Date */}
        <p className="text-xs text-muted-foreground">
          {formattedDate}
        </p>

        {/* Delete confirmation is now in the Popover next to the trash icon */}

        {/* E-Mail Preview Modal */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden p-0">
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle>E-Mail Vorschau</DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-4 flex items-center gap-3">
              <div className="flex flex-col items-center gap-0.5">
                <Switch
                  checked={sendEmail}
                  onCheckedChange={setSendEmail}
                />
                <span className="text-[10px] text-muted-foreground">E-Mail</span>
              </div>
              <Button
                onClick={() => {
                  setShowPreview(false)
                  handleConvertToTrade()
                }}
                disabled={isConverting}
                size="sm"
                className="whitespace-nowrap"
              >
                <Play className="h-3.5 w-3.5 mr-1.5" />
                {isConverting
                  ? 'Wird veröffentlicht...'
                  : sendEmail
                    ? 'Veröffentlichen & E-Mail senden'
                    : 'Trade veröffentlichen'}
              </Button>
            </div>
            {previewHtml && (
              <iframe
                srcDoc={previewHtml}
                className="w-full border-t"
                style={{ height: 'calc(85vh - 120px)' }}
                title="E-Mail Vorschau"
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Convert to Trade button - only for drafts, admin only */}
        {isAdmin && setup.status === 'Entwurf' && (
          <div className="space-y-3 mt-3 pt-3 border-t">
            <Button
              onClick={handlePreview}
              disabled={isLoadingPreview}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              {isLoadingPreview ? 'Wird geladen...' : 'E-Mail Vorschau'}
            </Button>
            <Button
              onClick={handleTestEmail}
              disabled={isSendingTest}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <Mail className="h-3.5 w-3.5 mr-1.5" />
              {isSendingTest ? 'Wird gesendet...' : 'Nur Test-Mail senden'}
            </Button>
            <div
              className={`flex items-center justify-between rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                sendEmail ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50'
              }`}
              onClick={() => setSendEmail(!sendEmail)}
            >
              <div className="flex items-center gap-2.5">
                <Mail className={`h-4 w-4 ${sendEmail ? 'text-blue-600' : 'text-muted-foreground'}`} />
                <div>
                  <p className={`text-sm font-medium ${sendEmail ? 'text-blue-900' : 'text-foreground'}`}>
                    Als E-Mail versenden
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {sendEmail ? 'Eilmeldung wird beim Veröffentlichen gesendet' : 'Eilmeldung an Abonnenten senden'}
                  </p>
                </div>
              </div>
              <Switch
                checked={sendEmail}
                onCheckedChange={setSendEmail}
              />
            </div>
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
