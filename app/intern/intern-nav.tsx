'use client'

import { usePathname } from 'next/navigation'
import { logout } from '@/lib/auth'
import { useRouter } from 'next/navigation'

const navLinks = [
  { href: '/intern', label: 'Übersicht', icon: 'home' },
  { href: '/intern/analytics', label: 'Analytics', icon: 'chart' },
  { href: '/intern/youtube', label: 'YouTube', icon: 'youtube' },
  { href: '/intern/planung', label: 'Planung', icon: 'kanban' },
  { href: '/intern/rabattcodes', label: 'Rabattcodes', icon: 'tag' },
]

function NavIcon({ type }: { type: string }) {
  const props = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (type) {
    case 'home':
      return <svg {...props}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    case 'chart':
      return <svg {...props}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
    case 'kanban':
      return <svg {...props}><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
    case 'youtube':
      return <svg {...props}><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
    case 'tag':
      return <svg {...props}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
    default:
      return null
  }
}

export function InternNav({ light, toggle }: { light: boolean; toggle: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.refresh()
  }

  return (
    <nav className="intern-nav">
      <div className="intern-nav__inner">
        <div className="intern-nav__links">
          {navLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              className={`intern-nav__link ${pathname === link.href ? 'intern-nav__link--active' : ''}`}
            >
              <NavIcon type={link.icon} />
              <span className="intern-nav__link-label">{link.label}</span>
            </a>
          ))}
        </div>
        <div className="intern-nav__actions">
          <a href="/performance" className="intern-nav__link intern-nav__link--external">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <span className="intern-nav__link-label">Trading</span>
          </a>
          <button onClick={toggle} className="intern-nav__btn" title={light ? 'Dark Mode' : 'Light Mode'}>
            {light ? '🌙' : '☀️'}
          </button>
          <button onClick={handleLogout} className="intern-nav__btn intern-nav__btn--logout" title="Abmelden">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>
    </nav>
  )
}
