'use client'

import { useState } from 'react'
import Link from 'next/link'

// FMW Brand Colors
const FMW = {
  primary: '#00748D',
  light: '#00A5C7',
  dark: '#005266',
  accent: '#00D4FF',
}

// ---------------------------------------------------------------------------
// Steps Data
// ---------------------------------------------------------------------------

const STEPS = [
  {
    nr: 1,
    title: 'Handelsansatz verstehen',
    detail: `<p>Fugmann's Trading Woche liefert charttechnisch basierte Setups für verschiedene Assetklassen:</p>
<div class="grid grid-cols-2 gap-2 my-3">
<div class="p-3 rounded-lg border text-[13px]"><strong>Aktien</strong><br/>US- und europäische Einzelwerte</div>
<div class="p-3 rounded-lg border text-[13px]"><strong>Indizes</strong><br/>DAX, S&amp;P 500, Nasdaq u.a.</div>
<div class="p-3 rounded-lg border text-[13px]"><strong>Rohstoffe</strong><br/>Gold, Öl und weitere</div>
<div class="p-3 rounded-lg border text-[13px]"><strong>Krypto</strong><br/>Bitcoin, Altcoins (Top 100-200)</div>
</div>
<p><strong>Der Kerngedanke:</strong> Jedes Setup hat ein definiertes Chance-Risiko-Verhältnis (CRV). Es wird immer Gewinn- <em>und</em> Verlusttrades geben — das ist völlig normal und Teil der Strategie.</p>
<p>Das Ziel ist, dass die <strong>Gewinntrades die Verlusttrades überkompensieren</strong> — gemessen am Profit-Faktor (PF &gt; 1). FTW fokussiert auf Setups mit gutem CRV, um mehr Rendite in unterschiedlichen Marktphasen zu erreichen.</p>`,
  },
  {
    nr: 2,
    title: 'Setup lesen',
    detail: `<p>Setups erreichen dich auf zwei Wegen:</p>
<ul>
<li><strong>Wöchentliche Ausgabe</strong> — jeden Montag nachmittags per E-Mail mit mehreren Setups und Begleitvideo</li>
<li><strong>Eilmeldung</strong> — bei akutem Handlungsbedarf (Trigger erreicht, TP-Update, Szenario-Änderung)</li>
</ul>
<p>Jedes Setup besteht aus <strong>zwei Teilen</strong>, die zusammen gelesen werden:</p>
<ul>
<li><strong>Chart:</strong> Zeigt Zonen, Formationen, Widerstände und Unterstützungen — die visuelle Orientierung</li>
<li><strong>Text:</strong> Enthält exakte Marken (Einstieg, Stop-Loss, Take-Profit), WKN/ISIN, CRV und die Begründung</li>
</ul>
<p><strong>Wichtig:</strong> Immer beides lesen! Im Text stehen oft entscheidende Details, die im Chart allein nicht erkennbar sind.</p>`,
  },
  {
    nr: 3,
    title: 'Instrument wählen',
    detail: `<p>Das Setup sagt dir <em>was</em> du handeln sollst und <em>wo</em> du ein-/aussteigst. Das <em>wie</em> — also mit welchem Instrument — entscheidest du selbst:</p>
<table class="w-full my-3 text-[13px] border-collapse">
<tr class="border-b"><td class="py-2 pr-3 font-semibold align-top w-[140px]">Aktie direkt</td><td class="py-2 text-muted-foreground">Kein Hebel, kein Zeitwertverfall. Ideal für mittelfristige Setups und Einsteiger.</td></tr>
<tr class="border-b"><td class="py-2 pr-3 font-semibold align-top">CFD</td><td class="py-2 text-muted-foreground">Gehebelter Handel auf steigende und fallende Kurse. Flexibel, aber höheres Risiko.</td></tr>
<tr class="border-b"><td class="py-2 pr-3 font-semibold align-top">Zertifikat / OS</td><td class="py-2 text-muted-foreground">Gehebeltes Produkt mit WKN — z.B. Knock-Outs oder Optionsscheine. Eigenen Hebel und Laufzeit wählen.</td></tr>
<tr><td class="py-2 pr-3 font-semibold align-top">ETF / ETP</td><td class="py-2 text-muted-foreground">Für Indizes und Krypto. Kein Emittentenrisiko, börsentäglich handelbar.</td></tr>
</table>
<p>Prüfe bei deinem Broker, welche Instrumente du halten und handeln kannst.</p>`,
  },
  {
    nr: 4,
    title: 'Setup nachhandeln',
    detail: `<p>Sobald du das Setup verstanden und dein Instrument gewählt hast:</p>
<ol>
<li><strong>Einstieg:</strong> Order zum genannten Kurs platzieren (Limit-Order oder Stop-Buy)</li>
<li><strong>Stop-Loss:</strong> SL-Marke direkt mit eingeben — das begrenzt dein maximales Risiko</li>
<li><strong>Take-Profit:</strong> TP-Marke(n) hinterlegen — dort wird automatisch Gewinn realisiert</li>
</ol>
<p>Das dauert in der Regel <strong>3-5 Minuten</strong> pro Setup.</p>
<p>Nicht jedes Setup hat sofort einen engen SL. Manche Szenarien (z.B. Bottomfishing) bekommen bewusst mehr Luft — das steht jeweils im Text.</p>`,
  },
  {
    nr: 5,
    title: 'Trade Management',
    detail: `<p><strong>Positionsgröße bewusst wählen:</strong> Empfehlung sind <strong>1-4 % des Depots pro Trade</strong>. Das schützt dein Kapital auch bei einer Serie von Verlusttrades — und die gehören zum Trading dazu.</p>
<p>Wer pro Trade zu viel riskiert, kann auch mit einem guten System Geld verlieren.</p>
<p><strong>Auf Updates reagieren:</strong></p>
<ul>
<li><strong>TP erreicht:</strong> Mind. 50 % der Position schließen, Rest ggf. mit nachgezogenem SL absichern</li>
<li><strong>Szenario-Änderung:</strong> Per Eilmeldung — Position anpassen oder schließen</li>
<li><strong>Formationsziel erreicht:</strong> Neubewertung, ggf. Restposition laufen lassen</li>
</ul>
<p><strong>Diversifikation:</strong> Nicht zu viele Trades im gleichen Sektor. Max. 10-20 % des Depots in einem Sektor.</p>`,
  },
]

const TIPS = [
  {
    title: 'Positionsgröße festlegen',
    text: 'Wähle bewusst, wie viel du pro Trade riskierst — 1-5 % des Depots ist ein guter Richtwert. Das schützt dein Kapital auch bei Verlustserien.',
  },
  {
    title: 'Nicht jedes Setup handeln müssen',
    text: 'Du musst nicht jedes Setup nachhandeln. Wähle die Setups, die zu deinem Stil und deiner Assetklasse passen. Statistisch gleicht sich das über die Zeit an.',
  },
  {
    title: 'Stop-Loss nicht ignorieren',
    text: 'Der SL ist dein Sicherheitsnetz. Ihn wegzulassen oder zu verschieben, weil man "hofft", ist einer der häufigsten Fehler im Trading.',
  },
  {
    title: 'Eilmeldungen beachten',
    text: 'Wenn eine Eilmeldung kommt, reagiere zeitnah. Dort stehen wichtige Updates zu laufenden Trades — Trigger erreicht, TP-Anpassung oder Szenario-Änderung.',
  },
  {
    title: 'Kosten im Blick behalten',
    text: 'Ordergebühren, Spreads und ggf. Finanzierungskosten (bei CFDs) fressen Rendite. Vergleiche Broker und achte auf günstige Konditionen.',
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StartPage() {
  const [activeStep, setActiveStep] = useState<number>(1)
  const [openTips, setOpenTips] = useState<Set<number>>(new Set())
  function toggleTip(i: number) {
    setOpenTips((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const currentStep = STEPS.find((s) => s.nr === activeStep)!

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">So startest du</h1>
        <p className="text-sm text-muted-foreground mt-1">
          In 5 Schritten vom Postfach ins Depot — klicke auf einen Schritt für Details.
        </p>
      </div>

      {/* ============================================================ */}
      {/* 5 STEPS — horizontal row with FMW branding                   */}
      {/* ============================================================ */}
      <section>
        <div className="relative">
          {/* Connecting line (desktop) — FMW gradient */}
          <div
            className="hidden md:block absolute top-7 left-[10%] right-[10%] h-0.5 z-0"
            style={{ background: `linear-gradient(90deg, transparent, ${FMW.light}40, ${FMW.primary}60, ${FMW.light}40, transparent)` }}
          />

          <div className="flex flex-col md:grid md:grid-cols-5 gap-2">
            {STEPS.map((step) => {
              const isActive = activeStep === step.nr
              return (
                <button
                  key={step.nr}
                  onClick={() => setActiveStep(step.nr)}
                  className="relative z-10 flex flex-row md:flex-col items-center md:text-center gap-3 md:gap-0 px-3 py-2 md:p-3 rounded-xl transition-all cursor-pointer"
                  style={isActive ? { background: `${FMW.primary}08`, boxShadow: `0 0 0 2px ${FMW.primary}30` } : undefined}
                >
                  {/* Circle — FMW branded */}
                  <div
                    className="flex items-center justify-center w-10 h-10 md:w-14 md:h-14 rounded-full border-2 md:mb-2 transition-all shrink-0"
                    style={isActive
                      ? { background: FMW.primary, borderColor: FMW.dark, color: '#fff' }
                      : { background: '#fff', borderColor: `${FMW.primary}30`, color: FMW.primary }
                    }
                  >
                    <span className="text-base md:text-lg font-bold">{step.nr}</span>
                  </div>
                  <span
                    className="text-sm md:text-xs font-semibold leading-tight"
                    style={{ color: isActive ? FMW.dark : undefined }}
                  >
                    {step.title}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Detail panel for active step */}
        <div
          className="mt-5 rounded-xl border-2 bg-card p-5 sm:p-6"
          style={{ borderColor: `${FMW.primary}20` }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0"
              style={{ background: FMW.primary, color: '#fff' }}
            >
              {currentStep.nr}
            </div>
            <h3 className="text-base font-bold">{currentStep.title}</h3>
          </div>
          <div
            className="text-sm leading-relaxed text-muted-foreground [&_strong]:text-foreground [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:space-y-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-3 [&_ol]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:text-sm [&_em]:not-italic [&_em]:text-muted-foreground [&_table]:w-full [&_td]:py-2"
            dangerouslySetInnerHTML={{ __html: currentStep.detail }}
          />
          {/* Navigation */}
          <div className="flex justify-between mt-4 pt-4 border-t border-border">
            <button
              onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
              disabled={activeStep === 1}
              className="inline-flex items-center gap-1.5 text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ color: FMW.primary }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Zurück
            </button>
            <span className="text-xs text-muted-foreground">Schritt {activeStep} von {STEPS.length}</span>
            <button
              onClick={() => setActiveStep(Math.min(STEPS.length, activeStep + 1))}
              disabled={activeStep === STEPS.length}
              className="inline-flex items-center gap-1.5 text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ color: FMW.primary }}
            >
              Weiter
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* WICHTIGE HINWEISE BEIM NACHHANDELN                           */}
      {/* ============================================================ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={FMW.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <h2 className="text-lg font-bold">Wichtig beim Nachhandeln</h2>
        </div>

        <div className="space-y-2">
          {TIPS.map((tip, i) => {
            const isOpen = openTips.has(i)
            return (
              <div key={tip.title} className="rounded-lg border bg-card overflow-hidden">
                <button
                  onClick={() => toggleTip(i)}
                  className="w-full flex justify-between items-center px-4 py-3 text-left text-sm font-semibold hover:bg-muted/50 transition-colors gap-3"
                >
                  {tip.title}
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className={`shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="px-4 pb-3 text-xs text-muted-foreground leading-relaxed">
                    {tip.text}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Link to Wissensdatenbank */}
      <div className="pt-4 border-t border-border">
        <Link
          href="/wissen"
          className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: FMW.primary }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          Ausführliches Nachschlagewerk in der Wissensdatenbank
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
