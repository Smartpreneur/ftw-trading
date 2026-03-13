'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import Script from 'next/script'

interface WistiaVideoProps {
  mediaId: string
}

export function WistiaVideo({ mediaId }: WistiaVideoProps) {
  const [playing, setPlaying] = useState(false)
  const thumbnailUrl = `https://fast.wistia.com/embed/medias/${mediaId}/swatch`

  const handlePlay = useCallback(() => {
    setPlaying(true)
  }, [])

  if (!playing) {
    return (
      <div className="hero__video">
        <button
          onClick={handlePlay}
          aria-label="Video abspielen"
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            background: '#000',
          }}
        >
          <Image
            src={thumbnailUrl}
            alt="Video-Vorschau"
            fill
            sizes="(max-width: 720px) 100vw, 720px"
            style={{ objectFit: 'cover' }}
            unoptimized
          />
          {/* Play Button Overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'rgba(0, 116, 141, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s',
            }}>
              <svg width="28" height="32" viewBox="0 0 28 32" fill="none">
                <path d="M28 16L0 32V0L28 16Z" fill="white" />
              </svg>
            </div>
          </div>
        </button>
      </div>
    )
  }

  return (
    <div className="hero__video">
      <Script src="https://fast.wistia.com/player.js" strategy="afterInteractive" />
      <Script src={`https://fast.wistia.com/embed/${mediaId}.js`} strategy="afterInteractive" />
      {/* @ts-expect-error – wistia-player ist ein Web Component */}
      <wistia-player media-id={mediaId} aspect="1.7777777777777777" autoplay="true" />
    </div>
  )
}
