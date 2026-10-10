"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ConsentCheckbox from "@/components/ConsentCheckbox";
import FlowingWaveBackground from "@/components/FlowingWaveBackground";
import { useTx } from "@/lib/LanguageContext";

// Wer schon ein Konto hat, aber die Datenschutzbestimmungen noch nicht bestätigt hat, sieht das einmal vor dem Weitermachen.
export default function ConsentGate() {
  const tx = useTx();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function accept() {
    if (!checked || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: true }),
      });
      if (!res.ok) throw new Error("consent failed");
      router.refresh();
    } catch {
      setError(tx("Das hat leider nicht geklappt. Bitte versuch es noch einmal."));
      setBusy(false);
    }
  }

  return (
    <main className="relative isolate flex min-h-[100dvh] items-center justify-center overflow-hidden bg-zinc-950 px-5 py-10">
      <FlowingWaveBackground pulses={false} />
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950/75 p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_40px_100px_-30px_rgba(0,0,0,0.6)] backdrop-blur-md sm:p-9">
        <h1 className="text-2xl font-bold text-zinc-50">{tx("Bevor es weitergeht")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">
          {tx("Bitte bestätige einmal die Datenschutzbestimmungen, damit wir dein Profil verwenden dürfen.")}
        </p>
        <div className="mt-6">
          <ConsentCheckbox checked={checked} onChange={setChecked} id="consent-gate" />
        </div>
        {error && (
          <p role="alert" className="mt-3 text-xs text-rose">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={accept}
          disabled={!checked || busy}
          className="cta-premium mt-6 w-full rounded-full bg-gradient-to-b from-gold-light to-gold px-6 py-3 text-sm font-semibold text-zinc-950 transition-opacity disabled:opacity-40"
        >
          {busy ? tx("Sende …") : tx("Weiter")}
        </button>
      </div>
    </main>
  );
}
