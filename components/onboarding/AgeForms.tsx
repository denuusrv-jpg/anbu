"use client";

import { useState } from "react";
import { MAX_AGE, MIN_AGE } from "@/lib/onboarding";
import { GoldButton } from "@/components/onboarding/ui";
import { useTx } from "@/lib/LanguageContext";

const input =
  "w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3.5 py-3 text-center text-base text-white placeholder:text-white/40 focus:border-gold/60 focus:outline-none";

function parseAge(text: string): number | null {
  if (!/^\d{1,2}$/.test(text.trim())) return null;
  const n = Number(text.trim());
  return n >= MIN_AGE && n <= MAX_AGE ? n : null;
}

// Eigenes Alter (Pflicht)
export function AgeInput({ onSubmit, initial }: { onSubmit: (age: number) => void; initial?: number }) {
  const tx = useTx();
  const [text, setText] = useState(initial ? String(initial) : "");
  const [error, setError] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const age = parseAge(text);
    if (age === null) {
      setError(tx("Bitte gib dein Alter als Zahl zwischen {min} und {max} an.", { min: MIN_AGE, max: MAX_AGE }));
      return;
    }
    onSubmit(age);
  }
  return (
    <form onSubmit={submit} className="space-y-2.5">
      <input
        type="text"
        inputMode="numeric"
        autoFocus
        value={text}
        maxLength={2}
        onChange={(e) => {
          setText(e.target.value.replace(/[^\d]/g, ""));
          setError("");
        }}
        placeholder={tx("Dein Alter")}
        aria-label={tx("Dein Alter")}
        aria-invalid={error ? true : undefined}
        className={input}
      />
      {error && (
        <p role="alert" className="px-1 text-xs text-rose">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <GoldButton type="submit" disabled={!text.trim()}>
          {tx("Weiter")}
        </GoldButton>
      </div>
    </form>
  );
}

// Gewünschte Altersspanne (von, bis), Pflicht. Vorbelegt mit dem eigenen Alter plus/minus fünf Jahre.
export function AgeRangeInput({
  age,
  onSubmit,
  initial,
}: {
  age: number;
  onSubmit: (min: number, max: number) => void;
  /** Beim Zurückgehen: bereits gegebene Antwort wieder einsetzen */
  initial?: { min: number; max: number };
}) {
  const tx = useTx();
  const [from, setFrom] = useState(String(initial?.min ?? Math.max(MIN_AGE, age - 5)));
  const [to, setTo] = useState(String(initial?.max ?? Math.min(MAX_AGE, age + 5)));
  const [error, setError] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const a = parseAge(from);
    const b = parseAge(to);
    if (a === null || b === null) {
      setError(tx("Bitte gib beide Zahlen zwischen {min} und {max} an.", { min: MIN_AGE, max: MAX_AGE }));
      return;
    }
    if (a > b) {
      setError(tx("„Von“ darf nicht größer sein als „bis“."));
      return;
    }
    onSubmit(a, b);
  }
  return (
    <form onSubmit={submit} className="space-y-2.5">
      <div className="flex items-center gap-3">
        <input
          type="text"
          inputMode="numeric"
          value={from}
          maxLength={2}
          onChange={(e) => {
            setFrom(e.target.value.replace(/[^\d]/g, ""));
            setError("");
          }}
          placeholder={tx("von")}
          aria-label={tx("Gewünschtes Alter von")}
          className={input}
        />
        <span className="text-xs text-zinc-300">{tx("bis")}</span>
        <input
          type="text"
          inputMode="numeric"
          value={to}
          maxLength={2}
          onChange={(e) => {
            setTo(e.target.value.replace(/[^\d]/g, ""));
            setError("");
          }}
          placeholder={tx("bis")}
          aria-label={tx("Gewünschtes Alter bis")}
          className={input}
        />
      </div>
      {error && (
        <p role="alert" className="px-1 text-xs text-rose">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <GoldButton type="submit" disabled={!from.trim() || !to.trim()}>
          {tx("Weiter")}
        </GoldButton>
      </div>
    </form>
  );
}
