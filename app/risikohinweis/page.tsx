import type { Metadata } from 'next'
import '../legal.css'

export const metadata: Metadata = {
  title: "Risikohinweis & Haftungsausschluss – Fugmann's Trading Woche",
  description: 'Disclaimer, Haftungsausschluss und Impressum von Fugmanns Trading Woche',
}

export default function RisikohinweisPage() {
  return (
    <>
      <nav className="legal-nav">
        <div className="legal-nav__inner">
          <a href="/" className="legal-nav__logo">
            Fugmanns <span>Trading Woche</span>
          </a>
          <a href="/" className="legal-nav__back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Zurück
          </a>
        </div>
      </nav>

      <main className="legal-main">
        <div className="legal-header">
          <h1>Risikohinweis &amp; Haftungsausschluss</h1>
          <p>Disclaimer für Fugmann&apos;s Trading Woche</p>
        </div>

        <div className="legal-content">
          <h2>Haftungsausschluss / Disclaimer</h2>
          <p>
            Die Inhalte dieser Publikation sind unabhängig. Sie basiert auf eigenen Recherchen und Erkenntnissen, die wir als Finanz-Journalisten erlangt haben. Sie beruhen auf Quellen, die wir für vertrauenswürdig und zuverlässig halten.
          </p>
          <p>
            Auch wenn sämtliche Artikel und Inhalte sorgfältig recherchiert sind, könnten darin Fehler enthalten sein und Sie sollten Ihre Investment-Entscheidung nicht allein basierend auf diesen Informationen treffen. Trotz sorgfältiger Erstellung können wir für die Richtigkeit der Angaben und Kurse keine Gewähr übernehmen.
          </p>
          <p>
            Die in dieser Publikation enthaltenen Meinungen und Inhalte dienen ausschließlich der Information. Sie begründen kein Haftungsobligo und stellen keine Aufforderung, Werbung oder Angebot zum Kauf oder Verkauf von Wertpapieren dar. Die beschriebenen Meinungen, Strategien und Informationen sind weder eine allgemeine noch eine persönliche Beratung und können diese auch nicht ersetzen. Die Inhalte spiegeln lediglich die Meinung der Redaktion wider.
          </p>
          <p>
            Die Analysen und Empfehlungen dieser Publikation berücksichtigen in keiner Weise Ihre persönliche Anlagesituation.
          </p>

          <h2>Risikohinweis</h2>
          <p>
            Aufgrund der spekulativen Risiken, die mit Anlagen in Aktien, Derivaten, CFDs oder Kryptowährungen verbunden sind, sollten solche Anlagen grundsätzlich nicht auf Kredit finanziert werden. Die empfohlenen Werte beinhalten spekulative Risiken, die im ungünstigsten Fall zu einem Totalverlust der eingesetzten Mittel sowie zu einer Nachschusspflicht, d.h. zu Verlusten über das eingesetzte Kapital hinaus, führen können.
          </p>
          <p>
            Es wird daher ausdrücklich davon abgeraten, die Anlagemittel auf nur wenige Aktien, Derivate, CFDs oder Kryptowährungen zu konzentrieren. In der Vergangenheit erzielte Gewinne können zukünftige Ergebnisse nicht garantieren.
          </p>

          <h2>Urheberrecht</h2>
          <p>
            Diese Publikation, sämtliche darin veröffentlichten grafischen Abbildungen und sonstigen Inhalte sind urheberrechtlich geschützt. Alle Rechte liegen bei der Know How Pool GmbH. Nachdruck und Veröffentlichung, auch auszugsweise, sind nicht gestattet. Die Publikationen insgesamt oder teilweise weiterzuleiten, zu verbreiten, Dritten zugänglich zu machen, zu vervielfältigen, zu bearbeiten oder zu übersetzen, ist nur mit vorheriger schriftlicher Genehmigung gestattet.
          </p>

          <h2>Herausgeber</h2>
          <p>
            Fugmann&apos;s Trading Woche wird herausgegeben von:
          </p>
          <p>
            <strong>Know How Pool GmbH</strong><br />
            Hans-Henny-Jahnn-Weg 53<br />
            22085 Hamburg
          </p>
          <p>
            Vertreten durch die Geschäftsführer Markus Fugmann und Stefan Kasper-Behrs.
          </p>

          <h2>Kontakt</h2>
          <p>
            Telefon: <a href="tel:+494076994907">+49 (0)40 76 99 49 07</a><br />
            Telefax: +49 (0)40 450 389 97<br />
            E-Mail: <a href="mailto:premium@finanzmarktwelt.de">premium@finanzmarktwelt.de</a>
          </p>

          <h2>Registrierung</h2>
          <p>
            Eintragung im Handelsregister<br />
            Registergericht: Amtsgericht Hamburg<br />
            Registernummer: HRB105130
          </p>
          <p>
            Umsatzsteuer-Identifikationsnummer gemäß §27 a Umsatzsteuergesetz:<br />
            DE259416078
          </p>
          <p>
            Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:<br />
            Markus Fugmann<br />
            Know How Pool GmbH<br />
            Hans-Henny-Jahnn-Weg 53<br />
            22085 Hamburg
          </p>
        </div>
      </main>
    </>
  )
}
