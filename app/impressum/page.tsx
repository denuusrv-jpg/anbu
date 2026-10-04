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
          <section>
            <h2 className="font-semibold text-zinc-100">
              Angaben gemäß § 5 TMG
            </h2>
            <p className="mt-2">
              Denushan Sarves
              <br />
              Wilhelmstraße 56
              <br />
              59067 Hamm
              <br />
              Deutschland
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-zinc-100">Kontakt</h2>
            <p className="mt-2">
              E-Mail: info@dspora.de
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-zinc-100">
              Verantwortlich für den Inhalt
            </h2>
            <p className="mt-2">Denushan Sarves (Anschrift wie oben)</p>
          </section>
        </div>
      </div>
    </main>
  );
}
