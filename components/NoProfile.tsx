"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import FlowingWaveBackground from "@/components/FlowingWaveBackground";
import { useTx } from "@/lib/LanguageContext";
import { getBrowserClient } from "@/lib/supabase/client";

// Konto ohne gespeichertes Profil (Fragenkatalog nicht zu Ende gebracht): kein Zwang, aber ein klarer Weg dorthin
export default function NoProfile({ email }: { email: string }) {
  const tx = useTx();
  const router = useRouter();

  async function signOut() {
    await getBrowserClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <main className="relative isolate flex min-h-[100dvh] items-center justify-center overflow-hidden bg-zinc-950 px-5 py-10">
      <FlowingWaveBackground pulses={false} fixed />
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950/80 p-7 text-center sm:p-9">
        <p className="text-sm text-zinc-300">{email}</p>
        <h1 className="mt-3 text-2xl font-bold text-zinc-50">{tx("Dein Profil ist noch nicht fertig")}</h1>
        <p className="mt-3 text-base leading-relaxed text-zinc-200">
          {tx("Beantworte kurz die Fragen (etwa 2 Minuten), damit wir passende Leute für dich finden. Danach landest du immer direkt in deinem Profil.")}
        </p>
        <Link
          href="/onboarding"
          className="cta-premium mt-6 inline-flex w-full justify-center rounded-full bg-gradient-to-b from-gold-light to-gold px-6 py-3.5 text-sm font-semibold text-zinc-950"
        >
          {tx("Fragen beantworten")}
        </Link>
        <button type="button" onClick={signOut} className="mt-4 text-sm text-zinc-300 hover:text-white">
          {tx("Abmelden")}
        </button>
      </div>
    </main>
  );
}
