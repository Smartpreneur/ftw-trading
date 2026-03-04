'use client'

import { logout } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import './styles.css'

const sections = [
  {
    title: 'Analytics',
    description: 'Landing Page KPIs, Traffic-Quellen, Conversion Rate und Kampagnen',
    href: '/intern/analytics',
    icon: '📊',
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
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.refresh()
  }

  return (
    <div className="intern">
      <header className="intern__header">
        <h1>Interner Bereich</h1>
        <div className="intern__header-actions">
          <button onClick={handleLogout} className="intern__logout">
            Abmelden
          </button>
        </div>
      </header>

      <div className="hub-grid">
        {sections.map(s => (
          <a key={s.href} href={s.href} className="hub-card">
            <span className="hub-card__icon">{s.icon}</span>
            <h2 className="hub-card__title">{s.title}</h2>
            <p className="hub-card__desc">{s.description}</p>
          </a>
        ))}
      </div>
    </div>
  )
}
