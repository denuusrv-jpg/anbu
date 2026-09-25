import Link from "next/link";

export default function Datenschutz() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-300 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Zurück
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-zinc-50">
          Datenschutzerklärung
        </h1>

        <div className="mt-8 space-y-6 text-sm leading-relaxed">
          <p className="rounded-lg border border-gold/30 bg-gold/5 p-4 text-gold">
            Platzhalter — diese Seite ist noch nicht vollständig. Bitte mit
            echten Angaben (idealerweise juristisch geprüft) ersetzen, bevor
            die Warteliste echte E-Mails sammelt.
          </p>

          <section>
            <h2 className="font-semibold text-zinc-100">
              1. Verantwortliche Stelle
            </h2>
            <p className="mt-2">
              [Name / Firma]
              <br />
              [Adresse]
              <br />
              E-Mail: [deine-email@beispiel.com]
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-zinc-100">
              2. Welche Daten wir erheben
            </h2>
            <p className="mt-2">
              Wenn du dich für die Warteliste einträgst, speichern wir deine
              E-Mail-Adresse, um dich zu kontaktieren, sobald DSpora startet.
              [Anpassen, sobald die Warteliste technisch an eine Datenbank
              angebunden ist.]
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-zinc-100">
              3. Hosting &amp; Dienstleister
            </h2>
            <p className="mt-2">
              Diese Website wird über Vercel Inc. gehostet. Beim Aufruf der
              Seite verarbeitet Vercel technische Daten (z.B. IP-Adresse) zur
              Bereitstellung der Seite. [Ggf. Auftragsverarbeitungsvertrag /
              weitere Dienstleister ergänzen.]
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-zinc-100">4. Deine Rechte</h2>
            <p className="mt-2">
              Du hast das Recht auf Auskunft, Berichtigung, Löschung und
              Einschränkung der Verarbeitung deiner Daten. Kontaktiere uns
              dafür unter [deine-email@beispiel.com].
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
