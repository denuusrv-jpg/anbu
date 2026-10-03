import Link from "next/link";

export const metadata = {
  title: "Onboarding — DSpora",
};

export default function Onboarding() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-16">
      <div className="mx-auto max-w-md text-center">
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-gold uppercase backdrop-blur-md">
          Onboarding
        </span>
        <h1 className="mt-5 text-3xl font-bold text-zinc-50 uppercase sm:text-4xl">
          KI-Chatbot
        </h1>
        <p className="mt-4 text-base leading-relaxed text-zinc-400">
          Hier entsteht der Persönlichkeits-Check. Diese Seite ist vorerst ein
          Platzhalter für den Chatbot.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block text-sm text-zinc-500 hover:text-zinc-300"
        >
          ← Zurück zur Startseite
        </Link>
      </div>
    </main>
  );
}
