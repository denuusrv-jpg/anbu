"use client";

import { useEffect, useState } from "react";
import { useTx } from "@/lib/LanguageContext";

// Schriftgröße: drei Stufen relativ zur Standardgröße (kleiner, größer, noch größer). Erneutes Tippen auf die aktive Stufe
// stellt die Standardgröße wieder her. Gespeichert wird nur auf diesem Gerät.
export const TEXT_SIZE_KEY = "dspora-text-size";
const STEPS = [
  { id: "s", scale: 0.9, label: "Kleiner", sample: "text-[13px]" },
  { id: "l", scale: 1.12, label: "Größer", sample: "text-[17px]" },
  { id: "xl", scale: 1.3, label: "Noch größer", sample: "text-[21px]" },
] as const;

export function applyTextSize(id: string | null) {
  const step = STEPS.find((s) => s.id === id);
  document.documentElement.style.setProperty("--text-scale", String(step ? step.scale : 1));
}

export default function TextSizeControl({ className = "" }: { className?: string }) {
  const tx = useTx();
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    try {
      setActive(localStorage.getItem(TEXT_SIZE_KEY));
    } catch {
      // ohne localStorage bleibt die Standardgröße
    }
  }, []);

  function choose(id: string) {
    const next = active === id ? null : id;
    setActive(next);
    applyTextSize(next);
    try {
      if (next) localStorage.setItem(TEXT_SIZE_KEY, next);
      else localStorage.removeItem(TEXT_SIZE_KEY);
    } catch {
      // gilt trotzdem für diese Sitzung
    }
  }

  return (
    <div role="group" aria-label={tx("Schriftgröße")} className={`inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.06] p-1 backdrop-blur-md ${className}`}>
      {STEPS.map((s) => {
        const on = active === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => choose(s.id)}
            aria-pressed={on}
            aria-label={tx(s.label)}
            title={tx(s.label)}
            className={`flex h-9 min-w-9 items-center justify-center rounded-full px-2 font-semibold transition-colors ${s.sample} ${
              on ? "bg-gradient-to-b from-gold-light to-gold text-zinc-950" : "text-zinc-100 hover:text-gold"
            }`}
          >
            A
          </button>
        );
      })}
    </div>
  );
}
