'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import './styles.css'

// ─── Testimonials ─────────────────────────────────────────────
// Setze enabled: false um ein Zitat auszublenden (z.B. noch keine Freigabe)
const testimonials = [
  {
    enabled: true,
    name: 'Bernhard R.',
    text: 'Habe mit den Setups von Stefan Jäger letztes Jahr ein dickes Plus erwirtschaftet. Was man hier für wenig Geld erhält, ist einfach spitze. Top Niveau. Top Ergebnis.',
  },
  {
    enabled: true,
    name: 'Falk H.',
    text: 'Klar definierte Setups – besonders für Werktätige, welche nicht stets am PC oder Handy sein können.',
  },
  {
    enabled: true,
    name: 'Jörg H.',
    text: 'Sehr konkrete effektive Tipps mit Background, vor allem aber sehr hoher Trefferquote. Kosten amortisieren sich.',
  },
  {
    enabled: true,
    name: 'Murat O.',
    text: 'Sehr transparent, gute und sinnvolle Trades. Alles nachvollziehbar dargelegt und dazu auch noch unterhaltsam!',
  },
  {
    enabled: true,
    name: 'Norman B.',
    text: "Fugmann's Trading Woche ist eine unheimliche Zeitersparnis im Suchen von guten Chancen.",
  },
  {
    enabled: false, // Freigabe ausstehend
    name: 'Stefan K.',
    text: 'Es wirkt schlicht alles unglaublich authentisch, nicht wie bei so vielen Finfluencern. Mein Wissenszuwachs nach jedem Börsenbrief liegt bei mindestens 80 %.',
  },
]

// ─────────────────────────────────────────────────────────────
const DISCOUNT_CODE = 'fugi26'
const pricing = {
  quarterly:  { normal: 99,  discounted: 89,  monthly: 29.67, discountPct: 10 },
  halfYear:   { normal: 188, discounted: 169, monthly: 28.17, discountPct: 10 },
  yearly:     { normal: 329, discounted: 297, monthly: 24.75, discountPct: 10 },
}

export default function LandingPage() {
  const [discountActive, setDiscountActive] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const CHECKOUT_URL = 'https://premium.finanzmarktwelt.de/s/finanzmarktwelt/fugmann-s-trading-woche-d3973543/payment'

  const openCheckout = (e: React.MouseEvent) => {
    e.preventDefault()
    setCheckoutOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeCheckout = () => {
    setCheckoutOpen(false)
    document.body.style.overflow = ''
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlCode = params.get('code')
    if (urlCode?.toLowerCase() === DISCOUNT_CODE) {
      setDiscountActive(true)
      localStorage.setItem('ftw_promo', DISCOUNT_CODE)
    } else if (localStorage.getItem('ftw_promo') === DISCOUNT_CODE) {
      setDiscountActive(true)
    }
  }, [])

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
              Fugmann's <span>Trading Woche</span>
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
            <h1>
              Mit Profi-Wissen mehr <span className="highlight">Rendite</span>{' '}
              erwirtschaften
            </h1>
            <p className="hero__sub">
              Fertige Analysen für jede Marktlage – direkt ins Postfach, sofort umsetzbar
            </p>
            <div className="hero__video">
              <Script src="https://fast.wistia.com/player.js" strategy="afterInteractive" />
              <Script src="https://fast.wistia.com/embed/upvpmi7u5r.js" strategy="afterInteractive" />
              {/* @ts-expect-error – wistia-player ist ein Web Component */}
              <wistia-player media-id="upvpmi7u5r" aspect="1.7777777777777777" />
            </div>
            <a href="#pricing" className="cta-btn">
              4 Wochen testen – 100 % Geld-zurück-Garantie
            </a>
            <div className="hero__trust">
              <div className="trust-item">
                <span className="trust-item__value">70 %+</span>
                <span className="trust-item__label">Trefferquote*</span>
              </div>
              <div className="trust-item">
                <span className="trust-item__value">140+</span>
                <span className="trust-item__label">Analysen pro Jahr*</span>
              </div>
              <div className="trust-item">
                <span className="trust-item__value">30 Tage</span>
                <span className="trust-item__label">Geld-zurück-Garantie</span>
              </div>
            </div>
            <p className="hero__disclaimer">* Bisherige Ergebnisse. Vergangene Performance ist kein Indikator für zukünftige Ergebnisse.</p>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="section section--alt">
        <div className="container">
          <h2 className="text-center reveal">Vielen Anlegern geht es so:</h2>
          <div className="problem-grid">
            <div className="problem-card reveal">
              <h3>Nur Long – kein Plan für fallende Märkte</h3>
              <p>
                Long-ETFs, Long-Aktien – aber keine Strategie, wenn der Markt
                dreht. Das Depot leidet, weil Short-Setups fehlen.
              </p>
            </div>
            <div className="problem-card problem-card--cyan reveal">
              <h3>Keine Zeit für permanente Marktbeobachtung</h3>
              <p>
                Wer beruflich eingespannt ist, kann den Markt nicht ständig
                im Blick behalten. Gute Einstiege laufen weg, bevor man reagiert.
              </p>
            </div>
            <div className="problem-card reveal">
              <h3>Einstieg zu spät, Ausstieg zu früh</h3>
              <p>
                Ohne präzise charttechnische Kurspunkte fehlt die Grundlage
                für den optimalen Einstieg – und für einen disziplinierten Ausstieg.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BRIDGE */}
      <section className="bridge">
        <div className="container">
          <p className="reveal">
            Du profitierst von erfahrenen Analysten, die Dir eine fertige Analyse liefern –
            damit Du <strong>schneller am Markt bist als der Durchschnitt</strong> und
            keine Gelegenheit mehr ungenutzt lässt.
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
                Fertige Trade-Setups mit exakten Kurspunkten landen in
                Deinem Postfach.
              </p>
            </div>
            <div className="step reveal">
              <div className="step__number">2</div>
              <h3>Orders eingeben</h3>
              <p>
                Einstieg, Stopp und Kursziel eintragen.
                Dauert 3 Minuten.
              </p>
            </div>
            <div className="step reveal">
              <div className="step__number">3</div>
              <h3>Gewinne realisieren</h3>
              <p>
                Eil-Benachrichtigungen bei Kurszielerreichung oder Änderungen. Du
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
                  <th>Datum</th>
                  <th>Ergebnis</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="dir-badge dir-badge--long">L</span> DaVita</td>
                  <td>Feb. 2026</td>
                  <td className="pct"><span className="pct-badge">+34,0 %</span></td>
                </tr>
                <tr>
                  <td><span className="dir-badge dir-badge--long">L</span> Colgate-Palmolive</td>
                  <td>Dez. 2025</td>
                  <td className="pct"><span className="pct-badge">+10,5 %</span></td>
                </tr>
                <tr>
                  <td><span className="dir-badge dir-badge--long">L</span> Salesforce</td>
                  <td>Dez. 2025</td>
                  <td className="pct"><span className="pct-badge">+11,8 %</span></td>
                </tr>
                <tr>
                  <td><span className="dir-badge dir-badge--long">L</span> Novo Nordisk</td>
                  <td>Dez. 2025</td>
                  <td className="pct"><span className="pct-badge">+37,6 %</span></td>
                </tr>
                <tr>
                  <td><span className="dir-badge dir-badge--long">L</span> Alibaba</td>
                  <td>Dez. 2025</td>
                  <td className="pct"><span className="pct-badge">+15,3 %</span></td>
                </tr>
                <tr>
                  <td><span className="dir-badge dir-badge--long">L</span> Align Technology</td>
                  <td>Nov. 2025</td>
                  <td className="pct"><span className="pct-badge">+23,4 %</span></td>
                </tr>
                <tr>
                  <td><span className="dir-badge dir-badge--long">L</span> PepsiCo</td>
                  <td>Sep. 2025</td>
                  <td className="pct"><span className="pct-badge">+9,3 %</span></td>
                </tr>
                <tr>
                  <td><span className="dir-badge dir-badge--short">S</span> DAX</td>
                  <td>Sep. 2025</td>
                  <td className="pct"><span className="pct-badge">+2,0 %</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="results-legend">L = Long · S = Short</p>
          <div className="badge-row">
            <div className="badge">70 %+ Trefferquote*</div>
            <div className="badge">140+ Analysen / Jahr*</div>
          </div>
        </div>
      </section>

      {/* SYSTEM FUGMANN */}
      <section className="section fugmann-section">
        <div className="container">
          <h2 className="text-center reveal">Das System Fugmann</h2>
          <p className="subtitle text-center reveal">
            Bewährte Analysen, die zur aktuellen Marktlage passen –<br />
            entwickelt von einem Team, das nach klaren Regeln arbeitet.
          </p>
          <div className="fugmann-cards">
            <div className="fugmann-card reveal">
              <div className="fugmann-card__num">01</div>
              <h3>Strategische Führung</h3>
              <p>
                Markus Fugmann setzt den Rahmen. Er gibt die taktische Richtung
                vor und sorgt dafür, dass das Analysten-Team geschlossen und
                konsequent auf den Markt schaut – nicht jeder für sich.
              </p>
            </div>
            <div className="fugmann-card reveal">
              <div className="fugmann-card__num">02</div>
              <h3>Marktphasen-adaptiert</h3>
              <p>
                Jede Analyse passt zur aktuellen Marktlage – Long in
                Aufwärtstrends, Short wenn der Markt dreht. Kein starres Schema,
                sondern flexibles Handwerk, das in jeder Phase funktioniert.
              </p>
            </div>
            <div className="fugmann-card reveal">
              <div className="fugmann-card__num">03</div>
              <h3>Dein Zeitvorteil</h3>
              <p>
                Während andere noch analysieren, hast Du die fertigen Setups
                bereits im Postfach. Kein stundenlanger Chart-Scan –
                der Vorsprung liegt bei Dir.
              </p>
            </div>
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
                src="/team/Stefan.jpg"
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
                src="/team/Michael.jpg"
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
          <h2 className="text-center reveal">
            {discountActive ? 'Ab 0,82 € pro Tag' : 'Ab 0,90 € pro Tag'}
          </h2>
          <p className="subtitle text-center reveal">
            Weniger als ein Kaffee – für professionelle Trading-Setups.
          </p>

          {discountActive && (
            <div className="discount-active">
              ✓ Rabatt aktiv
            </div>
          )}

          <div className="pricing-grid">
            {/* Quarterly */}
            <div className="pricing-card reveal">
              <div className="pricing-card__period">
                Quartalsabo{discountActive && <span className="pricing-card__discount">-{pricing.quarterly.discountPct} %</span>}
              </div>
              <div className="pricing-card__price">
                {discountActive
                  ? <>{pricing.quarterly.discounted} € <span className="price-original">{pricing.quarterly.normal} €</span> <span>/ 3 Monate</span></>
                  : <>{pricing.quarterly.normal} € <span>/ 3 Monate</span></>
                }
              </div>
              <div className="pricing-card__detail">
                {discountActive ? `${pricing.quarterly.monthly.toFixed(2).replace('.', ',')} € pro Monat` : '33,00 € pro Monat'}
              </div>
              <a href={discountActive ? `/landing/checkout?code=${DISCOUNT_CODE}` : '/landing/checkout'} className="cta-btn cta-btn--ghost cta-btn--full">
                Jetzt starten
              </a>
            </div>
            {/* 6 months */}
            <div className="pricing-card reveal">
              <div className="pricing-card__period">
                Halbjahresabo{discountActive && <span className="pricing-card__discount">-{pricing.halfYear.discountPct} %</span>}
              </div>
              <div className="pricing-card__price">
                {discountActive
                  ? <>{pricing.halfYear.discounted} € <span className="price-original">{pricing.halfYear.normal} €</span> <span>/ 6 Monate</span></>
                  : <>{pricing.halfYear.normal} € <span>/ 6 Monate</span></>
                }
              </div>
              <div className="pricing-card__detail">
                {discountActive ? `${pricing.halfYear.monthly.toFixed(2).replace('.', ',')} € pro Monat` : '31,33 € pro Monat'}
              </div>
              <a href={discountActive ? `/landing/checkout?code=${DISCOUNT_CODE}` : '/landing/checkout'} className="cta-btn cta-btn--ghost cta-btn--full">
                Jetzt starten
              </a>
            </div>
            {/* Yearly (featured) */}
            <div className="pricing-card pricing-card--featured reveal">
              <div className="pricing-card__label">Bester Preis</div>
              <div className="pricing-card__period">
                Jahresabo{discountActive && <span className="pricing-card__discount">-{pricing.yearly.discountPct} %</span>}
              </div>
              <div className="pricing-card__price">
                {discountActive
                  ? <>{pricing.yearly.discounted} € <span className="price-original">{pricing.yearly.normal} €</span> <span>/ Jahr</span></>
                  : <>{pricing.yearly.normal} € <span>/ Jahr</span></>
                }
              </div>
              <div className="pricing-card__detail">
                {discountActive
                  ? `${pricing.yearly.monthly.toFixed(2).replace('.', ',')} € pro Monat – nur 0,82 € pro Tag`
                  : '27,42 € pro Monat – nur 0,90 € pro Tag'
                }
              </div>
              <a href={discountActive ? `/landing/checkout?code=${DISCOUNT_CODE}` : '/landing/checkout'} className="cta-btn cta-btn--full">
                Jetzt starten
              </a>
            </div>
          </div>

          {/* Guarantee */}
          <div className="guarantee reveal">
            <div className="guarantee__shield">
              <svg width="90" height="90" viewBox="0 0 96 96" aria-hidden="true">
                <polygon fill="#00748D" points="48,1 58.9,7.4 71.5,7.3 77.7,18.3 88.7,24.5 88.6,37.1 95,48 88.6,58.9 88.7,71.5 77.7,77.7 71.5,88.7 58.9,88.6 48,95 37.1,88.6 24.5,88.7 18.3,77.7 7.3,71.5 7.4,58.9 1,48 7.4,37.1 7.3,24.5 18.3,18.3 24.5,7.3 37.1,7.4"/>
                <circle cx="48" cy="48" r="41" fill="#00748D"/>
                <circle cx="48" cy="48" r="33" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
                <text x="48" y="30" fill="white" fontSize="7.5" fontWeight="700" textAnchor="middle" letterSpacing="2" fontFamily="Arial,sans-serif">GELD ZURÜCK</text>
                <text x="48" y="39" fill="rgba(255,255,255,0.7)" fontSize="6" textAnchor="middle" fontFamily="Arial,sans-serif">★  ★  ★</text>
                <rect x="14" y="43" width="68" height="16" fill="white"/>
                <text x="48" y="55" fill="#00748D" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="Arial,sans-serif" letterSpacing="0.5">30 TAGE</text>
                <text x="48" y="68" fill="rgba(255,255,255,0.7)" fontSize="6" textAnchor="middle" fontFamily="Arial,sans-serif">★  ★  ★</text>
                <text x="48" y="76" fill="white" fontSize="7.5" fontWeight="700" textAnchor="middle" letterSpacing="2.5" fontFamily="Arial,sans-serif">GARANTIE</text>
              </svg>
            </div>
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

      {/* Testimonials */}
      {testimonials.some(t => t.enabled) && (
        <section className="section section--alt">
          <div className="container">
            <h2 className="text-center reveal">Was Leser sagen</h2>
            <div className="testimonials-grid">
              {testimonials.filter(t => t.enabled).map((t, i) => (
                <div key={i} className="testimonial-card reveal">
                  <p className="testimonial-card__text">„{t.text}"</p>
                  <p className="testimonial-card__name">— {t.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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
                    Jeden Montag erhältst Du die Wochenausgabe mit fundierten
                    Marktanalysen inklusive Einstiegsszenarien, Risikolevel und
                    Kurszielen. Dazu ein exklusives Analyse-Video,
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
            © 2026 finanzmarktwelt.de &nbsp;·&nbsp;{' '}
            <a href="/landing/agb">AGB</a>
            &nbsp;·&nbsp;{' '}
            <a href="/landing/datenschutz">Datenschutz</a>
            &nbsp;·&nbsp;{' '}
            <a href="/landing/impressum">Impressum</a>
          </p>
        </div>
      </footer>

      {/* Sticky mobile CTA */}
      <div className="sticky-cta" id="stickyCta">
        <a href="#pricing" className="cta-btn">
          <span className="sticky-cta__main">4 Wochen testen</span>
          <span className="sticky-cta__sub">100% Geld-zurück-Garantie</span>
        </a>
      </div>

      {/* Checkout Modal */}
      {checkoutOpen && (
        <div className="checkout-overlay" onClick={closeCheckout}>
          <div className="checkout-modal" onClick={e => e.stopPropagation()}>
            <button className="checkout-modal__close" onClick={closeCheckout} aria-label="Schließen">✕</button>
            <iframe
              src={CHECKOUT_URL}
              className="checkout-modal__iframe"
              title="Checkout"
            />
          </div>
        </div>
      )}
    </>
  )
}
