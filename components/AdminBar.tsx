'use client'

import { logoutAdmin } from '@/lib/auth'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { LogOut, Eye, EyeOff } from 'lucide-react'

export function AdminBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isUserView = searchParams.get('view') === 'user'

  async function handleLogout() {
    await logoutAdmin()
    router.push('/performance')
  }

  function toggleView() {
    const params = new URLSearchParams(searchParams.toString())
    if (isUserView) {
      params.delete('view')
    } else {
      params.set('view', 'user')
    }
    const query = params.toString()
    router.push(`${pathname}${query ? `?${query}` : ''}`)
  }

  return (
    <div className={`text-white text-xs py-1 px-4 flex items-center justify-center gap-3 ${isUserView ? 'bg-amber-600' : 'bg-emerald-600'}`}>
      <span>{isUserView ? 'User-Ansicht (Admin versteckt)' : 'Admin-Modus'}</span>
      <button
        type="button"
        onClick={toggleView}
        className="underline hover:no-underline flex items-center gap-1"
      >
        {isUserView ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        {isUserView ? 'Admin-Ansicht' : 'User-Ansicht'}
      </button>
      <span className="text-white/30">|</span>
      <button
        type="button"
        onClick={handleLogout}
        className="underline hover:no-underline flex items-center gap-1"
      >
        <LogOut className="h-3 w-3" />
        Abmelden
      </button>
    </div>
  )
}
