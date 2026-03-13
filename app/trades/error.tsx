'use client'

export default function TradesError() {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 8 }}>
          Kein Zugriff
        </h1>
        <p style={{ color: '#666', fontSize: '0.95rem' }}>
          Diese Seite ist nicht verfügbar. Bitte prüfe deine Zugangsdaten oder wende dich an den Administrator.
        </p>
      </div>
    </div>
  )
}
