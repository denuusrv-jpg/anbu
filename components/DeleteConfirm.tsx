"use client";

import Link from "next/link";
import { useState } from "react";
import FlowingWaveBackground from "@/components/FlowingWaveBackground";
import { useTx } from "@/lib/LanguageContext";

// Letzter Schritt nach dem Klick auf den Link in der Bestätigungs-Mail
export default function DeleteConfirm({ token }: { token: string | null }) {
  const tx = useTx();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    if (!token || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "failed");
      }
      setDone(true);
    } catch (e) {
      setError(
        e instanceof Error && e.message !== "failed" ? tx(e.message) : tx("Das Konto konnte nicht gelöscht werden. Bitte versuch es noch einmal."),
      );
      setBusy(false);
    }
  }

  return (
    <main className="relative isolate flex min-h-[100dvh] items-center justify-center overflow-hidden bg-zinc-950 px-5 py-10">
      <FlowingWaveBackground pulses={false} />
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950/80 p-7 backdrop-blur-md sm:p-9">
        {done ? (
          <>
            <h1 className="text-2xl font-bold text-zinc-50">{tx("Dein Konto wurde gelöscht")}</h1>
            <p className="mt-3 text-base leading-relaxed text-zinc-200">
              {tx("Dein Konto ist gesperrt. Deine Daten bleiben noch 30 Tage gespeichert und werden danach endgültig gelöscht. Alles Gute für dich!")}
            </p>
            <Link href="/" className="cta-premium mt-6 inline-flex w-full justify-center rounded-full bg-gradient-to-b from-gold-light to-gold px-6 py-3 text-sm font-semibold text-zinc-950">
              {tx("Zur Startseite")}
            </Link>
          </>
        ) : token ? (
          <>
            <h1 className="text-2xl font-bold text-zinc-50">{tx("Konto endgültig löschen?")}</h1>
            <p className="mt-3 text-base leading-relaxed text-zinc-200">
              {tx("Du hast die Löschung per E-Mail bestätigt. Mit dem Knopf unten wird dein Konto sofort gesperrt und du verlässt alle Chats. Nach 30 Tagen werden deine Daten endgültig gelöscht.")}
            </p>
            {error && (
              <p role="alert" className="mt-3 text-sm text-rose">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={confirm}
              disabled={busy}
              className="mt-6 w-full rounded-full bg-rose px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? tx("Lösche …") : tx("Ja, Konto jetzt löschen")}
            </button>
            <Link href="/dashboard" className="mt-4 block text-center text-sm text-zinc-300 hover:text-white">
              {tx("Abbrechen")}
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-zinc-50">{tx("Link ungültig")}</h1>
            <p className="mt-3 text-base leading-relaxed text-zinc-200">
              {tx("Dieser Bestätigungslink ist ungültig oder abgelaufen. Bitte fordere in deinem Profil einen neuen an.")}
            </p>
            <Link href="/dashboard" className="cta-premium mt-6 inline-flex w-full justify-center rounded-full bg-gradient-to-b from-gold-light to-gold px-6 py-3 text-sm font-semibold text-zinc-950">
              {tx("Zum Profil")}
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
