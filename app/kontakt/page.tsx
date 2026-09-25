import Link from "next/link";

export default function Kontakt() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-center sm:px-8">
      <Link
        href="/"
        className="text-sm text-zinc-500 hover:text-zinc-300"
      >
        ← Zurück
      </Link>

      <div className="mx-auto mt-10 max-w-2xl">
        <h1 className="text-3xl font-bold text-zinc-50 sm:text-4xl">
          Kontakt
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-zinc-300">
          Fragen, Feedback oder Presseanfragen? Schreib uns einfach.
        </p>
        <a
          href="mailto:hallo@dspora.app"
          className="mt-6 inline-block rounded-full border border-zinc-800 bg-zinc-900/60 px-6 py-3 text-sm font-semibold text-zinc-100 transition hover:border-gold/50 hover:text-gold"
        >
          hallo@dspora.app
        </a>
      </div>
    </main>
  );
}
