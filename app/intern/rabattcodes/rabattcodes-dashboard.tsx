'use client'

import { useEffect, useState } from 'react'
import { getDiscountCodes, updateDiscountCode, type DiscountCode } from './actions'
import { logout } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import '../styles.css'

function formatDateTime(iso: string | null) {
  if (!iso) return '–'
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

function getStatus(code: DiscountCode): { label: string; className: string } {
  if (!code.is_active) return { label: 'Deaktiviert', className: 'status--disabled' }
  const now = new Date()
  if (code.valid_from && new Date(code.valid_from) > now) return { label: 'Geplant', className: 'status--scheduled' }
  if (code.valid_until && new Date(code.valid_until) < now) return { label: 'Abgelaufen', className: 'status--expired' }
  return { label: 'Aktiv', className: 'status--active' }
}

export function RabattcodesDashboard() {
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFrom, setEditFrom] = useState('')
  const [editUntil, setEditUntil] = useState('')
  const [editActive, setEditActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const loadCodes = async () => {
    const result = await getDiscountCodes()
    if (result.data) setCodes(result.data)
    setLoading(false)
  }

  useEffect(() => { loadCodes() }, [])

  const handleLogout = async () => {
    await logout()
    router.refresh()
  }

  const startEdit = (code: DiscountCode) => {
    setEditingId(code.id)
    setEditFrom(toLocalInput(code.valid_from))
    setEditUntil(toLocalInput(code.valid_until))
    setEditActive(code.is_active)
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const saveEdit = async (id: string) => {
    setSaving(true)
    const result = await updateDiscountCode(id, {
      valid_from: editFrom ? new Date(editFrom).toISOString() : null,
      valid_until: editUntil ? new Date(editUntil).toISOString() : null,
      is_active: editActive,
    })
    if (!result.error) {
      await loadCodes()
      setEditingId(null)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="intern" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#5a6a7a' }}>Daten werden geladen...</p>
      </div>
    )
  }

  return (
    <div className="intern">
      <header className="intern__header">
        <h1>Rabattcodes</h1>
        <div className="intern__header-actions">
          <a href="/intern" className="intern__nav-link">Dashboard</a>
          <a href="/performance" className="intern__nav-link">Performance</a>
          <a href="/trades" className="intern__nav-link">Trades</a>
          <a href="/setups" className="intern__nav-link">Setups</a>
          <button onClick={handleLogout} className="intern__logout">
            Abmelden
          </button>
        </div>
      </header>

      <section className="intern__section">
        <h2>Rabattcodes verwalten</h2>
        <table className="intern-table rabatt-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Quelle</th>
              <th>Coupon</th>
              <th>Rabatt</th>
              <th>Gültig von</th>
              <th>Gültig bis</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {codes.map(code => {
              const status = getStatus(code)
              const isEditing = editingId === code.id

              if (isEditing) {
                return (
                  <tr key={code.id} className="rabatt-table__editing">
                    <td>{code.code}</td>
                    <td>{code.source}</td>
                    <td>{code.coupon}</td>
                    <td>{code.discount_pct} %</td>
                    <td>
                      <input
                        type="datetime-local"
                        className="rabatt-input"
                        value={editFrom}
                        onChange={e => setEditFrom(e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="datetime-local"
                        className="rabatt-input"
                        value={editUntil}
                        onChange={e => setEditUntil(e.target.value)}
                      />
                    </td>
                    <td>
                      <label className="rabatt-toggle">
                        <input
                          type="checkbox"
                          checked={editActive}
                          onChange={e => setEditActive(e.target.checked)}
                        />
                        <span className="rabatt-toggle__label">
                          {editActive ? 'Aktiv' : 'Deaktiviert'}
                        </span>
                      </label>
                    </td>
                    <td>
                      <div className="rabatt-actions">
                        <button
                          className="rabatt-btn rabatt-btn--save"
                          onClick={() => saveEdit(code.id)}
                          disabled={saving}
                        >
                          {saving ? '...' : 'Speichern'}
                        </button>
                        <button
                          className="rabatt-btn rabatt-btn--cancel"
                          onClick={cancelEdit}
                        >
                          Abbrechen
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              }

              return (
                <tr key={code.id}>
                  <td><strong>{code.code}</strong></td>
                  <td>{code.source}</td>
                  <td>{code.coupon}</td>
                  <td>{code.discount_pct} %</td>
                  <td>{formatDateTime(code.valid_from)}</td>
                  <td>{formatDateTime(code.valid_until)}</td>
                  <td><span className={`rabatt-status ${status.className}`}>{status.label}</span></td>
                  <td>
                    <button
                      className="rabatt-btn rabatt-btn--edit"
                      onClick={() => startEdit(code)}
                    >
                      Bearbeiten
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      <section className="intern__section">
        <h2>Hinweise</h2>
        <ul className="rabatt-hints">
          <li><strong>Gültig von / bis leer</strong> = dauerhaft gültig (keine zeitliche Einschränkung)</li>
          <li><strong>Geplant</strong> = Gültigkeitszeitraum liegt in der Zukunft</li>
          <li><strong>Abgelaufen</strong> = Gültigkeitszeitraum ist vorbei, Rabatt wird nicht mehr angezeigt</li>
          <li><strong>Deaktiviert</strong> = manuell deaktiviert, unabhängig vom Zeitraum</li>
        </ul>
      </section>
    </div>
  )
}
