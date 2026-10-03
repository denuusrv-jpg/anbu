"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { SystemError } from "@/lib/systemErrors";

const fmt = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  dateStyle: "medium",
  timeStyle: "short",
});

type Sort = "count" | "recent";

// Fehler-Tracking im Admin: gleiche Fehler sind zusammengefasst, sortierbar nach Häufigkeit oder Aktualität.
// Behobene Fehler lassen sich einzeln oder alle auf einmal entfernen. Meldungen sind bereits datenschutzkonform bereinigt.
export default function ErrorsPanel({ initial }: { initial: SystemError[] }) {
  const [errors, setErrors] = useState(initial);
  const [sort, setSort] = useState<Sort>("recent");
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [message, setMessage] = useState("");

  const sorted = useMemo(() => {
    const list = [...errors];
    if (sort === "count") list.sort((a, b) => b.occurrences_count - a.occurrences_count);
    else list.sort((a, b) => b.last_occurred_at.localeCompare(a.last_occurred_at));
    return list;
  }, [errors, sort]);

  const total = errors.reduce((sum, e) => sum + e.occurrences_count, 0);

  async function call(body: Record<string, unknown>): Promise<boolean> {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("failed");
      return true;
    } catch {
      setMessage("Das hat nicht geklappt. Bitte versuch es noch einmal.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (await call({ action: "delete", id })) setErrors((list) => list.filter((e) => e.id !== id));
  }

  async function clearAll() {
    if (await call({ action: "clear" })) {
      setErrors([]);
      setConfirmClear(false);
    }
  }

  const pill = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
      active
        ? "border-gold/60 bg-gold/15 text-gold"
        : "border-white/10 bg-white/5 text-zinc-300 hover:border-gold/40 hover:text-gold"
    }`;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${errors.length === 0 ? "bg-emerald-400/80" : "bg-rose shadow-[0_0_12px_rgba(244,114,182,0.7)]"}`}
            />
            <h3 className="text-lg font-semibold text-zinc-50">System-Fehler</h3>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {errors.length === 0
              ? "Keine offenen Fehler. Alles ruhig."
              : `${errors.length} verschiedene Fehler, insgesamt ${total}× aufgetreten.`}{" "}
            Persönliche Daten werden automatisch entfernt.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setSort("recent")} className={pill(sort === "recent")}>
            Aktuell
          </button>
          <button type="button" onClick={() => setSort("count")} className={pill(sort === "count")}>
            Häufigkeit
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <ul className="mt-5 space-y-2.5">
          <AnimatePresence initial={false}>
            {sorted.map((e) => (
              <motion.li
                key={e.id}
                layout="position"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm leading-snug font-medium break-words text-zinc-100">{e.error_message}</p>
                    <p className="mt-1 font-mono text-[11px] break-all text-gold/80">{e.component_path}</p>
                  </div>
                  <span
                    className="shrink-0 rounded-full border border-rose/30 bg-rose/10 px-2.5 py-0.5 text-xs font-semibold text-rose"
                    title="Häufigkeit"
                  >
                    {e.occurrences_count}×
                  </span>
                </div>

                <p className="mt-2 text-[11px] text-zinc-500">
                  Zuletzt {fmt.format(new Date(e.last_occurred_at))} · zuerst {fmt.format(new Date(e.first_occurred_at))}
                </p>

                <div className="mt-3 flex items-center gap-4">
                  {e.stack_trace && (
                    <button
                      type="button"
                      onClick={() => setOpen(open === e.id ? null : e.id)}
                      className="text-xs text-zinc-400 transition-colors hover:text-gold"
                    >
                      {open === e.id ? "Stacktrace ausblenden" : "Stacktrace anzeigen"}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove(e.id)}
                    className="text-xs text-zinc-400 transition-colors hover:text-rose disabled:opacity-50"
                  >
                    Behoben, entfernen
                  </button>
                </div>

                {open === e.id && e.stack_trace && (
                  <pre className="mt-3 max-h-56 overflow-auto rounded-xl border border-white/10 bg-zinc-950/70 p-3 text-[11px] leading-relaxed whitespace-pre-wrap text-zinc-400">
                    {e.stack_trace}
                  </pre>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {errors.length > 1 && (
        <div className="mt-5 flex items-center justify-end gap-3">
          {confirmClear ? (
            <>
              <span className="text-xs text-zinc-400">Wirklich alle {errors.length} Einträge entfernen?</span>
              <button type="button" onClick={() => setConfirmClear(false)} className="text-xs text-zinc-500 hover:text-zinc-300">
                Abbrechen
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={clearAll}
                className="rounded-full border border-rose/40 bg-rose/10 px-4 py-1.5 text-xs font-semibold text-rose disabled:opacity-50"
              >
                Alle entfernen
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirmClear(true)} className="text-xs text-zinc-500 transition-colors hover:text-rose">
              Alle zurücksetzen
            </button>
          )}
        </div>
      )}

      {message && (
        <p role="alert" className="mt-3 text-xs text-rose">
          {message}
        </p>
      )}
    </section>
  );
}
