"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import Translated from "@/components/Translated";
import { OPEN_ADMIN_EVENT } from "@/components/AdminGate";

// Zeitfenster, in dem drei Klicks auf "Anmelden" den Admin-Zugang öffnen
const TRIPLE_CLICK_MS = 600;

export default function WaitlistForm() {
  const { t } = useLanguage();
  const [hint, setHint] = useState(false);
  const clicks = useRef(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (clickTimer.current) clearTimeout(clickTimer.current);
      if (hintTimer.current) clearTimeout(hintTimer.current);
    },
    [],
  );

  // Normaler Klick: dezenter "Bald verfügbar"-Hinweis.
  // Dreifachklick: öffnet den geheimen Admin-Zugang (ohne Hinweis).
  function handleLogin() {
    clicks.current += 1;
    if (clickTimer.current) clearTimeout(clickTimer.current);

    if (clicks.current >= 3) {
      clicks.current = 0;
      setHint(false);
      window.dispatchEvent(new Event(OPEN_ADMIN_EVENT));
      return;
    }

    clickTimer.current = setTimeout(() => {
      clicks.current = 0;
      setHint(true);
      if (hintTimer.current) clearTimeout(hintTimer.current);
      hintTimer.current = setTimeout(() => setHint(false), 2200);
    }, TRIPLE_CLICK_MS);
  }

  function scrollToErfahreMehr() {
    document
      .getElementById("erfahre-mehr")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="relative mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
      <button
        type="button"
        onClick={handleLogin}
        className="cta-premium w-full whitespace-nowrap rounded-full border border-zinc-800 bg-zinc-900/70 px-6 py-3 text-sm font-semibold text-white transition [--sheen-alpha:0.18] hover:border-gold"
      >
        <Translated text={t.waitlist.login} />
      </button>
      <button
        type="button"
        onClick={scrollToErfahreMehr}
        className="cta-premium w-full whitespace-nowrap rounded-full bg-gold px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-gold-light"
      >
        <Translated text={t.waitlist.register} />
      </button>
      <p
        role="status"
        aria-live="polite"
        className={`pointer-events-none absolute top-full left-1/2 mt-3 -translate-x-1/2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs whitespace-nowrap text-zinc-300 backdrop-blur-md transition-opacity duration-300 ${
          hint ? "opacity-100" : "opacity-0"
        }`}
      >
        {hint ? <Translated text={t.waitlist.comingSoon} /> : null}
      </p>
    </div>
  );
}
