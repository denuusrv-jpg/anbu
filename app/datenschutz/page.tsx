import Link from "next/link";

export const metadata = {
  title: "Datenschutz — DSpora",
};

export default function Datenschutz() {
  const h2 = "font-semibold text-zinc-100";
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-300 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Zurück
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-zinc-50">Datenschutzerklärung</h1>

        <div className="mt-8 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className={h2}>1. Verantwortliche Stelle</h2>
            <p className="mt-2">
              Denushan Sarves
              <br />
              Wilhelmstraße 56, 59067 Hamm
              <br />
              E-Mail: info@dspora.de
            </p>
          </section>

          <section>
            <h2 className={h2}>2. Welche Daten wir verarbeiten und wofür</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                <strong className="text-zinc-200">Warteliste:</strong> Deine E-Mail-Adresse, damit wir dich informieren,
                sobald dein Hub startet.
              </li>
              <li>
                <strong className="text-zinc-200">Konto und Anmeldung:</strong> Deine E-Mail-Adresse. Die Anmeldung läuft
                über einen Link per E-Mail (ohne Passwort) oder optional über einen Passkey. Dafür setzen wir technisch
                notwendige Cookies ein, die deine Anmeldung erhalten.
              </li>
              <li>
                <strong className="text-zinc-200">Profil und Matching (Phase 1):</strong> Richtung (Friends oder Business),
                gewünschte Gruppengröße, Alter und gewünschte Altersspanne, Art der Freundschaft (online oder mit
                Aktivitäten), Wohnort, maximale Fahrzeit mit dem Auto, Treffhäufigkeit, Sprachen, Lebensphase,
                Interessen, Vibe und ein Spitzname. Aus dem Wohnort berechnen wir grobe Koordinaten (auf etwa einen
                Kilometer gerundet) und ordnen dich einem Hub zu. Im Business-Modus zusätzlich Branche, Rolle und Ziele,
                später optional ein Light-CV. Wer dein Profil sehen darf, stellst du selbst ein.
              </li>
              <li>
                <strong className="text-zinc-200">Geschlecht:</strong> Wie du dich identifizierst (männlich, weiblich oder
                ein eigenes Wort, das du selbst wählst) und welche Freundschaften oder Gruppen du suchst. Die Angabe ist
                für das Matching nötig und erfolgt auf Grundlage deiner Einwilligung. Du kannst sie jederzeit in deinem
                Profil ändern.
              </li>
              <li>
                <strong className="text-zinc-200">Profilseite (freiwillig):</strong> Profilbild, bis zu sechs Beiträge mit je
                bis zu sechs Bildern, Bildunterschriften, ein Text über dich, Hobbys sowie optional Vor- und Nachname. Du
                stellst ein, ob dein Profil öffentlich für angemeldete Mitglieder oder privat ist. Bei einem privaten Profil
                sind nur Profilbild und Spitzname sichtbar, und nur für Personen, mit denen du in einem Chat bist. Die Bilder
                liegen in einem nicht öffentlichen Speicher und werden nur über kurzlebige Links angezeigt. Beim Löschen deines
                Kontos werden sie mit gelöscht.
              </li>
              <li>
                <strong className="text-zinc-200">Übersetzen im Chat (auf Wunsch):</strong> Wenn du bei einer Nachricht auf
                „Übersetzen“ tippst oder „Automatisch übersetzen“ einschaltest, schicken wir den Text dieser einen Nachricht
                zur Übersetzung an Anthropic (Claude), ersatzweise an OpenAI. Namen und der übrige Chat gehen nicht mit, wir
                speichern die Übersetzung nicht. Ohne deine Anfrage wird keine Nachricht übersetzt.
              </li>
              <li>
                <strong className="text-zinc-200">Meldungen und Benachrichtigungen:</strong> Meldest du eine Person aus einem
                Chat, speichern wir den Grund, deinen optionalen Hinweis und die Beteiligten, damit wir prüfen können, ob wir
                eingreifen müssen. Nachrichteninhalte lesen wir dabei nicht. Wenn ein neuer Chat für dich bereitsteht,
                schicken wir dir eine kurze E-Mail ohne Angaben zu deinem Match. Du kannst sie in deinem Profil ausschalten.
              </li>
              <li>
                <strong className="text-zinc-200">Matching mit Freigabe:</strong> Aus deinen Antworten berechnet die KI
                Vorschläge, wer gut zu wem passt (Punktesystem). Aus diesen Vorschlägen entsteht erst dann ein Chat, wenn
                wir den Vorschlag geprüft und freigegeben haben. Hubs öffnen wir ebenfalls erst nach unserer Prüfung. Zur
                Prüfung sehen wir in unserem Admin-Bereich die Anmeldelisten eines Hubs und die Grundlage jedes
                Vorschlags (Punkte je Bereich); auffällige Anmeldungen (zum Beispiel doppelte oder Wegwerf-Adressen)
                markieren wir automatisch.
              </li>
              <li>
                <strong className="text-zinc-200">Gespräch (Phase 2, freiwillig) und Steckbrief:</strong> Was du im Chat erzählst, speichern wir
                als Steckbrief, damit wir dich besser kennenlernen und passende Verbindungen vorschlagen können. Der
                Chatverlauf wird deinem Konto zugeordnet, ist für andere Nutzer nicht sichtbar und dient dem Fortsetzen
                des Gesprächs. Einzelne Angaben kannst du in deinem Profil jederzeit entfernen. Nach dem Gespräch werten wir
                es automatisch aus und leiten drei Persönlichkeits-Merkmale (zum Beispiel ruhig oder extrovertiert) sowie
                ausdrücklich Abgelehntes ab. Sie fließen als kleiner Bonus oder Abzug in das Matching ein.
              </li>
              <li>
                <strong className="text-zinc-200">Chats mit Matches:</strong> Wenn wir dich mit anderen zusammenbringen, entsteht ein
                Chat (zu zweit oder in einer Gruppe, höchstens vier Chats gleichzeitig). Die Nachrichten speichern wir, damit ihr sie
                weiterlesen könnt. Sie sind nur für die Teilnehmer des jeweiligen Chats sichtbar. Wir als Betreiber lesen keine
                Nachrichteninhalte. Für die Qualität der Plattform werten wir nur anonyme Zahlen aus (zum Beispiel wie viele Chats
                aktiv sind, ob geantwortet wird, wie oft ein Eisbrecher genutzt wird und das freiwillige Feedback). Ein kurzer
                Match-Steckbrief erklärt oben im Chat, warum ihr gematcht wurdet. Verlässt du einen Chat, wird dein Platz frei. Endet
                ein Chat, wird der Steckbrief sofort gelöscht, der Chat selbst spätestens nach 7 Tagen.
              </li>
              <li>
                <strong className="text-zinc-200">Ideen und Wünsche:</strong> Was du uns als Idee für DSpora schickst,
                speichern wir mit deinem Konto, damit wir die Plattform mit der Community weiterentwickeln können.
              </li>
              <li>
                <strong className="text-zinc-200">Technische Fehler:</strong> Wenn etwas schiefgeht, protokollieren wir den
                Fehler zur Behebung. Vorher werden E-Mail-Adressen, Tokens, Passwörter, IDs und ähnliche personenbezogene
                Angaben automatisch entfernt.
              </li>
            </ul>
          </section>

          <section>
            <h2 className={h2}>3. Rechtsgrundlagen</h2>
            <p className="mt-2">
              Die Verarbeitung für Konto, Profil, Gespräch und Matching erfolgt zur Erfüllung des Nutzungsverhältnisses
              (Art. 6 Abs. 1 lit. b DSGVO). Freiwillige Angaben wie das Geschlecht beruhen auf deiner Einwilligung
              (Art. 6 Abs. 1 lit. a, bei besonderen Kategorien Art. 9 Abs. 2 lit. a DSGVO), die du jederzeit mit Wirkung
              für die Zukunft widerrufen kannst. Das technische Fehler-Tracking dient unserem berechtigten Interesse an
              einem stabilen Betrieb (Art. 6 Abs. 1 lit. f DSGVO). Die Teilnahme am freiwilligen Gespräch (Phase 2) und
              die daraus abgeleiteten Merkmale beruhen auf deiner Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), die du
              jederzeit widerrufen kannst. Über Vorschläge für Chats entscheiden wir nach eigener Prüfung, es gibt keine
              ausschließlich automatisierte Entscheidung mit rechtlicher Wirkung.
            </p>
          </section>

          <section>
            <h2 className={h2}>4. Dienstleister und Empfänger</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                <strong className="text-zinc-200">Vercel Inc.</strong> hostet die Website und verarbeitet dabei technische
                Daten wie die IP-Adresse.
              </li>
              <li>
                <strong className="text-zinc-200">Supabase</strong> betreibt Datenbank, Anmeldung und Dateispeicher
                (Serverstandort: Irland, EU).
              </li>
              <li>
                <strong className="text-zinc-200">Anthropic (Claude)</strong> wertet nach einem freiwilligen Gespräch
                (Phase 2) die Antworten aus und fasst im Admin-Bereich Auffälligkeiten zusammen. Dabei übermitteln wir
                bereinigte Textstellen und deine Basis-Angaben zu Richtung, Interessen und Vibe, aber keinen Namen, keine
                E-Mail-Adresse, kein Geschlecht und kein Alter. Die Verarbeitung kann in den USA stattfinden, dann auf
                Grundlage von Standardvertragsklauseln (Art. 46 DSGVO).
              </li>
              <li>
                <strong className="text-zinc-200">OpenAI</strong> unterstützt uns mit KI: Der Chat nutzt sie für
                Folgefragen, zur Zuordnung eigener Begriffe (nur die eingegebenen Wörter) und zur Einordnung eines
                eingegebenen Wohnorts (nur der Ortsname), und der Admin-Bereich für Auswertungen. Dabei übermitteln wir Textstellen aus deinem
                Gespräch. E-Mail-Adressen, Telefonnummern und Links entfernen wir vorher, dein Geschlecht übermitteln wir
                nicht. Für die Eisbrecher-Fragen im Chat übermitteln wir nur Gemeinsamkeiten wie Interessen und Hub, keine
                Namen und keine Nachrichten. In den Admin-Auswertungen werden nur pseudonymisierte Daten ohne Namen und
                E-Mail-Adressen verwendet. Die Verarbeitung kann in den USA stattfinden, dann auf Grundlage von
                Standardvertragsklauseln (Art. 46 DSGVO).
              </li>
              <li>
                <strong className="text-zinc-200">E-Mail-Versand:</strong> Die Anmelde-Links verschicken wir über Resend
                (Versand aus der EU-Region). Dabei verarbeitet Resend deine E-Mail-Adresse und den Inhalt der Mail.
              </li>
            </ul>
            <p className="mt-2">
              Mit allen Dienstleistern schließen wir, soweit erforderlich, Verträge zur Auftragsverarbeitung.
            </p>
          </section>

          <section>
            <h2 className={h2}>5. Speicherdauer</h2>
            <p className="mt-2">
              Wir speichern deine Daten, solange dein Konto besteht. Wenn du dein Konto in deinem Profil löschst, ist es
              sofort gesperrt und wird nach 30 Tagen automatisch und endgültig gelöscht, einschließlich Profil, Fotos,
              Steckbrief, Chatverlauf und Ideen. Wartelisten-Einträge löschen wir auf Wunsch. Fehlerprotokolle
              enthalten keine personenbezogenen Daten und werden nach der Behebung entfernt.
            </p>
          </section>

          <section>
            <h2 className={h2}>6. Deine Rechte</h2>
            <p className="mt-2">
              Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
              Datenübertragbarkeit und Widerspruch. Vieles kannst du direkt in deinem Profil selbst erledigen (Angaben
              ändern, Steckbrief-Einträge entfernen, Konto löschen). Für alles Weitere schreib uns über das{" "}
              <Link href="/kontakt" className="text-gold hover:underline">
                Kontaktformular
              </Link>{" "}
              oder an info@dspora.de. Du hast außerdem das Recht, dich bei einer Datenschutz-Aufsichtsbehörde
              zu beschweren.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
