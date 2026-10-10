"use client";

import { useLanguage } from "@/lib/LanguageContext";
import type { Language } from "@/lib/translations";

// Sprachschalter: Die Namen stehen immer in der jeweiligen Sprache (Deutsch, தமிழ், English), damit man die Sprache
// auch dann wieder ändern kann, wenn man die aktuelle nicht lesen kann.
const OPTIONS: { id: Language; label: string; lang: string }[] = [
  { id: "de", label: "Deutsch", lang: "de" },
  { id: "ta", label: "தமிழ்", lang: "ta" },
  { id: "en", label: "English", lang: "en" },
];

export default function LanguageSwitch({ onChange, className = "" }: { onChange?: (lang: Language) => void; className?: string }) {
  const { language, setLanguage } = useLanguage();
  return (
    <div role="radiogroup" aria-label="Language / Sprache / மொழி" className={`inline-flex rounded-full border border-white/10 bg-zinc-950/60 p-0.5 ${className}`}>
      {OPTIONS.map((o) => {
        const on = language === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            lang={o.lang}
            onClick={() => {
              setLanguage(o.id);
              onChange?.(o.id);
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${on ? "bg-gradient-to-b from-gold-light to-gold text-zinc-950" : "text-zinc-300 hover:text-white"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
