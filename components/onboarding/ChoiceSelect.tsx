"use client";

import { useState } from "react";
import { PlusIcon } from "@/components/Icons";
import { CUSTOM_PATTERN, MAX_CHOICES, MAX_CUSTOM, type Choice, type Option } from "@/lib/onboarding";
import { Chip, ChipRow, GoldButton } from "@/components/onboarding/ui";

// Mehrfachauswahl aus Vorgaben, dazu eigene Einträge, die man frei hinzufügen kann.
export default function ChoiceSelect({
  options,
  value,
  onChange,
  onConfirm,
  customPlaceholder,
  minTotal = 1,
  confirmLabel = "Weiter",
  extra,
  allowCustom = true,
}: {
  options: Option[];
  value: Choice;
  onChange: (next: Choice) => void;
  onConfirm: () => void;
  customPlaceholder: string;
  minTotal?: number;
  confirmLabel?: string;
  extra?: React.ReactNode;
  allowCustom?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const total = value.ids.length + value.custom.length;

  function toggle(id: string) {
    if (value.ids.includes(id)) {
      onChange({ ...value, ids: value.ids.filter((i) => i !== id) });
    } else if (total < MAX_CHOICES) {
      onChange({ ...value, ids: [...value.ids, id] });
    }
  }

  function addCustom() {
    const text = draft.trim();
    if (!text) return;
    if (!CUSTOM_PATTERN.test(text)) {
      setError("2 bis 30 Zeichen, nur Buchstaben, Zahlen und einfache Zeichen.");
      return;
    }
    const known = options.find((o) => o.label.toLowerCase() === text.toLowerCase());
    if (known) {
      if (!value.ids.includes(known.id) && total < MAX_CHOICES) {
        onChange({ ...value, ids: [...value.ids, known.id] });
      }
    } else if (value.custom.some((c) => c.toLowerCase() === text.toLowerCase())) {
      // schon vorhanden
    } else if (value.custom.length >= MAX_CUSTOM) {
      setError(`Maximal ${MAX_CUSTOM} eigene Einträge.`);
      return;
    } else if (total >= MAX_CHOICES) {
      setError(`Maximal ${MAX_CHOICES} Einträge insgesamt.`);
      return;
    } else {
      onChange({ ...value, custom: [...value.custom, text] });
    }
    setDraft("");
    setError("");
  }

  return (
    <div className="space-y-3">
      <ChipRow>
        {options.map((o) => (
          <Chip key={o.id} selected={value.ids.includes(o.id)} onClick={() => toggle(o.id)}>
            {o.label}
          </Chip>
        ))}
        {value.custom.map((c) => (
          <Chip
            key={c}
            selected
            removable
            onClick={() => onChange({ ...value, custom: value.custom.filter((x) => x !== c) })}
          >
            {c}
          </Chip>
        ))}
      </ChipRow>

      {allowCustom && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addCustom();
          }}
          className="space-y-1.5"
        >
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/60 p-1.5 focus-within:border-gold/60">
            <input
              type="text"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setError("");
              }}
              placeholder={customPlaceholder}
              aria-label={customPlaceholder}
              maxLength={30}
              className="min-w-0 flex-1 bg-transparent px-3 py-1.5 text-sm text-white placeholder:text-white/40 focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Eigenen Eintrag hinzufügen"
              disabled={!draft.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-zinc-200 transition hover:bg-gold hover:text-zinc-950 active:scale-95 disabled:opacity-40"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
          {error && (
            <p role="alert" className="px-1 text-xs text-rose">
              {error}
            </p>
          )}
        </form>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">
            {total === 0
              ? minTotal > 0
                ? "Wähle mindestens eins"
                : "Optional"
              : `${total} gewählt`}
          </span>
          {extra}
        </div>
        <GoldButton onClick={onConfirm} disabled={total < minTotal}>
          {confirmLabel}
        </GoldButton>
      </div>
    </div>
  );
}
