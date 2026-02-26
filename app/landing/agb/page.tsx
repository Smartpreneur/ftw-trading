import type { Metadata } from 'next'
import '../legal.css'

export const metadata: Metadata = {
  title: 'AGB – Fugmann's Trading Woche',
  description: 'Allgemeine Geschäftsbedingungen der Know How Pool GmbH',
}

export default function AGBPage() {
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
          <h1>Allgemeine Geschäftsbedingungen</h1>
          <p>Know How Pool GmbH · Stand: 2026</p>
        </div>

        <div className="legal-content">
          <h2>1. Allgemeines</h2>
          <p>
            1.1 Die vorliegenden Allgemeinen Geschäftsbedingungen (AGB) enthalten die zwischen uns, der Know How
            Pool GmbH, Hans-Henny-Jahnn-Weg 53, 22085 Hamburg, Deutschland (im Folgenden „Verkäufer" oder „wir")
            und einem Verbraucher oder Unternehmer (im Folgenden „Kunden") ausschließlich geltenden Bedingungen für
            den Kauf der angebotenen Waren und Dienstleistungen, soweit diese nicht durch schriftliche Vereinbarungen
            zwischen den Parteien abgeändert werden.
          </p>
          <p>
            Verbraucher im Sinne dieser AGB ist jede natürliche Person, die ein Rechtsgeschäft zu Zwecken abschließt,
            die überwiegend weder ihrer gewerblichen noch ihrer selbständigen beruflichen Tätigkeit zugerechnet werden
            können. Unternehmer im Sinne dieser AGB ist eine natürliche oder juristische Person oder eine rechtsfähige
            Personengesellschaft, die bei Abschluss eines Rechtsgeschäfts in Ausübung ihrer gewerblichen oder
            selbständigen beruflichen Tätigkeit handelt.
          </p>
          <p>
            1.2. Änderungen dieser Geschäftsbedingungen werden dem Kunden schriftlich, per Telefax oder per E-Mail
            mitgeteilt. Widerspricht der Kunde dieser Änderung nicht innerhalb von vier Wochen nach Zugang der
            Mitteilung, gelten die Änderungen durch den Kunden als anerkannt.
          </p>

          <h2>2. Vertragsschluss</h2>
          <p>
            2.1. Die Präsentation der angebotenen Waren und Dienstleistungen stellt kein bindendes Angebot des
            Verkäufers dar. Erst die Bestellung einer Ware oder Dienstleistung durch den Kunden stellt ein bindendes
            Angebot nach § 145 BGB dar. Im Falle der Annahme des Kaufangebots durch den Verkäufer versendet dieser
            an den Kunden eine Auftragsbestätigung per E-Mail.
          </p>
          <p>
            2.2. Nach der Abgabe des Angebots und erfolgreichem Abschluss der Bestellung erhält der Kunde eine
            Kaufbestätigung per E-Mail mit den relevanten Daten. Der Kunde stellt sicher, dass die von ihm eingegebene
            E-Mail-Adresse korrekt ist.
          </p>
          <p>
            2.3. Während des Bestellprozesses hat der Kunde die Möglichkeit, die getätigten Eingaben zu korrigieren.
            Vor Abschluss des Bestellprozesses erhält der Kunde eine Zusammenfassung aller Bestelldetails und erhält
            die Gelegenheit, seine Angaben zu überprüfen.
          </p>
          <p>2.4. Der Vertragsschluss erfolgt in deutscher Sprache.</p>
          <p>2.5. Eine Kontaktaufnahme des Kunden durch den Verkäufer erfolgt per E-Mail.</p>
          <p>
            2.6. Bei digitalen Gütern räumt der Verkäufer dem Kunden ein nicht ausschließliches, örtlich und zeitlich
            unbeschränktes Recht ein, die überlassenen digitalen Inhalte zu privaten sowie zu geschäftlichen Zwecken
            zu nutzen. Eine Weitergabe der Inhalte an Dritte sowie eine Vervielfältigung für Dritte ist nicht gestattet,
            sofern keine Erlaubnis seitens des Verkäufers erteilt wurde.
          </p>

          <h2>3. Zahlungsbedingungen</h2>
          <p>
            3.1. Der Kaufpreis wird sofort mit Bestellung fällig. Die Zahlung der Ware erfolgt mittels der zur Verfügung
            gestellten Zahlungsarten.
          </p>
          <p>
            3.2. Es gelten die zum Zeitpunkt der Bestellung angegebenen Preise. Die in den Preisinformationen
            genannten Preise enthalten die gesetzliche Umsatzsteuer.
          </p>
          <p>
            3.3. Gegen Forderungen des Verkäufers kann der Kunde nur mit unbestrittenen oder rechtskräftig
            festgestellten oder entscheidungsreifen Gegenansprüchen aufrechnen.
          </p>

          <h2>4. Versandbedingungen</h2>
          <p>
            4.1. Der Versand der bestellten Ware erfolgt gemäß den getroffenen Vereinbarungen. Anfallende
            Versandkosten sind jeweils bei der Produktbeschreibung aufgeführt und werden gesondert auf der Rechnung
            ausgewiesen.
          </p>
          <p>
            4.2. Digitale Güter werden dem Kunden in elektronischer Form entweder als Download oder per E-Mail zur
            Verfügung gestellt.
          </p>

          <h2>5. Widerrufsrecht</h2>
          <p>
            Handelt ein Kunde als Verbraucher gem. § 13 BGB, steht ihm grundsätzlich ein gesetzliches Widerrufsrecht
            zu. Handelt ein Kunde als Unternehmer gem. § 14 BGB in Ausübung seiner gewerblichen oder selbständigen
            beruflichen Tätigkeit, steht ihm kein gesetzliches Widerrufsrecht zu. Nähere Informationen zum Widerrufsrecht
            ergeben sich aus der Widerrufsbelehrung auf der Bezahlseite des Produktes.
          </p>

          <h2>6. Offline-Events</h2>
          <p>
            Erwirbt der Kunde ein Ticket zu einem Offline-Event, gelten folgende Bestimmungen:
          </p>
          <p>
            Bei zwingenden organisatorischen oder wirtschaftlichen Gründen, die nicht von dem Veranstalter zu vertreten
            sind, behält sich der Veranstalter das Recht vor, eine Veranstaltung abzusagen. In diesem Fall wird der
            Veranstalter den Kunden unverzüglich informieren sowie die Tickets auf eine Folgeveranstaltung umbuchen.
            Ausfallkosten, gegen die sich der Teilnehmer hätte versichern können (Ticketversicherung,
            Reiserücktrittskostenversicherung etc.), werden auf keinen Fall erstattet.
          </p>
          <p>
            Im Falle höherer Gewalt oder behördlicher Absage der Veranstaltung ist eine Haftung durch den Veranstalter
            ausgeschlossen. Eine Haftung für Stornierungs- oder Umbuchungsgebühren für vom Kunden gebuchte
            Transportmittel oder Übernachtungskosten ist ausgeschlossen.
          </p>

          <h2>7. Gewährleistung</h2>
          <p>
            Soweit die gelieferte Ware mangelhaft ist, ist der Kunde im Rahmen der gesetzlichen Bestimmungen
            berechtigt, Nacherfüllung zu verlangen, von dem Vertrag zurückzutreten bzw. den Vertrag zu beenden, den
            Kaufpreis zu mindern, Schadensersatz oder den Ersatz vergeblicher Aufwendungen zu verlangen. Vor dem
            Kauf mitgeteilte Mängel stellen keinen Gewährleistungsfall dar. Die Verjährungsfrist von
            Gewährleistungsansprüchen für die gelieferte Ware beträgt zwei Jahre ab Erhalt der Ware.
          </p>

          <h2>8. Haftungsbeschränkung</h2>
          <p>
            8.1. Der Verkäufer haftet für Vorsatz und grobe Fahrlässigkeit. Ferner haftet der Verkäufer für die
            fahrlässige Verletzung von Pflichten, deren Erfüllung die ordnungsgemäße Durchführung des Vertrages
            überhaupt erst ermöglicht, deren Verletzung die Erreichung des Vertragszwecks gefährdet und auf deren
            Einhaltung ein Kunde regelmäßig vertraut. Im letztgenannten Fall haftet der Verkäufer jedoch nur für den
            vorhersehbaren, vertragstypischen Schaden. Der Verkäufer haftet nicht für die leicht fahrlässige Verletzung
            anderer als der in den vorstehenden Sätzen genannten Pflichten.
          </p>
          <p>
            8.2. Die vorstehenden Haftungsausschlüsse gelten nicht bei Verletzung von Leben, Körper und Gesundheit.
            Die Haftung nach Produkthaftungsgesetz bleibt unberührt.
          </p>
          <p>
            8.3. Die Datenkommunikation über das Internet kann nach dem derzeitigen Stand der Technik nicht fehlerfrei
            und/oder jederzeit verfügbar gewährleistet werden. Der Verkäufer haftet insoweit weder für die ständige
            noch ununterbrochene Verfügbarkeit des Online-Handelssystems und der Onlineangebote.
          </p>
          <p>
            8.4. Die Europäische Kommission hat ihre Plattform zur Online-Streitbeilegung (OS) eingestellt.
          </p>

          <h2>9. Schlussbestimmungen</h2>
          <p>
            9.1. Änderungen oder Ergänzungen dieser Geschäftsbedingungen bedürfen der Schriftform. Dies gilt auch
            für die Aufhebung dieses Schriftformerfordernisses.
          </p>
          <p>
            9.2. Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Zwingende
            Bestimmungen des Staates, in dem ein Verbraucher seinen gewöhnlichen Aufenthalt hat, bleiben unberührt.
          </p>
          <p>
            9.3. Soweit ein Verbraucher bei Abschluss des Vertrages seinen Wohnsitz oder gewöhnlichen Aufenthalt in
            Deutschland hatte und entweder zum Zeitpunkt der Klageerhebung verlegt hat oder sein Aufenthaltsort zu
            diesem Zeitpunkt unbekannt ist, ist Gerichtsstand für alle Streitigkeiten der Geschäftssitz des Verkäufers.
          </p>
          <p>
            Wenn ein Verbraucher seinen Wohnsitz oder gewöhnlichen Aufenthalt nicht in einem Mitgliedsstaat der
            Europäischen Union hat, sind für alle Streitigkeiten die Gerichte am Geschäftssitz des Verkäufers
            ausschließlich zuständig.
          </p>
          <p>
            Handelt der Kunde als Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches
            Sondervermögen mit Sitz im Hoheitsgebiet der Bundesrepublik Deutschland, ist ausschließlicher
            Gerichtsstand für alle Streitigkeiten aus diesem Vertrag der Geschäftssitz des Verkäufers.
          </p>
          <p>
            9.4. Sollten einzelne Bestimmungen dieses Vertrages unwirksam sein oder den gesetzlichen Regelungen
            widersprechen, so wird hierdurch der Vertrag im Übrigen nicht berührt. Die unwirksame Bestimmung wird
            von den Vertragsparteien einvernehmlich durch eine rechtswirksame Bestimmung ersetzt, welche dem
            wirtschaftlichen Sinn und Zweck der unwirksamen Bestimmung am nächsten kommt.
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
