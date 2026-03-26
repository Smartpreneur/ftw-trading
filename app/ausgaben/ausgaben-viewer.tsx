'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { FileText, Trash2, Upload, Loader2, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { uploadAusgabe, deleteAusgabe } from '@/lib/ausgaben-actions'
import type { Ausgabe } from '@/lib/ausgaben-actions'

function formatDatum(datum: string): string {
  return format(parseISO(datum), 'dd.MM.yyyy', { locale: de })
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function AusgabenViewer({
  ausgaben,
  isAdmin,
}: {
  ausgaben: Ausgabe[]
  isAdmin: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nrParam = searchParams.get('nr')

  // Determine which issue to show
  const selectedNr = nrParam ? parseInt(nrParam, 10) : null
  const activeIssue = selectedNr
    ? ausgaben.find((a) => a.nummer === selectedNr) ?? ausgaben[0]
    : ausgaben[0]

  const archiveIssues = ausgaben.filter((a) => a.id !== activeIssue?.id)

  return (
    <div className="space-y-6">
      {/* Admin upload form */}
      {isAdmin && <UploadForm />}

      {/* Main viewer */}
      {activeIssue ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            FTW vom {formatDatum(activeIssue.datum)}
          </h2>
          <PdfViewer url={activeIssue.pdf_url} />
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Noch keine Ausgaben vorhanden.
        </div>
      )}

      {/* Chronological list of all issues */}
      {ausgaben.length > 1 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Alle Ausgaben
          </h3>
          <div className="divide-y rounded-lg border overflow-hidden">
            {ausgaben.map((ausgabe) => {
              const isCurrent = ausgabe.id === activeIssue?.id
              return (
                <div key={ausgabe.id} className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      const url = new URL(window.location.href)
                      url.searchParams.set('nr', String(ausgabe.nummer))
                      router.push(url.pathname + url.search)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className={`flex-1 flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                      isCurrent
                        ? 'bg-muted font-semibold text-foreground'
                        : 'hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <span>FTW vom {formatDatum(ausgabe.datum)}</span>
                    {isCurrent && <span className="text-xs text-muted-foreground">(angezeigt)</span>}
                  </button>
                  {isAdmin && (
                    <DeleteButton ausgabe={ausgabe} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── PDF Viewer ──────────────────────────────────────────────────

function PdfViewer({ url }: { url: string }) {
  const [loading, setLoading] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // navpanes=0 hides sidebar by default, toolbar=0 removes Chrome's toolbar (incl. Google Drive button)
  const pdfUrl = `${url}#navpanes=0&toolbar=0`

  function toggleFullscreen() {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setFullscreen(true)
    } else {
      document.exitFullscreen()
      setFullscreen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative rounded-lg border bg-muted/30 overflow-hidden group">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
      {/* Fullscreen toggle */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 z-20 p-2 rounded-lg bg-background/80 backdrop-blur border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
        title={fullscreen ? 'Vollbild beenden' : 'Vollbild'}
      >
        {fullscreen ? (
          <Minimize2 className="h-4 w-4" />
        ) : (
          <Maximize2 className="h-4 w-4" />
        )}
      </button>
      <iframe
        src={pdfUrl}
        className="w-full"
        style={{ height: fullscreen ? '100vh' : '70vh', borderRadius: fullscreen ? 0 : undefined }}
        onLoad={() => setLoading(false)}
        title="PDF Viewer"
      />
    </div>
  )
}

// ── Delete Button (Admin only) ──────────────────────────────────

function DeleteButton({ ausgabe }: { ausgabe: Ausgabe }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Ausgabe ${ausgabe.nummer} wirklich löschen?`)) return
    setDeleting(true)
    try {
      await deleteAusgabe(ausgabe.id, ausgabe.pdf_url)
      startTransition(() => router.refresh())
    } catch (err) {
      console.error('Delete failed:', err)
      alert('Löschen fehlgeschlagen')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="shrink-0 h-8 w-8 text-destructive hover:text-destructive mr-2"
      onClick={handleDelete}
      disabled={deleting}
    >
      {deleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  )
}

// ── Upload Form ─────────────────────────────────────────────────

function UploadForm() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)
    const file = formData.get('file') as File

    if (!file || file.size === 0) {
      setError('Bitte eine PDF-Datei auswählen')
      return
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Nur PDF-Dateien sind erlaubt')
      return
    }

    setUploading(true)
    try {
      await uploadAusgabe(formData)
      form.reset()
      if (fileRef.current) fileRef.current.value = ''
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload fehlgeschlagen')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border bg-muted/30 p-4 space-y-3"
    >
      <p className="text-sm font-medium text-muted-foreground">
        Neue Ausgabe hochladen
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1 flex-1">
          <label htmlFor="ausgabe-file" className="text-xs text-muted-foreground">
            PDF-Datei
          </label>
          <Input
            ref={fileRef}
            id="ausgabe-file"
            name="file"
            type="file"
            accept=".pdf"
            required
            className="text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="ausgabe-datum" className="text-xs text-muted-foreground">
            Datum
          </label>
          <Input
            id="ausgabe-datum"
            name="datum"
            type="date"
            defaultValue={todayISO()}
            required
            className="text-sm w-full sm:w-40"
          />
        </div>
        <Button type="submit" disabled={uploading} size="sm" className="shrink-0">
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Wird hochgeladen...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Hochladen
            </>
          )}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </form>
  )
}
