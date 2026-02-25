'use client'

import '../styles.css'
import './checkout.css'

const CHECKOUT_URL = 'https://premium.finanzmarktwelt.de/s/finanzmarktwelt/fugmann-s-trading-woche-d3973543/payment'

const benefits = [
  'Wöchentliche Trade-Setups mit exakten Einstiegs-, Stopp- und Kursziel-Punkten',
  'Long & Short – Du profitierst in jeder Marktlage, egal ob Aufwärts- oder Abwärtstrend',
  'Nur 15 Minuten pro Woche – kein stundenlanger Chart-Scan, kein Marktrauschen',
  'Eil-Benachrichtigungen, wenn sich ein Setup verändert – Du verpasst nichts',
  'Zugang zum Redaktions-Rückkanal für persönliche Fragen an das Analysten-Team',
]

export default function CheckoutPage() {
  return (
    <div className="co-page">
      {/* Minimal header */}
      <header className="co-header">
        <div className="co-header__inner">
          <span className="co-logo">
            Fugmanns <span>Trading Woche</span>
          </span>
          <a href="/landing" className="co-back">← Zurück zur Übersicht</a>
        </div>
      </header>

      <main className="co-main">
        {/* Left: Product summary */}
        <aside className="co-summary">
          <div className="co-summary__inner">
            <p className="co-summary__label">Du bestellst</p>
            <h1 className="co-summary__title">Fugmanns Trading Woche</h1>
            <p className="co-summary__sub">
              Professionelle Marktanalysen. Jeden Montag. Direkt ins Postfach.
            </p>

            <ul className="co-benefits">
              {benefits.map((b, i) => (
                <li key={i} className="co-benefit">
                  <span className="co-benefit__check">✓</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="co-price-hint">
              Ab 0,81 € pro Tag &nbsp;·&nbsp; weniger als ein Kaffee
            </div>

            <div className="co-guarantee">
              <div className="co-guarantee__shield">
                <svg width="56" height="56" viewBox="0 0 96 96" aria-hidden="true">
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
              <p>
                <strong>30 Tage Geld-zurück-Garantie</strong><br />
                Nicht überzeugt? Jeden Cent zurück – ohne Wenn und Aber.
              </p>
            </div>

            <div className="co-product-img-wrap">
              <img
                src="/trading-woche-product.png"
                alt="Fugmanns Trading Woche"
                className="co-product-img"
              />
            </div>
          </div>
        </aside>

        {/* Right: ablefy checkout iframe */}
        <section className="co-checkout">
          <iframe
            src={CHECKOUT_URL}
            className="co-iframe"
            title="Checkout – Fugmanns Trading Woche"
            allow="payment"
          />
        </section>
      </main>
    </div>
  )
}
