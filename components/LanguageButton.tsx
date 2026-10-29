"use client";

import { useState } from "react";
import { GlobeIcon } from "@/components/Icons";
import Sheet from "@/components/ui/Sheet";
import { useLanguage } from "@/lib/LanguageContext";
import type { Language } from "@/lib/translations";

// Die Namen stehen immer in der jeweiligen Sprache, damit man sie auch dann findet, wenn man die aktuelle nicht lesen kann.
const OPTIONS: { id: Language; label: string }[] = [
  { id: "de", label: "Deutsch" },
  { id: "ta", label: "தமிழ்" },
  { id: "en", label: "English" },
];

// Kompakter Knopf mit der aktuellen Sprache; die Auswahl öffnet sich als Pop-up
export default function LanguageButton({ onChange, iconOnly = false }: { onChange?: (lang: Language) => void; /** Nur das Globus-Symbol (z. B. in der Kopfleiste der Startseite) */ iconOnly?: boolean }) {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const current = OPTIONS.find((o) => o.id === language) ?? OPTIONS[0];
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label="Language / Sprache / மொழி"
        className={
          iconOnly
            ? "flex h-11 w-11 items-center justify-center rounded-full text-white/90 transition-colors hover:text-gold"
            : "inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-2 text-sm font-medium text-zinc-100 backdrop-blur-md transition-colors hover:border-gold/50"
        }
      >
        <GlobeIcon className={iconOnly ? "h-7 w-7" : "h-4 w-4 text-gold"} />
        {!iconOnly && <span lang={current.id}>{current.label}</span>}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Language · Sprache · மொழி">
        <div className="grid gap-3" role="radiogroup" aria-label="Language / Sprache / மொழி">
          {OPTIONS.map((o) => {
            const on = o.id === language;
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={on}
                lang={o.id}
                onClick={() => {
                  setLanguage(o.id);
                  onChange?.(o.id);
                  setOpen(false);
                }}
                className={`flex min-h-14 items-center justify-between rounded-2xl border px-5 py-3 text-left text-lg font-medium transition-colors ${
                  on ? "border-gold/70 bg-gold/15 text-gold" : "border-white/15 bg-white/[0.06] text-zinc-50 hover:border-gold/50"
                }`}
              >
                {o.label}
                {on && <span aria-hidden>✓</span>}
              </button>
            );
          })}
        </div>
      </Sheet>
    </>
  );
}
