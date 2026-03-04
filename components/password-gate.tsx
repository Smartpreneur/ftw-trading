'use client'

import { useState } from 'react'
import { authenticate } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export function PasswordGate() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await authenticate(password)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      router.refresh()
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f1923',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <form onSubmit={handleSubmit} style={{
        background: '#1a2736',
        borderRadius: 16,
        padding: '48px 40px',
        width: '100%',
        maxWidth: 400,
        textAlign: 'center',
        border: '1px solid rgba(0, 212, 255, 0.1)',
      }}>
        <h1 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: 6 }}>
          Geschützter Bereich
        </h1>
        <p style={{ color: '#5a6a7a', fontSize: '0.9rem', marginBottom: 28 }}>
          Zugang nur mit Passwort
        </p>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Passwort eingeben"
          autoFocus
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            background: '#0f1923',
            color: '#fff',
            fontSize: '1rem',
            marginBottom: 16,
            outline: 'none',
          }}
        />
        <button type="submit" disabled={loading} style={{
          width: '100%',
          padding: 12,
          border: 'none',
          borderRadius: 10,
          background: 'linear-gradient(135deg, #00748D, #00A5C7)',
          color: '#fff',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.5 : 1,
        }}>
          {loading ? 'Laden...' : 'Anmelden'}
        </button>
        {error && (
          <div style={{ color: '#ff5050', fontSize: '0.85rem', marginTop: 12 }}>
            {error}
          </div>
        )}
      </form>
    </div>
  )
}
