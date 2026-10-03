"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";
import { takePhotos } from "@/lib/draftPhotos";

// Nach dem Klick auf den Anmelde-Link: übernimmt die im Chat gegebenen Antworten als Profil.
export default function ClaimDraft() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const ran = useRef(false);

  const run = useCallback(async () => {
    setFailed(false);
    try {
      const res = await fetch("/api/onboarding/claim", { method: "POST" });
      if (!res.ok) throw new Error("claim failed");
      const data = (await res.json()) as { status: "claimed" | "exists" | "none"; photoCount?: number };

      if (data.status === "claimed") {
        // Fotos, die noch in diesem Browser liegen, in den privaten Speicher des Nutzers laden
        if ((data.photoCount ?? 0) > 0) {
          const blobs = await takePhotos();
          if (blobs.length > 0) {
            const supabase = getBrowserClient();
            const { data: auth } = await supabase.auth.getUser();
            if (auth.user) {
              const storage = supabase.storage.from("profile-photos");
              for (let i = 0; i < blobs.length; i++) {
                await storage.upload(`${auth.user.id}/photo-${i + 1}.jpg`, blobs[i], {
                  contentType: "image/jpeg",
                  upsert: true,
                });
              }
            }
          }
        }
        router.replace("/onboarding/fertig");
      } else if (data.status === "exists") {
        router.replace("/hub");
      } else {
        // Kein Entwurf gefunden (z. B. abgelaufen): Chat jetzt angemeldet durchlaufen
        router.replace("/onboarding");
      }
      router.refresh();
    } catch {
      setFailed(true);
    }
  }, [router]);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    run();
  }, [run]);

  if (failed) {
    return (
      <div className="max-w-sm rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
        <h1 className="text-lg font-semibold text-zinc-50">Das hat leider nicht geklappt</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Deine Antworten konnten gerade nicht übernommen werden. Versuch es noch einmal.
        </p>
        <button
          type="button"
          onClick={run}
          className="cta-premium mt-6 inline-flex rounded-full bg-gradient-to-b from-gold-light to-gold px-6 py-2.5 text-sm font-semibold text-zinc-950"
        >
          Erneut versuchen
        </button>
        <Link href="/hub" className="mt-4 block text-xs text-zinc-500 hover:text-zinc-300">
          Zum Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center" role="status" aria-live="polite">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
      <p className="text-sm text-zinc-400">Dein Profil wird angelegt …</p>
    </div>
  );
}
