import Link from "next/link";
import { CheckIcon } from "@/components/Icons";

export const metadata = {
  title: "Du bist startklar — DSpora",
  robots: { index: false, follow: false },
};

export default function OnboardingDone() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-16">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_40px_100px_-30px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10 text-gold shadow-[0_0_30px_-8px_rgba(242,166,90,0.6)]">
            <CheckIcon className="h-7 w-7" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-zinc-50 uppercase">
            Du bist startklar!
          </h1>
          <p className="mt-4 text-base leading-relaxed text-zinc-400">
            Danke für deine Antworten. Sobald sich in deiner Region genug
            Leute eintragen, öffnet sich dein Hub und wir melden uns bei dir.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/dashboard"
              className="cta-premium inline-flex w-full items-center justify-center rounded-full bg-gradient-to-b from-gold-light to-gold px-8 py-3 text-sm font-semibold text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_10px_24px_-12px_rgba(242,166,90,0.45)]"
            >
              Zum Dashboard
            </Link>
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/5 px-8 py-3 text-sm font-semibold text-zinc-200 backdrop-blur-md transition-colors hover:border-gold/50 hover:text-gold"
            >
              Webseite besuchen
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
