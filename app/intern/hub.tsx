'use client'

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
  return (
    <div className="hub-grid">
      {sections.map(s => (
        <a key={s.href} href={s.href} className="hub-card">
          <span className="hub-card__icon">{s.icon}</span>
          <h2 className="hub-card__title">{s.title}</h2>
          <p className="hub-card__desc">{s.description}</p>
        </a>
      ))}
    </div>
  )
}
