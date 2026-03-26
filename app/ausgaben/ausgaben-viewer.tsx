'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { Trash2, Upload, Loader2, Maximize2, Minimize2 } from 'lucide-react'
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

  const selectedNr = nrParam ? parseInt(nrParam, 10) : null
  const activeIndex = selectedNr
    ? ausgaben.findIndex((a) => a.nummer === selectedNr)
    : 0
  const currentIndex = activeIndex >= 0 ? activeIndex : 0
  const activeIssue = ausgaben[currentIndex]

  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < ausgaben.length - 1

  function navigateTo(index: number) {
    const target = ausgaben[index]
    if (!target) return
    const url = new URL(window.location.href)
    url.searchParams.set('nr', String(target.nummer))
    router.push(url.pathname + url.search)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-6">
      {isAdmin && <UploadForm />}

      {activeIssue ? (
        <div className="space-y-3">
          {/* Header with navigation */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              FTW vom {formatDatum(activeIssue.datum)}
            </h2>
            {ausgaben.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateTo(currentIndex + 1)}
                  disabled={!hasNext}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-sm text-muted-foreground hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  <span className="hidden sm:inline">Älter</span>
                </button>
                <span className="text-xs text-muted-foreground tabular-nums">{currentIndex + 1} / {ausgaben.length}</span>
                <button
                  onClick={() => navigateTo(currentIndex - 1)}
                  disabled={!hasPrev}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-sm text-muted-foreground hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="hidden sm:inline">Neuer</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          <PdfViewer
            key={activeIssue.id}
            url={activeIssue.pdf_url}
            thumbnailUrl={activeIssue.thumbnail_url}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Noch keine Ausgaben vorhanden.
        </div>
      )}

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
                  {isAdmin && <DeleteButton ausgabe={ausgabe} />}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── PDF Viewer with thumbnail preload ──────────────────────────

function PdfViewer({
  url,
  thumbnailUrl,
}: {
  url: string
  thumbnailUrl?: string | null
}) {
  const [pdfReady, setPdfReady] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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

  const height = fullscreen ? '100vh' : '70vh'

  return (
    <div
      ref={containerRef}
      className="relative rounded-lg border bg-muted/30 overflow-hidden group"
      style={{ height, borderRadius: fullscreen ? 0 : undefined }}
    >
      {/* Thumbnail: shows instantly, fades out when PDF is ready */}
      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt="Vorschau Seite 1"
          className={`absolute inset-0 w-full h-full object-contain object-top z-[1] transition-opacity duration-300 ${
            pdfReady ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        />
      )}

      {/* Loading spinner: only when no thumbnail available */}
      {!thumbnailUrl && !pdfReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Subtle loading indicator while thumbnail is visible */}
      {thumbnailUrl && !pdfReady && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-background/80 backdrop-blur px-3 py-1.5 rounded-full border text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Vollständige Ausgabe wird geladen…
        </div>
      )}

      {/* PDF iframe: loads in background, always mounted */}
      <iframe
        src={pdfUrl}
        className="absolute inset-0 w-full h-full"
        onLoad={() => setPdfReady(true)}
        title="PDF Viewer"
      />

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
    </div>
  )
}

// ── Thumbnail generation (client-side, admin only) ─────────────

async function generateThumbnail(file: File): Promise<Blob> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const page = await pdf.getPage(1)

  const viewport = page.getViewport({ scale: 1 })
  const scale = 800 / viewport.width
  const scaledViewport = page.getViewport({ scale })

  const canvas = document.createElement('canvas')
  canvas.width = scaledViewport.width
  canvas.height = scaledViewport.height

  const ctx = canvas.getContext('2d')!
  await page.render({ canvas, canvasContext: ctx, viewport: scaledViewport }).promise
  await pdf.destroy()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Thumbnail-Erstellung fehlgeschlagen'))),
      'image/webp',
      0.85,
    )
  })
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
      await deleteAusgabe(ausgabe.id, ausgabe.pdf_url, ausgabe.thumbnail_url)
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
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
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
      // Generate thumbnail from first page
      setUploadStatus('Vorschau wird erstellt…')
      try {
        const thumbnailBlob = await generateThumbnail(file)
        formData.set('thumbnail', thumbnailBlob, 'thumbnail.webp')
      } catch (err) {
        console.warn('Thumbnail generation failed, uploading without:', err)
      }

      // Upload PDF + thumbnail
      setUploadStatus('Wird hochgeladen…')
      await uploadAusgabe(formData)
      form.reset()
      if (fileRef.current) fileRef.current.value = ''
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload fehlgeschlagen')
    } finally {
      setUploading(false)
      setUploadStatus(null)
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
              {uploadStatus}
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
