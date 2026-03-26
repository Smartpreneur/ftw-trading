'use client'

import { useState, useMemo } from 'react'
// no extra imports needed

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface WissenItem {
  q: string
  a: string
}

interface WissenCategory {
  id: string
  label: string
  items: WissenItem[]
}

const WISSEN_DATA: WissenCategory[] = [
  {
    id: 'erste-schritte',
    label: 'Erste Schritte',
    items: [
      {
        q: 'Was ist Fugmann\'s Trading Woche?',
        a: `Fugmann's Trading Woche (FTW) ist ein wöchentlicher Börsenbrief mit charttechnischen Trading-Setups. Erfahrene technische Analysten erstellen handverlesene Handelsszenarien für Aktien, Indizes, Währungen und Kryptowährungen. Jede Ausgabe enthält detaillierte Charts mit Einstiegsmarken, Stop-Loss-Leveln, Take-Profit-Zielen und dem jeweiligen Chance-Risiko-Verhältnis (CRV). Herausgeber ist die Know How Pool GmbH in Hamburg, vertreten durch Markus Fugmann und Stefan Kasper-Behrs.`,
      },
      {
        q: 'Wer sind die Analysten?',
        a: `<strong>Michael Borgmann</strong> ist seit rund 20 Jahren an der Börse aktiv. Er ist technischer Analyst mit Schwerpunkt auf Tech-Aktien und arbeitet bevorzugt mit größeren Zeiteinheiten (Tages- und Wochencharts). Sein Ansatz: Charttechnik geht vor Fundamentaldaten. Er nutzt Formationen wie Doppelböden oder W-Strukturen und setzt auf flexibles Stop-Loss-Management — beim Bottomfishing gibt er den Trades bewusst mehr Luft.<br/><br/><strong>Stefan Jäger</strong> handelt seit etwa 10 Jahren und bevorzugt den 4-Stunden-Chart. Er ist sowohl pro- als auch antizyklisch unterwegs und handelt primär mit CFDs. Neben Aktien analysiert er auch Währungspaare und Indizes. Beide Analysten eint die Überzeugung: Der Chart entscheidet, nicht die Fundamentaldaten.`,
      },
      {
        q: 'Wie erhalte ich die Ausgaben?',
        a: `Die Ausgaben erscheinen <strong>jeden Montag nachmittags</strong> und werden per E-Mail zugestellt. Zusätzlich besprechen Markus Fugmann, Michael Borgmann und Stefan Jäger die Trading-Empfehlungen in einem wöchentlichen Video. Den Link dazu erhalten Sie zusammen mit der Ausgabe. In dringenden Fällen — etwa wenn ein Trigger oder Take-Profit erreicht wird — erhalten Sie Zwischenmeldungen. Das ist aber kein Standardprozess, sondern findet nur bei akutem Handlungsbedarf statt.`,
      },
      {
        q: 'Wie nutze ich den Leserbereich?',
        a: `Den geschützten Leserbereich erreichen Sie über den Link in Ihrer Willkommens-Mail (Plattform: Ablefy). Beim ersten Login vergeben Sie Ihr persönliches Passwort. Nach der Anmeldung finden Sie dort:<ul><li>Die aktuellen und vergangenen Ausgaben</li><li>Vorstellungsvideos der Analysten</li><li>Das wöchentliche Besprechungsvideo</li></ul>Bei Fragen erreichen Sie das Team unter <strong>premium@finanzmarktwelt.de</strong>. Im ersten Monat gilt eine 100%-Geld-zurück-Garantie.`,
      },
    ],
  },
  {
    id: 'setups-verstehen',
    label: 'Setups verstehen',
    items: [
      {
        q: 'Was ist ein Setup?',
        a: `Ein Setup ist ein charttechnisch basiertes Handelsszenario, das vor dem Eingehen einer Position die wichtigsten Parameter definiert:<ul><li><strong>Einstiegsmarke oder -zone:</strong> Der Kursbereich, in dem eine Position eröffnet werden soll</li><li><strong>Stop-Loss (SL):</strong> Die Marke, bei deren Unterschreitung die Position geschlossen wird, um Verluste zu begrenzen</li><li><strong>Take-Profit-Ziele (TP):</strong> Ein oder mehrere Kursziele für Gewinnmitnahmen</li><li><strong>CRV (Chance-Risiko-Verhältnis):</strong> Das Verhältnis zwischen möglichem Gewinn und möglichem Verlust</li><li><strong>WKN/ISIN:</strong> Eindeutige Identifikation des Wertpapiers</li></ul>Diese Marken und Zonen werden aus der Technischen Analyse abgeleitet — etwa über charttechnische Widerstände, Unterstützungen, Formationen oder Fibonacci-Retracements.`,
      },
      {
        q: 'Wie lese ich ein Setup? (Chart + Text)',
        a: `Jedes Setup besteht aus zwei Teilen, die zusammen gelesen werden sollten:<br/><br/><strong>Der Chart:</strong> Zeigt die visuelle Orientierung — horizontale und vertikale Zonen, Formationen (z.B. Doppelboden, Dreiecke), Widerstände und Unterstützungen. Die Charts sind bewusst nicht überladen, damit die wesentlichen Strukturen erkennbar bleiben.<br/><br/><strong>Der Text:</strong> Enthält alle exakten Informationen — Einstiegsmarken, Stop-Loss, Take-Profit, WKN, ISIN, das Handelsszenario und die Begründung. Hier stehen auch Details, die im Chart nicht darstellbar sind. <strong>Wichtig:</strong> Immer beides lesen! Im Text sind oft zusätzliche Informationen versteckt, die im Chart allein nicht erkennbar sind.`,
      },
      {
        q: 'Michaels Ansatz im Detail',
        a: `Michael Borgmann arbeitet bevorzugt mit größeren Zeiteinheiten (Tages- und Wochencharts) und fokussiert sich auf Aktien, besonders Tech-Werte. Kernmerkmale seines Ansatzes:<ul><li><strong>Flexibles Stop-Loss:</strong> Nicht jedes Setup hat sofort einen engen SL. Beim Bottomfishing (Bodensuche) gibt er Trades bewusst mehr Luft und orientiert sich an Gaps oder Supportzonen statt an engen Marken</li><li><strong>Bei TP-Erreichen:</strong> Neubewertung des Szenarios. Mindestens 50% der Position wird geschlossen, der Rest läuft weiter oder wird mit einem SL abgesichert</li><li><strong>Einstieg verpasst?</strong> Kein Problem — es gibt fast immer eine nächste Chance (Pullback, Breakaway-Gap, neuer Trigger)</li><li><strong>Divergenzen:</strong> RSI- und MACD-Divergenzen als wertvolle Zusatzinformation, die die Wahrscheinlichkeit eines Szenarios erhöhen</li><li><strong>Kommunikation:</strong> Bei wichtigen Ereignissen (TP erreicht, Szenario-Änderung) erhalten Leser eine Zwischenmeldung per Mail</li></ul>`,
      },
      {
        q: 'Stefans Ansatz im Detail',
        a: `Stefan Jäger bevorzugt den 4-Stunden-Chart als seine Hauptzeiteinheit und handelt primär mit CFDs. Kernmerkmale:<ul><li><strong>Pro- und antizyklisch:</strong> Besonders gern handelt er Rückläufe in bestehenden Trends (prozyklisch), aber auch Gegenbewegungen nach Korrekturen</li><li><strong>Setup-Inhalt:</strong> Situation beschreiben, Longtrigger definieren, Stop setzen, Take-Profit-Ziele benennen</li><li><strong>Instrumente:</strong> Neben Aktien auch Währungspaare (z.B. USD/JPY) und Indizes</li><li><strong>Kein Schein-Vorschlag:</strong> Er gibt keine konkreten Zertifikate oder Optionsscheine vor — jeder Leser wählt selbst seinen Hebel und sein Instrument</li><li><strong>Neutrale Haltung:</strong> Beim Trading komplett emotionslos und neutral — es zählt nur das Setup und die Wahrscheinlichkeit, nicht die Marktrichtung</li></ul>`,
      },
    ],
  },
  {
    id: 'glossar',
    label: 'Glossar',
    items: [
      { q: 'Allzeithoch (ATH)', a: 'Der historisch höchste jemals bei einem Asset an einer Börse gestellte Kurs. Englisch: all time high.' },
      { q: 'Allzeittief (ATL)', a: 'Der historisch niedrigste jemals bei einem Asset an einer Börse gestellte Kurs. Englisch: all time low.' },
      { q: 'Ask (ASK)', a: 'An der Börse gestellter Briefkurs, zu dem man seine Position verkaufen könnte (siehe auch BID).' },
      { q: 'Asset', a: 'Englisch für Vermögenswert. Im Börsenjargon wird im Prinzip alles, was man irgendwie an der Börse handeln kann, als Asset bezeichnet.' },
      { q: 'Baisse', a: 'Dauerhaft abwärts gerichtete Kurse über einen längeren Zeitraum hinweg (Gegenteil: Hausse).' },
      { q: 'Bär', a: 'Anleger, die lieber mit fallenden Kursen rechnen und entsprechend ausgerichtet sind. Ableitung: Der Bär haut mit seiner Tatze von oben nach unten. Gegenpart zum Bullen.' },
      { q: 'Bärenfalle', a: 'Ein vermeintliches Verkaufs-Signal, welches kurz darauf wieder negiert wird und den Kurs direkt wieder nach oben laufen lässt (Gegenteil: Bullenfalle).' },
      { q: 'Bärisch', a: 'Abwärts gerichtete Markterwartung für fallende Kurse.' },
      { q: 'Bärkeil (bärischer Keil)', a: 'Die Kurse laufen sich immer weiter verjüngend innerhalb eines nach oben rechts geneigten Dreiecks aufwärts, um später plötzlich nach unten wegzubrechen.' },
      { q: 'Bid (BID)', a: 'An der Börse gestellter Geldkurs, zu dem man eine Position kaufen könnte (siehe auch ASK).' },
      { q: 'Buy the dip (BTFD)', a: 'Kurze, schnelle Kursrücksetzer in steilen Rallyebewegungen, die bei Anlaufen der erstbesten Unterstützung kurz eintauchen, aber dann umgehend wieder Käufer finden und die Aufwärtsbewegung dynamisch fortsetzen.' },
      { q: 'Bulle', a: 'Anleger, die lieber mit steigenden Kursen rechnen und entsprechend ausgerichtet sind. Ableitung: Der Bulle stößt mit seinen Hörnern von unten nach oben. Gegenpart zum Bären.' },
      { q: 'Bullenfalle', a: 'Ein vermeintliches Kauf-Signal, welches kurz darauf wieder negiert wird und den Kurs direkt wieder nach unten laufen lässt (Gegenteil: Bärenfalle).' },
      { q: 'Bullkeil (bullischer Keil)', a: 'Die Kurse laufen sich immer weiter verjüngend innerhalb eines nach unten rechts geneigten Dreiecks abwärts, um später plötzlich nach oben auszubrechen.' },
      { q: 'Charttechnik (CT)', a: 'Technische Analyse in all ihren Formen und Varianten. Methode zur Analyse von Kursverläufen anhand von Charts.' },
      { q: 'Close / Schlusskurs (C / SK)', a: 'Schlusskurs eines Wertes innerhalb eines bestimmten individuell gewählten Zeitfensters (Stunde, Tag, Woche etc.).' },
      { q: 'Chance-Risiko-Verhältnis (CRV)', a: 'Verhältnis zwischen theoretisch möglichem Gewinn und möglichem Verlust eines Trading-Setups. Beispiel: Einstieg bei 10 €, TP bei 11 €, SL bei 9,50 € ergibt ein CRV von 2,0. Sollte immer deutlich über 1 liegen.' },
      { q: 'Daytrading', a: 'Kauf und Verkauf einer Position in der Regel noch an ein und demselben Tag. Am Ende eines Handelstages ist man nirgends mehr investiert.' },
      { q: 'Doppelboden (DB)', a: 'Charttechnische Formation, bei der der Kurs mit zeitlichem Abstand zweimal in Folge auf ähnlichem oder fast identischem Kursniveau nach oben abprallt. Wird auch W-Formation genannt.' },
      { q: 'Doppeltop (DT)', a: 'Charttechnische Formation, bei der der Kurs mit zeitlichem Abstand zweimal in Folge auf ähnlichem oder fast identischem Kursniveau nach unten abprallt. Wird auch M-Formation genannt.' },
      { q: 'Echtzeit / Realtime (RT)', a: 'Oftmals kostenpflichtiger Live-Kurs eines Wertes ohne Zeitverzögerung.' },
      { q: 'Elliott-Wellen (EW)', a: 'Besondere und recht komplexe Methode der Technischen Analyse, die Kursmuster in bestimmte definierte Bewegungsstrukturen einteilt (abc, 12345, wxy usw.).' },
      { q: 'Gap', a: 'Eine Kurslücke, die zwischen zwei Handelstagen oder nach einer Kursaussetzung entsteht.' },
      { q: 'GapClose (GC)', a: 'Das Schließen einer aufwärts oder abwärts gerichteten Kurslücke.' },
      { q: 'Hausse', a: 'Dauerhaft aufwärts gerichtete Kurse über einen längeren Zeitraum hinweg (Gegenteil: Baisse).' },
      { q: 'Hebel (Leverage)', a: 'Faktor, um den ein Derivat auf die Veränderung des jeweiligen Basiswertes reagiert.' },
      { q: 'Hedge', a: 'Meistens zeitlich begrenztes Absicherungs-Geschäft, das dem ursprünglichen Investment diametral entgegengesetzt ist. Beispiel: Eine Long-Position wird parallel mit einem Short-Derivat abgesichert.' },
      { q: 'Initial Coin Offering (ICO)', a: 'Methode zur Unternehmensfinanzierung im Kryptobereich, ähnlich wie ein IPO für Aktien. Statt Aktien erhält man Token einer Kryptowährung.' },
      { q: 'Initial Public Offering (IPO)', a: 'Erstmaliges öffentliches Angebot von Wertpapieren eines Unternehmens bei einem Börsengang (Neu-Emission).' },
      { q: 'ISIN', a: 'International Security Identification Number — 12-stellige Buchstaben-/Zahlenkombination, um börsengehandelte Wertpapiere eindeutig zu identifizieren.' },
      { q: 'Inverse Schulter-Kopf-Schulter-Formation (iSKS)', a: 'Bullische charttechnische Umkehr-Formation einer zuvor abwärts gerichteten Kursbewegung.' },
      { q: 'Kapitalerhöhung (KE)', a: 'Verwässerung des Kurses durch Ausgabe neuer Aktien. Oftmals von vorher fallenden und anschließend von steigenden Kursen begleitet.' },
      { q: 'Limit', a: 'Gewünschter Mindest- oder Höchstpreis, den man — je nach Kauf oder Verkauf — maximal bezahlen oder mindestens erhalten möchte.' },
      { q: 'Long', a: 'Spekulation auf steigende Kurse eines Wertes.' },
      { q: 'Nachbörse (NB)', a: 'Nach Ende der offiziellen Börsen-Öffnungszeiten werden in der Nachbörse (oftmals OTC) ebenfalls Kurse gestellt.' },
      { q: 'Over Night Risk (OVN)', a: 'Wer über Nacht investiert bleibt, schleppt ein zusätzliches Risiko mit sich: Nach- oder vorbörsliche Meldungen können den Kurs stärker beeinflussen als erwartet. Es kann zu großen Downgaps oder Upgaps kommen.' },
      { q: 'Over the Counter (OTC)', a: 'Freiverkehr, außerbörslicher Handel über diverse Wertpapierhäuser und Finanzmakler. Oftmals mit höheren Spreads verbunden.' },
      { q: 'Range (Preisspanne)', a: 'Die gehandelte Preisspanne eines Kurses innerhalb einer Kurs-Ober- und Untergrenze der gewählten Zeitspanne.' },
      { q: 'Rücklauf / Pullback (RL)', a: 'Rücklauf auf eine vorherige dynamische Kursbewegung in die Gegenrichtung, meistens um 38%, 50% oder 61,8% (Fibonacci). Nach dem Pullback dreht es dann wieder in die vorherige Richtung.' },
      { q: 'Short', a: 'Spekulation auf fallende Kurse eines Wertes.' },
      { q: 'Spread', a: 'Die Differenz zwischen Ankaufs- und Verkaufskurs eines Assets. Sollte möglichst gering sein.' },
      { q: 'Stop Loss (SL)', a: 'Verkaufsorder, bei der zum nächsten Kurs nach Erreichen/Unterschreiten der gewählten SL-Marke eine Position automatisch verkauft wird. Dient der Verlustbegrenzung.' },
      { q: 'Stop Buy (SB)', a: 'Kauforder, bei der zum nächsten Kurs nach Erreichen/Überschreiten einer Marke eine Position automatisch gekauft wird.' },
      { q: 'Tages-Hoch (TH)', a: 'Höchster Kurs eines Wertes am laufenden Handelstag.' },
      { q: 'Tages-Tief (TT)', a: 'Tiefster Kurs eines Wertes am laufenden Handelstag.' },
      { q: 'Take Profit (TP)', a: 'Kursziel bzw. der geplante Punkt der Gewinnmitnahme eines Trades.' },
      { q: 'Trader\'s Dream (TD)', a: 'Trendumkehr nach ca. 61,8%-igem Rücklauf — ein möglicher Short- oder Long-Einstieg mit gutem CRV.' },
      { q: 'US-Kürzel', a: 'Wertpapiere in den USA haben in der Regel 2- bis 5-stellige Kürzel zur Identifikation (z.B. AAPL, MSFT).' },
      { q: 'Volatilität (VOLA)', a: 'Gibt die von den Marktteilnehmern erwartete Schwankungsbreite an. Der Begriff wird häufig genutzt, wenn es aktuell zu starken Kursschwankungen kommt.' },
      { q: 'Wertpapier-Kennnummer (WKN)', a: 'Besteht aus 6 Zeichen, um Wertpapiere eindeutig zuzuordnen. Wird zunehmend durch die ISIN ersetzt.' },
      { q: 'Zeiteinheit (ZE)', a: 'Individuell eingestellte Zeiteinheit in einem Chart, z.B. Minuten-, Stunden-, Tages-, Wochen- oder Monats-Chart.' },
    ],
  },
  {
    id: 'handelsstrategie',
    label: 'Handelsstrategie',
    items: [
      {
        q: 'Welche Trader-Typen gibt es?',
        a: `Es gibt vier grundlegende Trader-Typen:<br/><br/><strong>1. Investor / Langfristanleger:</strong> Fundamental orientiert, ETF-/Fonds-Sparpläne, Dividenden. Geringer Zeitaufwand.<br/><br/><strong>2. Swing-Trader:</strong> Charttechnisch orientiert, Tages-/Wochencharts, moderater Zeitaufwand. Oft „Feierabend-Trader".<br/><br/><strong>3. Daytrader:</strong> Strikt charttechnisch, alle Positionen am selben Tag schließen. Striktes Risk-/Money-Management.<br/><br/><strong>4. Scalper:</strong> Kleine Stücke aus Trendbewegungen, rund um Eröffnung/Schluss oder Nachrichten. Tageslimits für Gewinn und Verlust.`,
      },
      {
        q: 'Wie realistisch ist meine Trefferquote?',
        a: `Viele streben 90-100% an — das ist unrealistisch.<ul><li>Statistisches Mittel bei vielen Trades: <strong>ca. 50%</strong></li><li>Gute Trader: durchschnittlich <strong>60-65%</strong></li><li>Gehebelt: oft <strong>unter 50%</strong></li></ul><strong>Entscheidend:</strong> Selbst mit 50% kann man profitabel sein — wenn der Profit-Faktor stimmt.`,
      },
      {
        q: 'Was ist der Profit-Faktor (PF)?',
        a: `Die wichtigste Kennzahl. <strong>Berechnung:</strong> Summe aller Gewinne / Summe aller Verluste.<br/><br/><strong>Beispiel:</strong> 100 € durchschnittlicher Gewinn, 66,66 € durchschnittlicher Verlust = PF 1,50.<br/><br/>Der PF muss <strong>zwingend über 1,0</strong> liegen. Gängig bei profitablen Depots: 1,3-2,0.`,
      },
      {
        q: 'Was ist das CRV und warum ist es so wichtig?',
        a: `Das <strong>Chance-Risiko-Verhältnis</strong> ist vor dem Einstieg bekannt.<br/><br/><strong>Beispiel:</strong> Einstieg 10 €, TP 11 € (10% Chance), SL 9,50 € (5% Risiko) = CRV 2,0.<br/><br/>Muss <strong>deutlich über 1</strong> liegen. CRVs unter 1 führen langfristig zu Verlusten. Das Chancen-Potenzial immer konservativ benennen.`,
      },
      {
        q: 'Wie groß sollte meine Positionsgröße sein?',
        a: `Pauschalwerte (ungehebelt):<ul><li><strong>Anfänger:</strong> 1-3% des Gesamtdepots</li><li><strong>Erfahrene:</strong> 3-5% des Gesamtdepots</li><li><strong>Maximum:</strong> ca. 10% — nur in Ausnahmefällen</li></ul>Bei Hebelprodukten entsprechend anpassen.`,
      },
      {
        q: 'Was ist Diversifikation und warum ist sie wichtig?',
        a: `Schutz vor <strong>Klumpenrisiko</strong>. Einzelne Sektoren nicht höher als 10-20% gewichten, hochspekulative max. 5-10%. Peer-Groups laufen oft im Gleichschritt — fällt ein Autowert, fallen meist alle.`,
      },
    ],
  },
  {
    id: 'us-aktien',
    label: 'US-Aktien',
    items: [
      {
        q: 'Wie kann ich Ordergebühren beim Handel mit US-Aktien minimieren?',
        a: `Liquide US-Blue Chips können an <strong>deutschen Börsenplätzen</strong> mit fairen Spreads gehandelt werden. Neobroker bieten oft günstigere Konditionen. US-Broker haben die günstigsten Ordergebühren. <strong>Tipp:</strong> Vor jeder Order alle Börsenplätze vergleichen — Preisunterschiede von 0,1-0,3%.`,
      },
      {
        q: 'Wann sollte ich US-Aktien handeln? (Handelszeiten und Spreads)',
        a: `US-Handelszeiten: <strong>15:30-22:00 MEZ</strong>. Erst nach US-Handelsbeginn sind die Spreads fair. Vorher können sie bei illiquiden Werten <strong>2-3% oder mehr</strong> betragen.`,
      },
      {
        q: 'Welche steuerlichen Aspekte muss ich beachten?',
        a: `<strong>Deutscher Broker:</strong> Sofortige Kapitalertragssteuer. <strong>US-Broker:</strong> Erst bei Steuererklärung — dadurch längerfristig höheres Handelskapital verfügbar. Nachteil: Aufwändigere Steuerunterlagen.`,
      },
      {
        q: 'Wie wirkt sich der Währungseffekt EUR/USD aus?',
        a: `Von Währungsschwankungen ist man beim Handel von US-Aktien <strong>immer</strong> betroffen — auch an deutschen Börsen. Bei mittel- bis langfristiger Ausrichtung gleichen sich die Effekte oft aus. Hedging ist möglich, aber komplex.`,
      },
      {
        q: 'Wo bekomme ich Echtzeitkurse für US-Aktien?',
        a: `Viele Seiten bieten nur 15 Min. verzögerte Kurse. Kostenlose Echtzeitkurse gibt es über alternative Plattformen (z.B. BATS-Kurse) — auf den Cent genau identisch mit den tatsächlich gehandelten Kursen.`,
      },
      {
        q: 'Worauf sollte ich bei der Broker-Auswahl achten?',
        a: `<ul><li><strong>Ordergebühren:</strong> Je niedriger, desto besser</li><li><strong>Handelsuniversum:</strong> Blue Chips, Midcaps, Smallcaps?</li><li><strong>Handelsplätze:</strong> Direkthandel an Weltbörsen</li><li><strong>Vor-/nachbörslicher Handel:</strong> Schnelle Reaktion auf Nachrichten</li></ul>Den universell besten Broker gibt es nicht — hängt vom Handelsstil ab.`,
      },
    ],
  },
  {
    id: 'kryptowaehrungen',
    label: 'Kryptowährungen',
    items: [
      {
        q: 'Wie unterscheiden sich Kryptowährungen von Aktien?',
        a: `<strong>Regulierung:</strong> Weniger streng, in Entwicklung. <strong>Aufbewahrung:</strong> Digitale Wallets statt Depot. <strong>Erträge:</strong> Keine Dividenden, aber Staking möglich. <strong>Steuern:</strong> Ab 1 Jahr Haltedauer ggf. steuerfrei. <strong>Volatilität:</strong> Extrem hoch im Vergleich zu Aktien.`,
      },
      {
        q: 'Wie erkenne ich unseriöse Krypto-Projekte?',
        a: `Im Memecoin-Sektor sind Scam und Pump-and-Dump die Regel. <strong>Market Cap als Filter:</strong> Nur Top 100-200 (coingecko.com, coinmarketcap.com). Aber auch hohe Market Cap schützt nicht komplett — siehe FTX und Terra Luna.`,
      },
      {
        q: 'Was ist die FTW-Kryptostrategie „Volatilität zehnteln"?',
        a: `Prozentzahlen durch 10 dividieren: 20% Krypto = 2% Aktien. Nur 1/10 des üblichen Aktien-Betrags investieren.<ul><li>Nur <strong>Top 100-200</strong> nach Market Cap</li><li>Einstieg in <strong>2-4 Tranchen</strong>, zeitversetzt</li><li>Max. <strong>3-5 Werte</strong> pro Segment, <strong>1-5% Depotanteil</strong></li><li>Krypto-Depot <strong>getrennt</strong> betrachten</li><li>Gesamtanteil am Vermögen: <strong>1-5%, max. 10%</strong></li><li>Langfristige Haltedauer (Halving-Zyklen)</li></ul>`,
      },
      {
        q: 'Worauf achte ich bei der Krypto-Broker-Auswahl?',
        a: `<ul><li>Handelsuniversum und Ordergebühren</li><li>Spreads und Mindest-Ordervolumen</li><li>Sicherheit, Regulierung, Lizenzen</li><li>Transfer auf eigene Wallets möglich?</li><li>Steuerunterlagen verfügbar?</li><li>App-Qualität und Krypto-Sparpläne</li></ul>`,
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightText(text: string, term: string) {
  if (!term) return text
  const regex = new RegExp('(' + escapeRegex(term) + ')', 'gi')
  return text.replace(/(<[^>]*>)|([^<]*)/g, (match, tag, content) => {
    if (tag) return tag
    return content ? content.replace(regex, '<mark class="bg-yellow-200 rounded-sm">$1</mark>') : ''
  })
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ')
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WissenPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const term = search.toLowerCase().trim()

  const filtered = useMemo(() => {
    return WISSEN_DATA
      .filter((cat) => !activeCategory || cat.id === activeCategory)
      .map((cat) => {
        const matchingItems = cat.items.filter((item) => {
          if (!term) return true
          return (
            item.q.toLowerCase().includes(term) ||
            stripHtml(item.a).toLowerCase().includes(term)
          )
        })
        return { ...cat, items: matchingItems }
      })
      .filter((cat) => cat.items.length > 0)
  }, [term, activeCategory])

  const totalResults = filtered.reduce((sum, cat) => sum + cat.items.length, 0)

  function toggleItem(key: string) {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function handleCategoryClick(id: string | null) {
    setActiveCategory(id)
    setSearch('')
    setOpenItems(new Set())
  }

  function handleSearch(value: string) {
    setSearch(value)
    if (value.trim()) {
      setActiveCategory(null)
      const keys = new Set<string>()
      WISSEN_DATA.forEach((cat) =>
        cat.items.forEach((item, i) => {
          const t = value.toLowerCase().trim()
          if (
            item.q.toLowerCase().includes(t) ||
            stripHtml(item.a).toLowerCase().includes(t)
          ) {
            keys.add(`${cat.id}-${i}`)
          }
        })
      )
      setOpenItems(keys)
    } else {
      setOpenItems(new Set())
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Wissensdatenbank</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ausführliches Nachschlagewerk — durchsuche alle Themen oder filtere nach Kategorie.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleCategoryClick(null)}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors ${
            activeCategory === null
              ? 'border-foreground bg-foreground text-background'
              : 'border-border bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground'
          }`}
        >
          Alle
        </button>
        {WISSEN_DATA.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors ${
              activeCategory === cat.id
                ? 'border-foreground bg-foreground text-background'
                : 'border-border bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Wissensdatenbank durchsuchen..."
          className="w-full px-4 py-3 border-2 border-border rounded-lg text-base outline-none transition-colors focus:border-foreground/50 bg-background"
        />
      </div>

      {/* Results */}
      {totalResults === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Keine Ergebnisse gefunden.
        </div>
      ) : (
        <div className="space-y-8">
          {filtered.map((cat) => (
            <div key={cat.id}>
              <h2 className="text-lg font-bold mb-3 pb-2 border-b-2 border-border">
                {cat.label}
              </h2>
              <div className="space-y-2">
                {cat.items.map((item, i) => {
                  const key = `${cat.id}-${i}`
                  const isOpen = openItems.has(key)

                  return (
                    <div
                      key={key}
                      className="rounded-lg border bg-card overflow-hidden shadow-sm"
                    >
                      <button
                        onClick={() => toggleItem(key)}
                        className="w-full flex justify-between items-center px-5 py-4 text-left font-semibold text-[15px] hover:bg-muted/50 transition-colors gap-3"
                      >
                        <span
                          dangerouslySetInnerHTML={{
                            __html: term ? highlightText(item.q, term) : item.q,
                          }}
                        />
                        <svg
                          width="18" height="18" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          className={`shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                      {isOpen && (
                        <div
                          className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground [&_strong]:text-foreground [&_ul]:mt-2 [&_ul]:space-y-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mt-2 [&_ol]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:text-sm [&_mark]:bg-yellow-200 [&_mark]:rounded-sm"
                          dangerouslySetInnerHTML={{
                            __html: term ? highlightText(item.a, term) : item.a,
                          }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
