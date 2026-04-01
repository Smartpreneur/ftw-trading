import Link from 'next/link'
import { LayoutDashboard, BookOpen, Rocket, Library, FileText } from 'lucide-react'

const tiles = [
  {
    href: '/performance',
    title: 'Dashboard',
    description: 'Performance-Übersicht, KPIs und aktuelle Trades auf einen Blick.',
    icon: LayoutDashboard,
    color: '#00748D',
  },
  {
    href: '/trades',
    title: 'Trades',
    description: 'Alle laufenden und abgeschlossenen Trades mit Details und Performance.',
    icon: BookOpen,
    color: '#059669',
  },
  {
    href: '/start',
    title: 'So startest du',
    description: 'In 5 Schritten vom Postfach ins Depot — der Einstiegsguide.',
    icon: Rocket,
    color: '#7c3aed',
  },
  {
    href: '/wissen',
    title: 'Wissensdatenbank',
    description: 'Nachschlagewerk zu Strategien, Begriffen und Handelsansätzen.',
    icon: Library,
    color: '#b45309',
  },
  {
    href: '/ausgaben',
    title: 'Ausgaben-Archiv',
    description: 'Alle bisherigen Wochenausgaben zum Nachlesen und Nachhandeln.',
    icon: FileText,
    color: '#6366f1',
  },
]

export default function UebersichtPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Übersicht</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Willkommen bei Fugmann&apos;s Trading Woche — wähle einen Bereich.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="group relative rounded-xl border bg-card p-5 transition-all hover:shadow-md hover:border-border/80"
          >
            <div
              className="inline-flex items-center justify-center rounded-lg p-2.5 mb-3"
              style={{ background: `${tile.color}10` }}
            >
              <tile.icon className="h-5 w-5" style={{ color: tile.color }} />
            </div>
            <h2 className="text-base font-semibold mb-1 group-hover:text-foreground transition-colors">
              {tile.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {tile.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
