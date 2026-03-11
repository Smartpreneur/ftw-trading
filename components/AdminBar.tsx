'use client'

import { logoutAdmin } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export function AdminBar() {
  const router = useRouter()

  async function handleLogout() {
    await logoutAdmin()
    router.push('/performance')
  }

  return (
    <div className="bg-emerald-600 text-white text-xs py-1 px-4 flex items-center justify-center gap-2">
      <span>Admin-Modus</span>
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
