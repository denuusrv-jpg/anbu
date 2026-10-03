"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/clientErrors";

// Error-Boundary für alle Seiten: meldet den Fehler (bereinigt) und zeigt eine ruhige Fehlerseite.
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportClientError(error, "React Error Boundary");
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-16">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center backdrop-blur-2xl">
        <h1 className="text-2xl font-bold text-zinc-50">Hier ist etwas schiefgelaufen</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          Das tut uns leid. Wir wurden automatisch benachrichtigt. Versuch es bitte noch einmal.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-7 rounded-full bg-gradient-to-b from-gold-light to-gold px-8 py-3 text-sm font-semibold text-zinc-950"
        >
          Erneut versuchen
        </button>
      </div>
    </main>
  );
}
