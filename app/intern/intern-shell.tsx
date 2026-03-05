'use client'

import { useTheme } from './use-theme'
import { InternNav } from './intern-nav'
import './styles.css'

export function InternShell({ children }: { children: React.ReactNode }) {
  const { light, toggle } = useTheme()

  return (
    <div className={`intern-shell${light ? ' light' : ''}`}>
      <InternNav light={light} toggle={toggle} />
      <div className="intern-shell__content">
        {children}
      </div>
    </div>
  )
}
