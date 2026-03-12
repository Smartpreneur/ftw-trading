'use client'

import { useState } from 'react'
import { createTradeNote, deleteTradeNote } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { TradeNote } from '@/lib/types'

interface TradeNotesProps {
  tradeFk: string
  notes: TradeNote[]
}

export function TradeNotes({ tradeFk, notes }: TradeNotesProps) {
  const [datum, setDatum] = useState(new Date().toISOString().split('T')[0])
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const sorted = [...notes].sort((a, b) => b.datum.localeCompare(a.datum))

  async function handleAdd() {
    if (!text.trim()) return
    setSaving(true)
    try {
      await createTradeNote({ trade_fk: tradeFk, datum, text: text.trim() })
      setText('')
      toast.success('Notiz gespeichert')
    } catch (err: any) {
      toast.error(err?.message ?? 'Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteTradeNote(id)
      toast.success('Notiz gelöscht')
    } catch (err: any) {
      toast.error(err?.message ?? 'Fehler beim Löschen')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Verlauf</p>

      {sorted.length === 0 ? (
        <p className="text-xs text-muted-foreground">Noch keine Einträge.</p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((note) => (
            <li key={note.id} className="flex items-start gap-2 text-sm">
              <span className="shrink-0 font-mono text-xs text-muted-foreground pt-0.5 w-24">
                {note.datum}
              </span>
              <span className="flex-1 text-foreground">{note.text}</span>
              <button
                type="button"
                onClick={() => handleDelete(note.id)}
                disabled={deletingId === note.id}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2 pt-1">
        <Input
          type="date"
          value={datum}
          onChange={(e) => setDatum(e.target.value)}
          className="w-36 text-xs"
        />
        <Input
          placeholder="Kommentar..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
          className="text-xs"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAdd}
          disabled={saving || !text.trim()}
        >
          {saving ? '…' : '+ Hinzufügen'}
        </Button>
      </div>
    </div>
  )
}
