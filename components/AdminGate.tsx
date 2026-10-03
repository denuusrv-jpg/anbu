"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ShieldIcon } from "@/components/Icons";

export const OPEN_ADMIN_EVENT = "dspora:open-admin";

// Geheimer Zugang zum Admin-Bereich: öffnet per Dreifachklick auf "Anmelden"
// (Event) oder per Cmd/Strg + Shift + A. Das Passwort wird nur serverseitig geprüft.
export default function AdminGate() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function openGate() {
      setOpen(true);
    }
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === "KeyA") {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener(OPEN_ADMIN_EVENT, openGate);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_ADMIN_EVENT, openGate);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setPassword("");
      setError("");
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !password) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setOpen(false);
        router.push("/admin");
        return;
      }
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Anmeldung fehlgeschlagen.");
      setPassword("");
      inputRef.current?.focus();
    } catch {
      setError("Keine Verbindung. Bitte erneut versuchen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 px-6 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <motion.form
            onSubmit={submit}
            role="dialog"
            aria-modal="true"
            aria-label="Admin-Zugang"
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60 p-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="pointer-events-none absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-gold/15 blur-3xl" />
            <div className="relative">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold">
                <ShieldIcon />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-zinc-50">
                Admin-Zugang
              </h2>

              <input
                ref={inputRef}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Admin-Passwort eingeben"
                aria-label="Admin-Passwort"
                aria-invalid={error ? true : undefined}
                className="mt-6 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-center text-sm text-white placeholder:text-white/40 focus:border-gold focus:outline-none"
              />

              <p
                role="alert"
                className="mt-3 min-h-5 text-xs text-rose"
              >
                {error}
              </p>

              <button
                type="submit"
                disabled={busy || !password}
                className="cta-premium mt-3 w-full rounded-full bg-gradient-to-b from-gold-light to-gold px-6 py-3 text-sm font-semibold text-zinc-950 transition-opacity disabled:opacity-50"
              >
                {busy ? "Prüfe …" : "Öffnen"}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
