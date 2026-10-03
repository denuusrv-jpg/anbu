"use client";

import { motion } from "motion/react";
import { useMemo, useState } from "react";
import type { AdminWish } from "@/lib/adminData";

// Co-Creation & Wishes: die Ideen der Community in einer eigenen, großen Ansicht
export default function WishesView({ wishes, onBack }: { wishes: AdminWish[]; onBack: () => void }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const rows = useMemo(
    () =>
      wishes.filter(
        (w) => !q || w.wish.toLowerCase().includes(q) || w.email.toLowerCase().includes(q) || w.name.toLowerCase().includes(q),
      ),
    [wishes, q],
  );
  const contributors = new Set(wishes.map((w) => w.user_id)).size;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            ← Zurück zur Übersicht
          </button>
          <h2 className="mt-3 text-2xl font-bold text-zinc-50 uppercase sm:text-3xl">Co-Creation &amp; Wishes</h2>
          <p className="mt-2 text-sm text-zinc-400">
            {wishes.length} Idee{wishes.length === 1 ? "" : "n"} von {contributors} Person{contributors === 1 ? "" : "en"}.
          </p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ideen durchsuchen …"
          aria-label="Ideen durchsuchen"
          className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 backdrop-blur-xl focus:border-gold/60 focus:outline-none sm:w-64"
        />
      </div>

      {rows.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-zinc-500">
          {wishes.length === 0 ? "Noch keine Ideen eingereicht." : "Keine passenden Ideen."}
        </p>
      ) : (
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {rows.map((w, i) => (
            <motion.li
              key={w.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: Math.min(i, 8) * 0.04 }}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl"
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-100">{w.wish}</p>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs">
                <span className="min-w-0 truncate text-zinc-300">
                  {w.name || "Anonym"}
                  {w.email ? <span className="text-zinc-500"> · {w.email}</span> : null}
                </span>
                <span className="shrink-0 text-zinc-500">
                  {new Date(w.created_at).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}
                </span>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
