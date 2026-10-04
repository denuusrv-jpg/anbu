import Link from "next/link";

export default function Impressum() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-300 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Zurück
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-zinc-50">Impressum</h1>

        <div className="mt-8 space-y-6 text-sm leading-relaxed">
          <p className="rounded-lg border border-gold/30 bg-gold/5 p-4 text-gold">
            Platzhalter — diese Seite ist noch nicht vollständig. Bitte mit
            echten Angaben ersetzen, bevor die Seite öffentlich beworben wird.
          </p>

          <section>
            <h2 className="font-semibold text-zinc-100">
              Angaben gemäß § 5 TMG
            </h2>
            <p className="mt-2">
              [Vor- und Nachname bzw. Firmenname]
              <br />
              [Straße und Hausnummer]
              <br />
              [PLZ und Ort]
              <br />
              [Land]
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-zinc-100">Kontakt</h2>
            <p className="mt-2">
              E-Mail: info@dspora.de
              <br />
              Telefon (optional): [Telefonnummer]
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-zinc-100">
              Verantwortlich für den Inhalt
            </h2>
            <p className="mt-2">[Name der verantwortlichen Person]</p>
          </section>
        </div>
      </div>
    </main>
  );
}
