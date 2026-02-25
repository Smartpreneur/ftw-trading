import type { Metadata } from 'next'
import '../legal.css'

export const metadata: Metadata = {
  title: 'Impressum – Fugmanns Trading Woche',
  description: 'Impressum der Know How Pool GmbH',
}

export default function ImpressumPage() {
  return (
    <>
      <nav className="legal-nav">
        <div className="legal-nav__inner">
          <a href="/landing" className="legal-nav__logo">
            Fugmanns <span>Trading Woche</span>
          </a>
          <a href="/landing" className="legal-nav__back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Zurück
          </a>
        </div>
      </nav>

      <main className="legal-main">
        <div className="legal-header">
          <h1>Impressum</h1>
          <p>Angaben gemäß § 5 TMG</p>
        </div>

        <div className="legal-content">
          <h2>Geschäftsangaben</h2>
          <p>
            Know How Pool GmbH<br />
            Hans-Henny-Jahnn-Weg 53<br />
            22085 Hamburg<br />
            <br />
            Telefon: <a href="tel:+494076994907">+49 (0)40 76 99 49 07</a><br />
            USt-IdNr.: DE259416078<br />
            Steuer-Nr.: 02/874/01078
          </p>
          <p>
            Die Know How Pool GmbH wird vertreten durch die Geschäftsführer Markus Fugmann und Stefan
            Kasper-Behrs, die sich auch für die Inhalte dieser Website verantwortlich zeichnen.
          </p>

          <h2>Support</h2>
          <p>
            Kunden Service<br />
            Telefon: <a href="tel:+494076994907">+49 (0)40 76 99 49 07</a><br />
            E-Mail: <a href="mailto:premium@finanzmarktwelt.de">premium@finanzmarktwelt.de</a>
          </p>

          <h2>Verbraucherstreitbeilegung</h2>
          <p>
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>

          <h2>Haftung für Inhalte</h2>
          <p>
            Die Inhalte unserer Seiten wurden mit größter Sorgfalt und bestem Gewissen erstellt. Für die Richtigkeit,
            Vollständigkeit und Aktualität der bereitgestellten Seiten und Inhalte können wir jedoch keine Gewähr
            übernehmen. Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen
            Gesetzen verantwortlich. Wir sind als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder
            gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine
            rechtswidrige Tätigkeit hinweisen.
          </p>
          <p>
            Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten
            Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir
            entsprechende Inhalte und Links umgehend entfernen.
          </p>

          <h2>Haftung für Links</h2>
          <p>
            Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben.
            Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten
            verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße
            überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente
            inhaltliche Kontrolle der verlinkten Seiten ist ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht
            zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
          </p>

          <h2>Urheberrecht</h2>
          <p>
            Die auf der Website veröffentlichten Inhalte, Werke und bereitgestellten Informationen unterliegen dem
            deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung
            außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors
            bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch
            gestattet. Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die
            Urheberrechte Dritter beachtet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden,
            bitten wir um einen entsprechenden Hinweis.
          </p>
        </div>
      </main>

      <footer className="legal-footer">
        <p>
          © 2026 finanzmarktwelt.de &nbsp;·&nbsp;{' '}
          <a href="/landing/agb">AGB</a>
          &nbsp;·&nbsp;
          <a href="/landing/datenschutz">Datenschutz</a>
          &nbsp;·&nbsp;
          <a href="/landing/impressum">Impressum</a>
        </p>
      </footer>
    </>
  )
}
