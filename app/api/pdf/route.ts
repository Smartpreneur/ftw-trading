import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_STORAGE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ausgaben/`

/**
 * PDF Proxy with edge caching.
 *
 * Usage: /api/pdf?file=2026-03-23-ddclru.pdf
 *
 * Fetches the PDF from Supabase Storage once, then Vercel's Edge CDN
 * caches it for 1 year (immutable — filenames contain random suffix).
 * This reduces Supabase bandwidth to ~1 request per PDF instead of
 * one per reader.
 */
export async function GET(request: NextRequest) {
  const file = request.nextUrl.searchParams.get('file')

  if (!file || !file.endsWith('.pdf')) {
    return NextResponse.json({ error: 'Missing or invalid file parameter' }, { status: 400 })
  }

  // Sanitize: only allow alphanumeric, dash, dot, underscore
  if (!/^[\w\-.]+\.pdf$/.test(file)) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
  }

  const supabaseUrl = `${SUPABASE_STORAGE}${file}`

  const res = await fetch(supabaseUrl)

  if (!res.ok) {
    return NextResponse.json({ error: 'PDF not found' }, { status: 404 })
  }

  const pdfBuffer = await res.arrayBuffer()

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${file}"`,
      // Cache for 1 year on Vercel's Edge CDN (immutable — filename has random suffix)
      'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      'Content-Length': String(pdfBuffer.byteLength),
    },
  })
}
