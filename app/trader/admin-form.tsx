'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authenticateAdmin } from '@/lib/auth'

export function AdminForm() {
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await authenticateAdmin(password, rememberMe)
      if (result.error) {
        setError(result.error)
      } else {
        router.push('/performance')
      }
    } catch {
      setError('Fehler bei der Anmeldung')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="password"
        placeholder="Admin-Passwort"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
      />
      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="rounded border-input"
        />
        Eingeloggt bleiben (90 Tage)
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading || !password}>
        {loading ? 'Anmelden...' : 'Anmelden'}
      </Button>
    </form>
  )
}
