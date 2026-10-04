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
                <strong className="text-zinc-200">Profil und Matching:</strong> Region, Stadt, Interessen, Vibe,
                gewünschte Gruppengröße, die gewählten Hubs und, wenn du ein Profil anlegst, Anzeigename, Alter,
                Hobbys, Sprachen, Lebensphase, Fun Fact und Fotos. Im Business-Modus zusätzlich Branche, Rolle, Ziele
                und dein Light-CV (Expertise, Erfolge, Links). Wer dein Profil sehen darf, stellst du selbst ein.
              </li>
              <li>
                <strong className="text-zinc-200">Geschlecht (freiwillig):</strong> Wie du dich identifizierst und mit
                wem du dich verbinden möchtest. Die Angabe ist freiwillig und erfolgt auf Grundlage deiner Einwilligung.
                Du kannst sie jederzeit in deinem Profil ändern oder die Option „Möchte ich nicht angeben“ wählen.
              </li>
              <li>
                <strong className="text-zinc-200">Gespräch und Steckbrief:</strong> Was du im Chat erzählst, speichern wir
                als Steckbrief, damit wir dich besser kennenlernen und passende Verbindungen vorschlagen können. Der
                Chatverlauf wird deinem Konto zugeordnet, ist für andere Nutzer nicht sichtbar und dient dem Fortsetzen
                des Gesprächs. Einzelne Angaben kannst du in deinem Profil jederzeit entfernen.
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
              einem stabilen Betrieb (Art. 6 Abs. 1 lit. f DSGVO).
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
                <strong className="text-zinc-200">OpenAI</strong> unterstützt uns mit KI: Der Chat nutzt sie für
                Folgefragen, und der Admin-Bereich für Auswertungen. Dabei übermitteln wir Textstellen aus deinem
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
