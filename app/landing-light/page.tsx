'use client'

import { useEffect } from 'react'
import './styles.css'

export default function LandingPage() {
  useEffect(() => {
    // Navbar scroll effect
    const nav = document.getElementById('nav')
    const handleScroll = () => {
      if (nav) {
        nav.classList.toggle('scrolled', window.scrollY > 40)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    // FAQ Accordion
    document.querySelectorAll('.faq-question').forEach((btn) => {
      btn.addEventListener('click', function(this: HTMLElement) {
        const item = this.parentElement
        if (!item) return
        const isActive = item.classList.contains('active')
        document.querySelectorAll('.faq-item').forEach((el) => {
          el.classList.remove('active')
        })
        if (!isActive) item.classList.add('active')
      })
    })

    // Scroll Reveal
    const reveals = document.querySelectorAll('.reveal')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    reveals.forEach((el) => observer.observe(el))

    // Sticky CTA visibility (mobile)
    const stickyCta = document.getElementById('stickyCta')
    const heroSection = document.querySelector('.hero')
    if (stickyCta && heroSection) {
      const stickyObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (window.innerWidth <= 768) {
              stickyCta.style.transform = entry.isIntersecting
                ? 'translateY(100%)'
                : 'translateY(0)'
            }
          })
        },
        { threshold: 0 }
      )
      stickyCta.style.transition = 'transform 0.3s ease'
      stickyCta.style.transform = 'translateY(100%)'
      stickyObserver.observe(heroSection)
    }

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <>
      {/* NAV */}
      <nav className="nav" id="nav">
        <div className="container">
          <div className="nav__inner">
            <a href="#" className="nav__logo">
              Fugmanns <span>Trading Service</span>
            </a>
            <a href="#pricing" className="cta-btn nav__cta">
              Jetzt testen
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="container">
          <div className="hero__content">
            <div className="hero__badge">Fugmanns Trading Service</div>
            <h1>
              Mit Profi-Wissen mehr <span className="highlight">Rendite</span>{' '}
              erwirtschaften
            </h1>
            <p className="hero__sub">
              Top-Analysen fertig vorbereitet mit Einstieg, Stop-Loss &amp;
              Gewinnmitnahme.
            </p>
            <a href="#pricing" className="cta-btn">
              4 Wochen testen – 100 % Geld-zurück-Garantie
            </a>
            <div className="hero__trust">
              <div className="trust-item">
                <span className="trust-item__value">70 %+</span>
                <span className="trust-item__label">Trefferquote</span>
              </div>
              <div className="trust-item">
                <span className="trust-item__value">140+</span>
                <span className="trust-item__label">Chancen pro Jahr</span>
              </div>
              <div className="trust-item">
                <span className="trust-item__value">30 Tage</span>
                <span className="trust-item__label">Geld-zurück-Garantie</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="section section--alt">
        <div className="container">
          <h2 className="text-center reveal">Kennst Du das?</h2>
          <div className="problem-grid">
            <div className="problem-card reveal">
              <div className="problem-card__icon">⏳</div>
              <h3>Du verpasst die besten Einstiege</h3>
              <p>
                Du arbeitest den ganzen Tag und kannst nicht dauerhaft den Markt
                beobachten. Wenn Du die Chance siehst, ist sie schon gelaufen.
              </p>
            </div>
            <div className="problem-card reveal">
              <div className="problem-card__icon">📉</div>
              <h3>Du kaufst zu spät, verkaufst zu früh</h3>
              <p>
                Ohne technische Analyse fehlen Dir die präzisen Kurspunkte für
                den optimalen Einstieg und Ausstieg.
              </p>
            </div>
            <div className="problem-card reveal">
              <div className="problem-card__icon">🤔</div>
              <h3>Du wartest auf den perfekten Moment</h3>
              <p>
                Der nie kommt. Die Kurse laufen, Du schaust zu – und ärgerst
                Dich hinterher über verpasste Gewinne.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BRIDGE */}
      <section className="bridge">
        <div className="container">
          <p className="reveal">
            <strong>Das Ergebnis:</strong> Durchschnittsrendite statt
            Outperformance. Professionelle Fonds nutzen Technische Analyse – Du
            bisher nicht. Nicht weil Du es nicht könntest, sondern weil Dir die{' '}
            <strong>Zeit und die Werkzeuge</strong> fehlen.
          </p>
        </div>
      </section>

      {/* STEPS */}
      <section className="section">
        <div className="container">
          <h2 className="text-center reveal">So einfach funktioniert es</h2>
          <p className="subtitle text-center reveal">
            Vom Postfach ins Depot – in 15 Minuten pro Woche.
          </p>
          <div className="steps">
            <div className="step reveal">
              <div className="step__number">1</div>
              <h3>Montag: Analyse erhalten</h3>
              <p>
                4–6 fertige Trade-Setups mit exakten Kurspunkten landen in
                Deinem Postfach.
              </p>
            </div>
            <div className="step reveal">
              <div className="step__number">2</div>
              <h3>Orders eingeben</h3>
              <p>
                Kauf, Stop-Loss &amp; Gewinnmitnahme als Limit-Order eintragen.
                Dauert 15 Minuten.
              </p>
            </div>
            <div className="step reveal">
              <div className="step__number">3</div>
              <h3>Gewinne mitnehmen</h3>
              <p>
                Eil-Benachrichtigungen bei Gewinnmitnahme oder Änderungen. Du
                verpasst nichts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RESULTS */}
      <section className="section section--alt">
        <div className="container">
          <h2 className="text-center reveal">
            Echte Ergebnisse der letzten Wochen
          </h2>
          <p className="subtitle text-center reveal">
            Performance der Basiswerte – ohne Hebel.
          </p>
          <div className="results-wrapper reveal">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Basiswert</th>
                  <th>Zeitraum</th>
                  <th>Ergebnis</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Fortrea Holding</td>
                  <td>2 Wochen</td>
                  <td className="pct">
                    <span className="pct-badge">+40,8 %</span>
                  </td>
                </tr>
                <tr>
                  <td>Mantle</td>
                  <td>4 Wochen</td>
                  <td className="pct">
                    <span className="pct-badge">+26,6 %</span>
                  </td>
                </tr>
                <tr>
                  <td>Palladium</td>
                  <td>3 Wochen</td>
                  <td className="pct">
                    <span className="pct-badge">+21,2 %</span>
                  </td>
                </tr>
                <tr>
                  <td>Paycor</td>
                  <td>5 Wochen</td>
                  <td className="pct">
                    <span className="pct-badge">+17,6 %</span>
                  </td>
                </tr>
                <tr>
                  <td>Intel</td>
                  <td>7 Wochen</td>
                  <td className="pct">
                    <span className="pct-badge">+16,9 %</span>
                  </td>
                </tr>
                <tr>
                  <td>Secunet</td>
                  <td>5 Wochen</td>
                  <td className="pct">
                    <span className="pct-badge">+14,9 %</span>
                  </td>
                </tr>
                <tr>
                  <td>Bitcoin</td>
                  <td>3 Wochen</td>
                  <td className="pct">
                    <span className="pct-badge">+13,9 %</span>
                  </td>
                </tr>
                <tr>
                  <td>National Vision</td>
                  <td>1 Woche</td>
                  <td className="pct">
                    <span className="pct-badge">+12,9 %</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="badge-row">
            <div className="badge">70 %+ Trefferquote</div>
            <div className="badge">140+ Chancen / Jahr</div>
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="section">
        <div className="container">
          <h2 className="text-center reveal">Dein Analysten-Team</h2>
          <p className="subtitle text-center reveal">
            Jedes Wochenende arbeiten zwei erfahrene Analysten konzentriert an
            den besten Setups für die kommende Woche.
          </p>
          <div className="team-grid">
            <div className="team-card reveal">
              <img
                src="/team/Stefan.png"
                alt="Stefan Jäger"
                className="team-card__avatar"
              />
              <h3>Stefan Jäger</h3>
              <div className="team-card__tag">
                Indizes, Gold, Silber, Devisen
              </div>
              <p>
                Spezialist für Rohstoffe, Währungen und die großen Leitindizes
                weltweit.
              </p>
            </div>
            <div className="team-card reveal">
              <img
                src="/team/Michael.png"
                alt="Michael Borgmann"
                className="team-card__avatar"
              />
              <h3>Michael Borgmann</h3>
              <div className="team-card__tag">Aktien &amp; Kryptos</div>
              <p>
                Fokussiert auf präzise charttechnische Einstiege bei
                Einzelaktien und Kryptowährungen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="section section--alt" id="pricing">
        <div className="container">
          <h2 className="text-center reveal">Ab 0,81 € pro Tag</h2>
          <p className="subtitle text-center reveal">
            Weniger als ein Kaffee – für professionelle Trading-Setups.
          </p>
          <div className="pricing-grid">
            {/* Quarterly */}
            <div className="pricing-card reveal">
              <div className="pricing-card__period">Quartalsabo</div>
              <div className="pricing-card__price">
                79 € <span>/ 3 Monate</span>
              </div>
              <div className="pricing-card__detail">26,33 € pro Monat</div>
              <a href="#" className="cta-btn cta-btn--ghost cta-btn--full">
                Jetzt starten
              </a>
            </div>
            {/* 6 months */}
            <div className="pricing-card reveal">
              <div className="pricing-card__period">Halbjahresabo</div>
              <div className="pricing-card__price">
                155 € <span>/ 6 Monate</span>
              </div>
              <div className="pricing-card__detail">
                25,83 € pro Monat
              </div>
              <a href="#" className="cta-btn cta-btn--ghost cta-btn--full">
                Jetzt starten
              </a>
            </div>
            {/* Yearly (featured) */}
            <div className="pricing-card pricing-card--featured reveal">
              <div className="pricing-card__label">Bester Preis</div>
              <div className="pricing-card__period">Jahresabo</div>
              <div className="pricing-card__price">
                297 € <span>/ Jahr</span>
              </div>
              <div className="pricing-card__detail">
                24,75 € pro Monat – nur 0,81 € pro Tag
              </div>
              <a href="#" className="cta-btn cta-btn--full">
                Jetzt starten
              </a>
            </div>
          </div>

          {/* Guarantee */}
          <div className="guarantee reveal">
            <div className="guarantee__shield">🛡️</div>
            <div>
              <h3>30 Tage Geld-zurück-Garantie – ohne Wenn und Aber</h3>
              <p>
                Teste 4 volle Ausgaben. Wenn Du nicht überzeugt bist, bekommst
                Du jeden Cent zurück. Eine formlose E-Mail genügt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container">
          <h2 className="text-center reveal">Häufige Fragen</h2>
          <div className="faq-list">
            <div className="faq-item reveal">
              <button className="faq-question">
                Was genau bekomme ich als Mitglied?
                <span className="faq-chevron">
                  <svg viewBox="0 0 24 24">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
              </button>
              <div className="faq-answer">
                <div className="faq-answer__inner">
                  <p>
                    Jeden Montag erhältst Du die Wochenausgabe mit 4–6 fertig
                    analysierten Trade-Setups inklusive Einstieg, Stop-Loss und
                    Gewinnmitnahme. Dazu ein exklusives Analyse-Video,
                    Eil-Benachrichtigungen unter der Woche und Zugang zum
                    Redaktions-Rückkanal für persönliche Fragen.
                  </p>
                </div>
              </div>
            </div>

            <div className="faq-item reveal">
              <button className="faq-question">
                Wie viel Zeit muss ich pro Woche investieren?
                <span className="faq-chevron">
                  <svg viewBox="0 0 24 24">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
              </button>
              <div className="faq-answer">
                <div className="faq-answer__inner">
                  <p>
                    Etwa 15–30 Minuten. Du liest die Setups, gibst Deine
                    Limit-Orders ein – und der Rest läuft automatisch. Kein
                    ständiges Chartbeobachten nötig.
                  </p>
                </div>
              </div>
            </div>

            <div className="faq-item reveal">
              <button className="faq-question">
                Brauche ich Vorkenntnisse in Technischer Analyse?
                <span className="faq-chevron">
                  <svg viewBox="0 0 24 24">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
              </button>
              <div className="faq-answer">
                <div className="faq-answer__inner">
                  <p>
                    Nein. Die Setups sind komplett aufbereitet mit allen
                    relevanten Kurspunkten. Du kannst sie direkt umsetzen. Das
                    wöchentliche Video hilft Dir zusätzlich, Dein Verständnis
                    für die Märkte zu vertiefen.
                  </p>
                </div>
              </div>
            </div>

            <div className="faq-item reveal">
              <button className="faq-question">
                Wie funktioniert die Geld-zurück-Garantie?
                <span className="faq-chevron">
                  <svg viewBox="0 0 24 24">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
              </button>
              <div className="faq-answer">
                <div className="faq-answer__inner">
                  <p>
                    In den ersten 30 Tagen nach Erhalt der ersten Ausgabe
                    kannst Du ohne Angabe von Gründen kündigen. Eine formlose
                    E-Mail genügt und Du erhältst alle bis dahin bezahlten
                    Beiträge sofort zurück.
                  </p>
                </div>
              </div>
            </div>

            <div className="faq-item reveal">
              <button className="faq-question">
                Was kostet ein vergleichbarer Service?
                <span className="faq-chevron">
                  <svg viewBox="0 0 24 24">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
              </button>
              <div className="faq-answer">
                <div className="faq-answer__inner">
                  <p>
                    Professionelle Trading-Services kosten meist 1.000–2.000 €
                    pro Jahr. Fugmanns Trading Service ist ab 297 € / Jahr
                    verfügbar – ein Bruchteil davon.
                  </p>
                </div>
              </div>
            </div>

            <div className="faq-item reveal">
              <button className="faq-question">
                Kann ich jederzeit kündigen?
                <span className="faq-chevron">
                  <svg viewBox="0 0 24 24">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
              </button>
              <div className="faq-answer">
                <div className="faq-answer__inner">
                  <p>
                    Ja. Du kannst Dein Abo jederzeit zum Ende der jeweiligen
                    Laufzeit kündigen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta">
        <div className="container">
          <h2 className="reveal">
            Bereit für Deinen <span className="text-gold">Rendite-Vorsprung</span>
            ?
          </h2>
          <p className="reveal">
            Starte jetzt risikofrei mit der 30-Tage-Geld-zurück-Garantie.
          </p>
          <a href="#pricing" className="cta-btn reveal">
            Jetzt Mitglied werden
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container">
          <p>
            © 2026 finanzmarktwelt.de &nbsp;·&nbsp; <a href="#">Impressum</a>{' '}
            &nbsp;·&nbsp; <a href="#">Datenschutz</a>
          </p>
        </div>
      </footer>

      {/* Sticky mobile CTA */}
      <div className="sticky-cta" id="stickyCta">
        <a href="#pricing" className="cta-btn">
          Jetzt risikofrei testen
        </a>
      </div>
    </>
  )
}
