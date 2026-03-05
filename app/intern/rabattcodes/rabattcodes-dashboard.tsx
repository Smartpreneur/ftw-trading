'use client'

import { useEffect, useState } from 'react'
import { getDiscountCodes, updateDiscountCode, type DiscountCode } from './actions'
import { logout } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useTheme } from '../use-theme'
import '../styles.css'

const TZ = 'Europe/Berlin'

function formatDateTime(iso: string | null) {
  if (!iso) return '–'
  return new Date(iso).toLocaleString('de-DE', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ISO → datetime-local Input-Wert in Berliner Zeit
function toBerlinInput(iso: string | null): string {
  if (!iso) return ''
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso))
  const get = (type: string) => parts.find(p => p.type === type)?.value || ''
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

// datetime-local Input-Wert (Berliner Zeit) → UTC ISO string
function berlinToUTC(local: string): string {
  const [datePart, timePart] = local.split('T')
  const [y, mo, d] = datePart.split('-').map(Number)
  const [h, mi] = timePart.split(':').map(Number)

  // Eingabewerte als naive UTC-Timestamps behandeln (browser-unabhängig)
  const naiveUtc = Date.UTC(y, mo - 1, d, h, mi)

  // Prüfen welche Berliner Zeit diesem UTC-Moment entspricht
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(naiveUtc))
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value || '0')

  // Offset = Differenz zwischen Berliner Darstellung und naiver UTC-Eingabe
  const berlinMs = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'))
  const offsetMs = berlinMs - naiveUtc

  return new Date(naiveUtc - offsetMs).toISOString()
}

function formatRemaining(until: string | null): string {
  if (!until) return 'ohne Begrenzung'
  const now = new Date()
  const end = new Date(until)
  const diffMs = end.getTime() - now.getTime()
  if (diffMs <= 0) return ''
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60))
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24
  if (days > 0 && hours > 0) return `noch ${days} T ${hours} Std`
  if (days > 0) return `noch ${days} T`
  if (hours > 0) return `noch ${hours} Std`
  return `noch < 1 Std`
}

function getStatus(code: DiscountCode): { label: string; detail: string; className: string } {
  if (!code.is_active) return { label: 'Deaktiviert', detail: '', className: 'status--disabled' }
  const now = new Date()
  if (code.valid_from && new Date(code.valid_from) > now) return { label: 'Geplant', detail: '', className: 'status--scheduled' }
  if (code.valid_until && new Date(code.valid_until) < now) return { label: 'Abgelaufen', detail: '', className: 'status--expired' }
  return { label: 'Aktiv', detail: formatRemaining(code.valid_until), className: 'status--active' }
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
  const { light, toggle } = useTheme()

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
    setEditFrom(toBerlinInput(code.valid_from))
    setEditUntil(toBerlinInput(code.valid_until))
    setEditActive(code.is_active)
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const saveEdit = async (id: string) => {
    setSaving(true)
    const result = await updateDiscountCode(id, {
      valid_from: editFrom ? berlinToUTC(editFrom) : null,
      valid_until: editUntil ? berlinToUTC(editUntil) : null,
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
    <div className={`intern${light ? ' light' : ''}`}>
      <header className="intern__header">
        <h1>Rabattcodes</h1>
        <div className="intern__header-actions">
          <a href="/intern" className="intern__nav-link">Übersicht</a>
          <button onClick={toggle} className="theme-toggle" title={light ? 'Dark Mode' : 'Light Mode'}>
            {light ? '🌙' : '☀️'}
          </button>
          <button onClick={handleLogout} className="intern__logout">
            Abmelden
          </button>
        </div>
      </header>

      <div className="rabatt-tz-hint">Zeitzone: Berlin (MEZ/MESZ)</div>

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
                        min="2020-01-01T00:00"
                        max="9999-12-31T23:59"
                        onChange={e => setEditFrom(e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="datetime-local"
                        className="rabatt-input"
                        value={editUntil}
                        min="2020-01-01T00:00"
                        max="9999-12-31T23:59"
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
                  <td>
                    <span className={`rabatt-status ${status.className}`}>{status.label}</span>
                    {status.detail && <span className="rabatt-status-detail"> ({status.detail})</span>}
                  </td>
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
