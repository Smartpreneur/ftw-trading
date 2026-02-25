import type { Metadata } from 'next'
import '../legal.css'

export const metadata: Metadata = {
  title: 'Datenschutz – Fugmanns Trading Woche',
  description: 'Datenschutzerklärung der Know How Pool GmbH',
}

export default function DatenschutzPage() {
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
          <h1>Datenschutzerklärung</h1>
          <p>Know How Pool GmbH · Stand: 2026</p>
        </div>

        <div className="legal-content">
          <p>Als Amazon-Partner verdient die Know How Pool GmbH (finanzmarktwelt.de) an qualifizierten Verkäufen.</p>

          <h2>1. Datenschutz auf einen Blick</h2>

          <h3>Allgemeine Hinweise</h3>
          <p>
            Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten
            passiert, wenn Sie unsere Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie
            persönlich identifiziert werden können.
          </p>

          <h3>Datenerfassung auf unserer Website</h3>
          <p>
            <strong>Wer ist verantwortlich?</strong> Die Datenverarbeitung auf dieser Website erfolgt durch den
            Websitebetreiber. Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.
          </p>
          <p>
            <strong>Wie erfassen wir Ihre Daten?</strong> Ihre Daten werden zum einen dadurch erhoben, dass Sie uns
            diese mitteilen (z.B. Kontaktformular). Andere Daten werden automatisch beim Besuch der Website durch
            unsere IT-Systeme erfasst (technische Daten wie Browser, Betriebssystem, Uhrzeit des Seitenaufrufs).
          </p>
          <p>
            <strong>Wofür nutzen wir Ihre Daten?</strong> Ein Teil der Daten wird erhoben, um eine fehlerfreie
            Bereitstellung der Website zu gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens
            verwendet werden.
          </p>
          <p>
            <strong>Welche Rechte haben Sie?</strong> Sie haben jederzeit das Recht, unentgeltlich Auskunft über
            Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben
            außerdem ein Recht auf Berichtigung, Sperrung oder Löschung dieser Daten. Hierzu sowie zu weiteren
            Fragen zum Thema Datenschutz können Sie sich jederzeit unter der im Impressum angegebenen Adresse
            an uns wenden. Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.
          </p>
          <p>
            Beim Besuch unserer Website kann Ihr Surf-Verhalten statistisch ausgewertet werden (Cookies,
            Analyseprogramme). Die Analyse Ihres Surf-Verhaltens erfolgt in der Regel anonym. Sie können dieser
            Analyse widersprechen oder sie durch die Nichtbenutzung bestimmter Tools verhindern.
          </p>

          <h2>2. Allgemeine Hinweise und Pflichtinformationen</h2>

          <h3>Datenschutz</h3>
          <p>
            Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre
            personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie
            dieser Datenschutzerklärung.
          </p>

          <h3>Hinweis zur verantwortlichen Stelle</h3>
          <p>
            Know How Pool GmbH<br />
            Hans-Henny-Jahnn-Weg 53<br />
            D-22085 Hamburg<br />
            Telefon: +49 (0)40 76 99 49 07<br />
            E-Mail: <a href="mailto:mail@finanzmarktwelt.de">mail@finanzmarktwelt.de</a>
          </p>

          <h3>Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3>
          <p>
            Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. Sie können eine
            bereits erteilte Einwilligung jederzeit widerrufen. Dazu reicht eine formlose Mitteilung per E-Mail an uns.
            Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.
          </p>

          <h3>Beschwerderecht bei der zuständigen Aufsichtsbehörde</h3>
          <p>
            Im Falle datenschutzrechtlicher Verstöße steht dem Betroffenen ein Beschwerderecht bei der zuständigen
            Aufsichtsbehörde zu. Eine Liste der Datenschutzbeauftragten sowie deren Kontaktdaten können folgendem
            Link entnommen werden:{' '}
            <a href="https://www.bfdi.bund.de/DE/Infothek/Anschriften_Links/anschriften_links-node.html" target="_blank" rel="noopener noreferrer">
              bfdi.bund.de
            </a>.
          </p>

          <h3>Recht auf Datenübertragbarkeit</h3>
          <p>
            Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung eines Vertrags
            automatisiert verarbeiten, an sich oder an einen Dritten in einem gängigen, maschinenlesbaren Format
            aushändigen zu lassen.
          </p>

          <h3>SSL- bzw. TLS-Verschlüsselung</h3>
          <p>
            Diese Seite nutzt aus Sicherheitsgründen eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte
            Verbindung erkennen Sie daran, dass die Adresszeile des Browsers von „http://" auf „https://" wechselt
            und an dem Schloss-Symbol in Ihrer Browserzeile.
          </p>

          <h3>Auskunft, Sperrung, Löschung</h3>
          <p>
            Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche
            Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck
            der Datenverarbeitung sowie ein Recht auf Berichtigung, Sperrung oder Löschung dieser Daten.
          </p>

          <h3>Widerspruch gegen Werbe-Mails</h3>
          <p>
            Der Nutzung von im Rahmen der Impressumspflicht veröffentlichten Kontaktdaten zur Übersendung von nicht
            ausdrücklich angeforderter Werbung und Informationsmaterialien wird hiermit widersprochen.
          </p>

          <h2>3. Datenerfassung auf unserer Website</h2>

          <h3>Cookies</h3>
          <p>
            Die Internetseiten verwenden teilweise sogenannte Cookies. Cookies richten auf Ihrem Rechner keinen
            Schaden an und enthalten keine Viren. Die meisten der von uns verwendeten Cookies sind sogenannte
            „Session-Cookies" – sie werden nach Ende Ihres Besuchs automatisch gelöscht. Andere Cookies bleiben auf
            Ihrem Endgerät gespeichert, bis Sie diese löschen.
          </p>
          <p>
            Sie können Ihren Browser so einstellen, dass Sie über das Setzen von Cookies informiert werden und
            Cookies nur im Einzelfall erlauben oder generell ausschließen. Bei der Deaktivierung von Cookies kann die
            Funktionalität dieser Website eingeschränkt sein.
          </p>

          <h3>Server-Log-Dateien</h3>
          <p>
            Der Provider der Seiten erhebt und speichert automatisch Informationen in sogenannten Server-Log-Dateien:
            Browsertyp und -version, verwendetes Betriebssystem, Referrer URL, Hostname des zugreifenden Rechners,
            Uhrzeit der Serveranfrage, IP-Adresse. Eine Zusammenführung dieser Daten mit anderen Datenquellen wird
            nicht vorgenommen.
          </p>

          <h3>Kontaktformular</h3>
          <p>
            Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben inklusive der von Ihnen
            dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage bei uns gespeichert. Diese Daten geben
            wir nicht ohne Ihre Einwilligung weiter.
          </p>

          <h2>4. Analyse-Tools und Werbung</h2>

          <h3>Google Analytics</h3>
          <p>
            Diese Website nutzt Funktionen des Webanalysedienstes Google Analytics. Anbieter ist die Google Inc.,
            1600 Amphitheatre Parkway, Mountain View, CA 94043, USA. Google Analytics verwendet sogenannte
            „Cookies". Die durch den Cookie erzeugten Informationen über Ihre Benutzung dieser Website werden in der
            Regel an einen Server von Google in den USA übertragen und dort gespeichert.
          </p>
          <p>
            Wir haben auf dieser Website die Funktion IP-Anonymisierung aktiviert. Dadurch wird Ihre IP-Adresse von
            Google innerhalb von Mitgliedstaaten der Europäischen Union vor der Übermittlung in die USA gekürzt.
          </p>
          <p>
            Mehr Informationen:{' '}
            <a href="https://support.google.com/analytics/answer/6004245?hl=de" target="_blank" rel="noopener noreferrer">
              support.google.com/analytics
            </a>
          </p>

          <h3>Google AdSense</h3>
          <p>
            Diese Website benutzt Google AdSense, einen Dienst zum Einbinden von Werbeanzeigen der Google Inc.
            Google AdSense verwendet Cookies und sogenannte Web Beacons. Die dadurch erzeugten Informationen
            werden an einen Server von Google in den USA übertragen. Google wird Ihre IP-Adresse nicht mit anderen
            von Ihnen gespeicherten Daten zusammenführen.
          </p>

          <h2>5. Newsletter</h2>

          <h3>Newsletterdaten</h3>
          <p>
            Wenn Sie den auf der Website angebotenen Newsletter beziehen möchten, benötigen wir von Ihnen eine
            E-Mail-Adresse sowie Informationen, welche uns die Überprüfung gestatten, dass Sie der Inhaber der
            angegebenen E-Mail-Adresse sind und mit dem Empfang des Newsletters einverstanden sind. Diese Daten
            verwenden wir ausschließlich für den Versand der angeforderten Informationen.
          </p>

          <h3>Kostenpflichtige Newsletter</h3>
          <p>
            Zur Abwicklung und Bereitstellung unserer Produkte wird das Website-Baukastensystem der elopage GmbH,
            Potsdamer Straße 125, 10783 Berlin, Deutschland genutzt. Es gelten die Geschäftsbedingungen und
            Datenschutzhinweise des Anbieters:{' '}
            <a href="https://elopage.com/privacy-policy/" target="_blank" rel="noopener noreferrer">elopage.com/privacy-policy</a>
          </p>

          <h2>6. Plugins und Tools</h2>

          <h3>YouTube</h3>
          <p>
            Unsere Website nutzt Plugins der von Google betriebenen Seite YouTube. Betreiber der Seiten ist die
            YouTube, LLC, 901 Cherry Ave., San Bruno, CA 94066, USA. Wenn Sie eine unserer mit einem
            YouTube-Plugin ausgestatteten Seiten besuchen, wird eine Verbindung zu den Servern von YouTube
            hergestellt. Wenn Sie in Ihrem YouTube-Account eingeloggt sind, ermöglichen Sie YouTube, Ihr
            Surfverhalten direkt Ihrem persönlichen Profil zuzuordnen.
          </p>
          <p>
            Weitere Informationen:{' '}
            <a href="https://www.google.de/intl/de/policies/privacy" target="_blank" rel="noopener noreferrer">
              google.de/intl/de/policies/privacy
            </a>
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
