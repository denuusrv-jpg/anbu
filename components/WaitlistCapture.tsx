"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRightIcon, CheckIcon, RetryIcon } from "@/components/Icons";
import { useLanguage } from "@/lib/LanguageContext";
import Translated from "@/components/Translated";

type Status = "idle" | "loading" | "success";

export default function WaitlistCapture() {
  const [status, setStatus] = useState<Status>("idle");
  const [email, setEmail] = useState("");
  const [sheenKey, setSheenKey] = useState(0);
  const [error, setError] = useState("");
  const { t, language } = useLanguage();

  // Bot-Schutz: Honeypot-Feld und Zeit seit dem Laden des Formulars
  const honeypot = useRef<HTMLInputElement>(null);
  const shownAt = useRef(0);
  const request = useRef<Promise<string | null> | null>(null);
  useEffect(() => {
    shownAt.current = Date.now();
  }, []);

  // Liefert null bei Erfolg, sonst eine Fehlermeldung
  async function send(): Promise<string | null> {
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          website: honeypot.current?.value ?? "",
          elapsed: Date.now() - shownAt.current,
        }),
      });
      if (res.ok) return null;
      const data = await res.json().catch(() => null);
      return data?.error ?? t.waitlistCapture.error;
    } catch {
      return t.waitlistCapture.error;
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status !== "idle") return;
    setError("");
    request.current = send();
    setStatus("loading");
  }

  // Die Amber-Füllung ist fertig: Erfolg erst zeigen, wenn auch der Server geantwortet hat
  async function onFillComplete() {
    if (status !== "loading") return;
    const result = await request.current;
    if (result === null) {
      setStatus("success");
    } else {
      setError(result);
      setStatus("idle");
    }
  }

  function handleRetry() {
    setEmail("");
    setError("");
    setStatus("idle");
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <div
          onMouseEnter={() => {
            if (status === "idle") setSheenKey((k) => k + 1);
          }}
          className="relative isolate overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/50"
        >
          {sheenKey > 0 && (
            <div key={sheenKey} aria-hidden className="pointer-events-none absolute inset-0 z-10">
              <div className="amber-ring absolute inset-0 rounded-2xl shadow-[inset_0_0_0_1px_rgba(242,166,90,0.65),inset_0_0_18px_-4px_rgba(242,166,90,0.35)]" />
              <div className="amber-sheen absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-gold/35 to-transparent" />
            </div>
          )}
          <motion.div
            className="absolute inset-y-0 left-0 -z-10 bg-gradient-to-r from-gold to-gold-light"
            initial={{ width: "0%" }}
            animate={{ width: status === "idle" ? "0%" : "100%" }}
            transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
            onAnimationComplete={onFillComplete}
          />

          <AnimatePresence mode="wait" initial={false}>
            {status === "success" ? (
              <motion.div
                key="success"
                role="status"
                aria-live="polite"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="flex items-center"
              >
                <div className="flex flex-1 items-center justify-center gap-2 py-3.5 pr-2 pl-6 text-sm font-semibold text-zinc-950">
                  <CheckIcon className="h-4 w-4 shrink-0" />
                  <Translated text={t.waitlistCapture.success} />
                </div>
                <button
                  type="button"
                  onClick={handleRetry}
                  aria-label={t.waitlistCapture.retry}
                  title={t.waitlistCapture.retry}
                  className="group m-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-950/15 text-zinc-950 transition hover:scale-105 hover:bg-zinc-950/25 active:scale-95"
                >
                  <RetryIcon className="h-[18px] w-[18px] transition-transform duration-300 group-hover:-rotate-90" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center"
              >
                <label htmlFor="waitlist-capture-email" className="sr-only">
                  {t.waitlistCapture.placeholder}
                </label>
                <input
                  ref={honeypot}
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="pointer-events-none absolute h-0 w-0 opacity-0"
                />
                <input
                  id="waitlist-capture-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  disabled={status === "loading"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.waitlistCapture.placeholder}
                  key={language}
                  className="w-full bg-transparent py-3.5 pr-2 pl-6 text-sm text-white placeholder:text-white/60 focus:outline-none disabled:opacity-80"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  aria-label={t.waitlistCapture.button}
                  className="group m-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold text-zinc-950 transition hover:scale-105 hover:bg-gold-light active:scale-95 disabled:opacity-70"
                >
                  <ArrowRightIcon className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>
      {error && (
        <p role="alert" className="mt-3 text-center text-xs text-rose">
          {error}
        </p>
      )}
    </div>
  );
}
