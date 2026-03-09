'use client'

import { useEffect, useState } from 'react'
import { useDevMode } from './use-dev-mode'

const sections = [
  {
    title: 'Planung',
    description: 'Projektthemen und Aufgaben im Kanban-Board verwalten',
    href: '/intern/planung',
    icon: '📋',
  },
  {
    title: 'Analytics',
    description: 'Landing Page KPIs, Traffic-Quellen, Conversion Rate und Kampagnen',
    href: '/intern/analytics',
    icon: '📊',
  },
  {
    title: 'YouTube',
    description: 'Kanal-KPIs, Video-Performance und Kommentar-Analyse',
    href: '/intern/youtube',
    icon: '🎬',
    dev: true,
  },
  {
    title: 'Rabattcodes',
    description: 'Gutscheincodes verwalten, Gültigkeitszeiträume pflegen',
    href: '/intern/rabattcodes',
    icon: '🏷️',
  },
  {
    title: 'Trading',
    description: 'Performance, Trades und Setups verwalten',
    href: '/performance',
    icon: '📈',
  },
]

export function InternHub() {
  const devMode = useDevMode()
  const visible = sections.filter(s => !s.dev || devMode)

  return (
    <div className="hub-grid">
      {visible.map(s => (
        <a key={s.href} href={s.href} className="hub-card">
          <span className="hub-card__icon">{s.icon}</span>
          <h2 className="hub-card__title">{s.title}</h2>
          <p className="hub-card__desc">{s.description}</p>
        </a>
      ))}
    </div>
  )
}
