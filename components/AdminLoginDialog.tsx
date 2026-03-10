'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, LockOpen } from 'lucide-react'
import { authenticateAdmin, logoutAdmin } from '@/lib/auth'
import { useRouter } from 'next/navigation'

interface AdminLoginDialogProps {
  isAdmin: boolean
}

export function AdminLoginDialog({ isAdmin }: AdminLoginDialogProps) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await authenticateAdmin(password)
      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
        setPassword('')
        router.refresh()
      }
    } catch {
      setError('Fehler bei der Anmeldung')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await logoutAdmin()
    router.refresh()
  }

  if (isAdmin) {
    return (
      <button
        type="button"
        onClick={handleLogout}
        className="text-emerald-600 hover:text-emerald-700 transition-colors"
        aria-label="Admin abmelden"
        title="Admin abmelden"
      >
        <LockOpen className="h-4 w-4" />
      </button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setPassword(''); setError('') } }}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Admin anmelden"
          title="Admin anmelden"
        >
          <Lock className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Admin-Login</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="password"
            placeholder="Admin-Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading || !password}>
            {loading ? 'Anmelden...' : 'Anmelden'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
