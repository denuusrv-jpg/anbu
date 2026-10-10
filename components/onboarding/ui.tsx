"use client";

import { Children, createContext, useContext } from "react";
import { CheckIcon, ArrowRightIcon } from "@/components/Icons";
import { useTx } from "@/lib/LanguageContext";

// Im Karten-Ablauf (Phase 1) werden Auswahlen als große Glas-Flächen untereinander gezeigt
const BigChoicesContext = createContext(false);

export function BigChoices({ children }: { children: React.ReactNode }) {
  return <BigChoicesContext.Provider value>{children}</BigChoicesContext.Provider>;
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  const big = useContext(BigChoicesContext);
  if (big) {
    const many = Children.count(children) > 6;
    return <div className={`grid gap-3 ${many ? "sm:grid-cols-2" : ""}`}>{children}</div>;
  }
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

export function Chip({
  children,
  onClick,
  selected = false,
  subtle = false,
  removable = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  selected?: boolean;
  subtle?: boolean;
  removable?: boolean;
}) {
  const big = useContext(BigChoicesContext);
  if (big) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border px-5 py-3.5 text-left text-base font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-[border-color,background-color,color,transform] duration-200 active:scale-[0.98] ${
          selected
            ? "border-gold/70 bg-gold/15 text-gold"
            : subtle
              ? "border-transparent bg-transparent text-zinc-300 hover:text-white"
              : "border-white/15 bg-white/[0.07] text-zinc-50 hover:border-gold/50 hover:bg-white/10"
        }`}
      >
        <span>{children}</span>
        {selected && !removable && <CheckIcon className="h-5 w-5 shrink-0" />}
        {removable && <span aria-hidden className="text-lg leading-none opacity-70">×</span>}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-[border-color,background-color,color,transform] duration-300 active:scale-95 ${
        selected
          ? "border-gold/60 bg-gold/15 text-gold"
          : subtle
            ? "border-transparent bg-transparent text-zinc-300 hover:text-white"
            : "border-white/10 bg-white/5 text-zinc-200 hover:border-gold/50 hover:text-gold"
      }`}
    >
      {selected && !removable && <CheckIcon className="h-3.5 w-3.5" />}
      {children}
      {removable && <span aria-hidden className="-mr-1 text-base leading-none opacity-70">×</span>}
    </button>
  );
}

export function GoldButton({
  children,
  onClick,
  disabled = false,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="cta-premium inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-gold-light to-gold px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-opacity disabled:opacity-40"
    >
      {children}
      <ArrowRightIcon className="h-4 w-4" />
    </button>
  );
}

export function TextAnswer({
  inputRef,
  value,
  onChange,
  onSubmit,
  placeholder,
  error,
  extra,
  maxLength = 60,
  submitLabel = "Senden",
}: {
  inputRef?: React.RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  error?: string;
  extra?: React.ReactNode;
  maxLength?: number;
  submitLabel?: string;
}) {
  const tx = useTx();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-2"
    >
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/60 p-1.5 focus-within:border-gold/60">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          aria-invalid={error ? true : undefined}
          maxLength={maxLength}
          autoFocus
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-base text-white placeholder:text-white/40 focus:outline-none"
        />
        {extra}
        <button
          type="submit"
          aria-label={tx(submitLabel)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold text-zinc-950 transition hover:bg-gold-light active:scale-95"
        >
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>
      {error && (
        <p role="alert" className="px-1 text-xs text-rose">
          {tx(error)}
        </p>
      )}
    </form>
  );
}

// Eingabefeld-Optik für Formulare im Profil
export const fieldClass =
  "w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3.5 py-2.5 text-base text-white placeholder:text-white/40 focus:border-gold/60 focus:outline-none";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const tx = useTx();
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium text-zinc-300">{tx(label)}</span>
        {hint && <span className="text-[11px] text-zinc-300">{tx(hint)}</span>}
      </div>
      {children}
    </div>
  );
}

// Textfeld für längere Antworten (Freitext, Folgefragen, Wünsche)
export function LongTextAnswer({
  value,
  onChange,
  onSubmit,
  placeholder,
  maxLength,
  minLength = 0,
  skipLabel = "Überspringen",
  onSkip,
  submitLabel = "Senden",
  error,
  rows = 4,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  maxLength: number;
  minLength?: number;
  skipLabel?: string;
  onSkip?: () => void;
  submitLabel?: string;
  error?: string;
  rows?: number;
}) {
  const tx = useTx();
  const length = value.trim().length;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (length >= minLength) onSubmit();
      }}
      className="space-y-2.5"
    >
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && length >= minLength) {
            e.preventDefault();
            onSubmit();
          }
        }}
        rows={rows}
        placeholder={placeholder}
        aria-label={placeholder}
        autoFocus
        className="w-full resize-none rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-base leading-relaxed text-white placeholder:text-white/40 focus:border-gold/60 focus:outline-none"
      />
      {error && (
        <p role="alert" className="px-1 text-xs text-rose">
          {tx(error)}
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-zinc-300">
          {value.length}/{maxLength}
        </span>
        <div className="flex items-center gap-3">
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="text-xs text-zinc-300 transition-colors hover:text-white"
            >
              {tx(skipLabel)}
            </button>
          )}
          <GoldButton type="submit" disabled={length < minLength}>
            {tx(submitLabel)}
          </GoldButton>
        </div>
      </div>
    </form>
  );
}
