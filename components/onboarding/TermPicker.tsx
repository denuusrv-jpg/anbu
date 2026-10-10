"use client";

import { useState } from "react";
import { CUSTOM_PATTERN, FREE_FIELDS, type Choice, type Option } from "@/lib/onboarding";
import { Chip, ChipRow, GoldButton } from "@/components/onboarding/ui";

// Auswahl für Interessen und Vibe: vier Vorschläge zum Antippen und acht freie Felder für eigene Wörter.
// Insgesamt sind höchstens "max" Einträge möglich. Die Zuordnung ähnlicher Wörter (Tennis ~ Padel) übernimmt die App danach selbst.
export default function TermPicker({
  suggestions,
  allOptions,
  max,
  min,
  placeholder,
  hint,
  onConfirm,
}: {
  suggestions: Option[];
  /** Alle bekannten Vorgaben: ein getipptes Wort wie "Gym" wird zur passenden Vorgabe. */
  allOptions: Option[];
  max: number;
  min: number;
  placeholder: (index: number) => string;
  hint?: string;
  onConfirm: (value: Choice) => void;
}) {
  const [ids, setIds] = useState<string[]>([]);
  const [fields, setFields] = useState<string[]>(() => Array.from({ length: FREE_FIELDS }, () => ""));
  const [error, setError] = useState("");

  const typed = fields.map((f) => f.trim()).filter(Boolean);
  const total = ids.length + typed.length;
  const atMax = total >= max;

  function toggle(id: string) {
    setError("");
    if (ids.indexOf(id) >= 0) setIds(ids.filter((i) => i !== id));
    else if (!atMax) setIds([...ids, id]);
  }

  function setField(index: number, value: string) {
    setError("");
    const next = fields.slice();
    next[index] = value;
    setFields(next);
  }

  function confirm() {
    const outIds = ids.slice();
    const custom: string[] = [];
    for (const word of typed) {
      if (!CUSTOM_PATTERN.test(word)) {
        setError(`„${word}“ ist ungültig: 2 bis 30 Zeichen, nur Buchstaben, Zahlen und einfache Zeichen.`);
        return;
      }
      const known = allOptions.find((o) => o.label.toLowerCase() === word.toLowerCase());
      if (known) {
        if (outIds.indexOf(known.id) < 0) outIds.push(known.id);
      } else if (!custom.some((c) => c.toLowerCase() === word.toLowerCase())) {
        custom.push(word);
      }
    }
    if (outIds.length + custom.length < min) {
      setError(`Bitte gib mindestens ${min} an.`);
      return;
    }
    if (outIds.length + custom.length > max) {
      setError(`Höchstens ${max} Einträge insgesamt.`);
      return;
    }
    onConfirm({ ids: outIds, custom });
  }

  return (
    <div className="space-y-3">
      <ChipRow>
        {suggestions.map((o) => (
          <Chip key={o.id} selected={ids.indexOf(o.id) >= 0} onClick={() => toggle(o.id)}>
            {o.label}
          </Chip>
        ))}
      </ChipRow>
      <div className="grid grid-cols-2 gap-2">
        {fields.map((value, i) => (
          <input
            key={i}
            type="text"
            value={value}
            maxLength={30}
            disabled={atMax && !value}
            onChange={(e) => setField(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (total >= min) confirm();
              }
            }}
            placeholder={placeholder(i)}
            aria-label={`Eigener Begriff ${i + 1}`}
            className="min-w-0 rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-gold/60 focus:outline-none disabled:opacity-40"
          />
        ))}
      </div>
      {hint && <p className="px-1 text-[11px] leading-relaxed text-zinc-500">{hint}</p>}
      {error && (
        <p role="alert" className="px-1 text-xs text-rose">
          {error}
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-zinc-500">
          {total} von {max} gewählt{total < min ? ` (mindestens ${min})` : ""}
        </span>
        <GoldButton onClick={confirm} disabled={total < min}>
          Weiter
        </GoldButton>
      </div>
    </div>
  );
}
