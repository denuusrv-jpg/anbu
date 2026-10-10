"use client";

import { useState } from "react";
import { CUSTOM_PATTERN, MAX_CHOICES, MAX_CUSTOM, type Choice, type Option } from "@/lib/onboarding";
import { Chip, ChipRow, GoldButton } from "@/components/onboarding/ui";
import { useTx } from "@/lib/LanguageContext";

export const INVALID_ENTRY = "2 bis 30 Zeichen, nur Buchstaben, Zahlen und einfache Zeichen.";

// Eigenen Eintrag zu einer Auswahl hinzufügen (reine Funktion, gibt die neue Auswahl oder eine Fehlermeldung zurück)
export function addCustomTo(
  value: Choice,
  text: string,
  options: Option[],
  maxTotal: number = MAX_CHOICES,
): { value: Choice } | { error: string } {
  const total = value.ids.length + value.custom.length;
  if (!CUSTOM_PATTERN.test(text)) return { error: INVALID_ENTRY };
  const known = options.find((o) => o.label.toLowerCase() === text.toLowerCase());
  if (known) {
    if (value.ids.includes(known.id)) return { value };
    if (total >= maxTotal) return { error: `Maximal ${maxTotal} Einträge insgesamt.` };
    return { value: { ...value, ids: [...value.ids, known.id] } };
  }
  if (value.custom.some((c) => c.toLowerCase() === text.toLowerCase())) return { value };
  if (value.custom.length >= MAX_CUSTOM) return { error: `Maximal ${MAX_CUSTOM} eigene Einträge.` };
  if (total >= maxTotal) return { error: `Maximal ${maxTotal} Einträge insgesamt.` };
  return { value: { ...value, custom: [...value.custom, text] } };
}

// Noch nicht mit Enter bestätigten Text beim Weiterklicken automatisch übernehmen
export function flushDraft(
  value: Choice,
  draft: string,
  options: Option[],
  maxTotal: number = MAX_CHOICES,
): { value: Choice; error?: string } {
  const text = draft.trim();
  if (!text) return { value };
  const result = addCustomTo(value, text, options, maxTotal);
  return "error" in result ? { value, error: result.error } : { value: result.value };
}

// Eingabezeile für eigene Einträge: tippen, mit Enter oder Komma hinzufügen. Kein Plus-Knopf nötig,
// der Text wird beim Weiterklicken des umgebenden Formulars automatisch übernommen.
// Bewusst kein <form>: Das Feld steht auch innerhalb des Profil-Formulars (verschachtelte Formulare sind ungültig).
export function CustomEntry({
  placeholder,
  onAdd,
  draft: draftProp,
  onDraftChange,
  hint,
}: {
  placeholder: string;
  /** Gibt eine Fehlermeldung zurück oder null, wenn der Eintrag übernommen wurde. */
  onAdd: (text: string) => string | null;
  /** Optional: Eingabetext von außen steuern, damit er beim Weiterklicken übernommen werden kann. */
  draft?: string;
  onDraftChange?: (value: string) => void;
  hint?: string;
}) {
  const tx = useTx();
  const [inner, setInner] = useState("");
  const [error, setError] = useState("");
  const controlled = draftProp !== undefined;
  const draft = controlled ? draftProp : inner;
  const setDraft = (value: string) => (controlled ? onDraftChange?.(value) : setInner(value));

  function submit() {
    const text = draft.trim();
    if (!text) return;
    const result = onAdd(text);
    if (result) {
      setError(result);
      return;
    }
    setDraft("");
    setError("");
  }

  return (
    <div className="space-y-1.5">
      <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-1.5 focus-within:border-gold/60">
        <input
          type="text"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          enterKeyHint="done"
          maxLength={30}
          className="w-full bg-transparent px-3 py-2 text-base text-white placeholder:text-white/40 focus:outline-none"
        />
      </div>
      {hint && !error && <p className="px-1 text-[11px] text-zinc-300">{hint}</p>}
      {error && (
        <p role="alert" className="px-1 text-xs text-rose">
          {tx(error)}
        </p>
      )}
    </div>
  );
}

// Mehrfachauswahl aus Vorgaben plus eigene Einträge, ohne Bestätigungsknopf (für Formulare)
export function ChoiceChips({
  options,
  value,
  onChange,
  customPlaceholder,
  allowCustom = true,
  maxTotal = MAX_CHOICES,
  draft,
  onDraftChange,
}: {
  options: Option[];
  value: Choice;
  onChange: (next: Choice) => void;
  customPlaceholder: string;
  allowCustom?: boolean;
  maxTotal?: number;
  draft?: string;
  onDraftChange?: (value: string) => void;
}) {
  const tx = useTx();
  const total = value.ids.length + value.custom.length;

  function toggle(id: string) {
    if (value.ids.includes(id)) {
      onChange({ ...value, ids: value.ids.filter((i) => i !== id) });
    } else if (total < maxTotal) {
      onChange({ ...value, ids: [...value.ids, id] });
    }
  }

  function addCustom(text: string): string | null {
    const result = addCustomTo(value, text, options, maxTotal);
    if ("error" in result) return result.error;
    onChange(result.value);
    return null;
  }

  return (
    <div className="space-y-3">
      <ChipRow>
        {options.map((o) => (
          <Chip key={o.id} selected={value.ids.includes(o.id)} onClick={() => toggle(o.id)}>
            {tx(o.label)}
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
        <CustomEntry
          placeholder={customPlaceholder}
          onAdd={addCustom}
          draft={draft}
          onDraftChange={onDraftChange}
        />
      )}
    </div>
  );
}

// Mehrfachauswahl mit Bestätigungsknopf (für den Chat und den Hub)
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
  maxTotal,
}: {
  options: Option[];
  value: Choice;
  onChange: (next: Choice) => void;
  /** Bekommt die endgültige Auswahl inklusive des zuletzt getippten, noch nicht bestätigten Eintrags. */
  onConfirm: (value: Choice) => void;
  customPlaceholder: string;
  minTotal?: number;
  confirmLabel?: string;
  extra?: React.ReactNode;
  allowCustom?: boolean;
  maxTotal?: number;
}) {
  const tx = useTx();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const pending = allowCustom && draft.trim() ? 1 : 0;
  const total = value.ids.length + value.custom.length + pending;

  function confirm() {
    const result = flushDraft(value, allowCustom ? draft : "", options, maxTotal ?? MAX_CHOICES);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError("");
    setDraft("");
    if (result.value !== value) onChange(result.value);
    onConfirm(result.value);
  }

  return (
    <div className="space-y-3">
      <ChoiceChips
        options={options}
        value={value}
        onChange={onChange}
        customPlaceholder={customPlaceholder}
        allowCustom={allowCustom}
        maxTotal={maxTotal}
        draft={draft}
        onDraftChange={(v) => {
          setDraft(v);
          setError("");
        }}
      />
      {error && (
        <p role="alert" className="px-1 text-xs text-rose">
          {error}
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-300">
            {total === 0
              ? minTotal > 0
                ? tx("Wähle mindestens eins")
                : tx("Optional")
              : tx("{n} gewählt", { n: total })}
          </span>
          {extra}
        </div>
        <GoldButton onClick={confirm} disabled={total < minTotal}>
          {tx(confirmLabel)}
        </GoldButton>
      </div>
    </div>
  );
}
