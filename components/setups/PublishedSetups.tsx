'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/trades/StatusBadge'
import { DirectionBadge } from '@/components/trades/DirectionBadge'
import { SetupDialog } from './SetupDialog'
import { formatPrice } from '@/lib/formatters'
import { TRADER_NAMES } from '@/lib/constants'
import { Mail, Eye, ChevronDown, ChevronUp } from 'lucide-react'
import type { Trade } from '@/lib/types'

interface PublishedSetupsProps {
  trades: Trade[]
}

export function PublishedSetups({ trades }: PublishedSetupsProps) {
  const [expanded, setExpanded] = useState(false)

  if (trades.length === 0) return null

  const visible = expanded ? trades : trades.slice(0, 5)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Veröffentlichte Setups</h2>
        <span className="text-xs text-muted-foreground">{trades.length} Setups</span>
      </div>

      <div className="space-y-2">
        {visible.map((trade) => {
          const publishedAt = trade.updated_at || trade.created_at
          const publishDate = new Date(publishedAt)
          const dateStr = `${publishDate.getDate().toString().padStart(2, '0')}.${(publishDate.getMonth() + 1).toString().padStart(2, '0')}.${publishDate.getFullYear()}`
          const timeStr = `${publishDate.getHours().toString().padStart(2, '0')}:${publishDate.getMinutes().toString().padStart(2, '0')}`

          return (
            <SetupDialog
              key={trade.id}
              setup={trade}
              readOnly
              trigger={
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {trade.richtung && <DirectionBadge direction={trade.richtung} />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{trade.asset_name || trade.asset}</span>
                            <span className="text-xs text-muted-foreground font-mono">{trade.asset}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{TRADER_NAMES[trade.profil] ?? trade.profil}</span>
                            <span>·</span>
                            <span>Einstieg: {formatPrice(trade.einstiegspreis)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {trade.eilmeldung_sent_at && (
                          <div className="flex items-center gap-1 text-xs text-blue-600" title={`E-Mail versendet am ${new Date(trade.eilmeldung_sent_at).toLocaleString('de-DE')}`}>
                            <Mail className="h-3 w-3" />
                            <span>Versendet</span>
                          </div>
                        )}
                        <div className="text-right">
                          <StatusBadge status={trade.status} />
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {dateStr} · {timeStr}
                          </p>
                        </div>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              }
            />
          )
        })}
      </div>

      {trades.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? 'Weniger anzeigen' : `Alle ${trades.length} anzeigen`}
        </button>
      )}
    </div>
  )
}
