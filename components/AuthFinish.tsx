"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/supabase/config";

// Schließt die Anmeldung ab, wenn Supabase die Zugangsdaten im Link-Fragment (#…) mitschickt.
export default function AuthFinish({ next }: { next: string }) {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      setFailed(true);
      return;
    }

    getBrowserClient()
      .auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }: { error: unknown }) => {
        if (error) {
          setFailed(true);
          return;
        }
        // Tokens aus der Adresszeile entfernen, dann weiter
        window.history.replaceState(null, "", window.location.pathname);
        router.replace(safeNextPath(next));
        router.refresh();
      })
      .catch(() => setFailed(true));
  }, [next, router]);

  if (failed) {
    return (
      <div className="max-w-sm rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
        <h1 className="text-lg font-semibold text-zinc-50">Der Link ist nicht mehr gültig</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Er ist abgelaufen oder wurde schon benutzt. Fordere einfach einen neuen an.
        </p>
        <Link
          href={`/login?next=${encodeURIComponent(safeNextPath(next))}`}
          className="cta-premium mt-6 inline-flex rounded-full bg-gradient-to-b from-gold-light to-gold px-6 py-2.5 text-sm font-semibold text-zinc-950"
        >
          Neuen Link anfordern
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center" role="status" aria-live="polite">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
      <p className="text-sm text-zinc-400">Du wirst angemeldet …</p>
    </div>
  );
}
