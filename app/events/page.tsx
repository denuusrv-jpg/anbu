import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";
import FlowingWaveBackground from "@/components/FlowingWaveBackground";

export const metadata = {
  title: "Events — DSpora",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Noch keine Events: hier kann man kostenlos ein Event beantragen, damit es künftig hier erscheint.
export default async function Events() {
  if (!isSupabaseConfigured) redirect("/");
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/events");

  return (
    <main className="relative isolate min-h-screen bg-zinc-950 px-5 py-10 sm:px-8 sm:py-14">
      <FlowingWaveBackground pulses={false} fixed />
      <div className="mx-auto max-w-2xl space-y-5">
        <header>
          <p className="text-xs font-semibold tracking-wide text-gold uppercase">DSpora</p>
          <h1 className="mt-1 text-2xl font-bold text-zinc-50 sm:text-3xl">Events</h1>
        </header>

        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/75 px-6 py-10 text-center backdrop-blur-md">
          <div className="pointer-events-none absolute -top-20 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full glow-gold" />
          <div className="relative">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10 text-gold">
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
                <path d="M3.5 10h17M8 3v4M16 3v4" />
                <path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" strokeWidth={2.2} />
              </svg>
            </div>
            <h2 className="mt-5 text-lg font-semibold text-zinc-50">Aktuell sind keine Events geplant</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zinc-300">
              Du hast eine Idee oder organisierst selbst etwas für die Community? Beantrage dein Event kostenlos bei uns. Nach kurzer Prüfung erscheint es hier für alle Mitglieder.
            </p>
            <Link
              href="/kontakt?thema=events"
              className="cta-premium mt-6 inline-flex items-center rounded-full bg-gradient-to-b from-gold-light to-gold px-7 py-3 text-sm font-semibold text-zinc-950"
            >
              Event kostenlos beantragen
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
