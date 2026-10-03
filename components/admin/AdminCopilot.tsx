"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ArrowRightIcon, SparkleIcon } from "@/components/Icons";

type Answer = { answer: string; items?: { label: string; value?: string }[] };
type Entry = { id: number; question: string; result?: Answer; error?: string; pending: boolean };

const VISIBLE = 4;
const ROTATE_MS = 6000;

// Admin-Copilot: Fragen zu den Nutzerdaten in natürlicher Sprache, mit rotierenden Beispiel-Chips.
export default function AdminCopilot({ examples }: { examples: string[] }) {
  const [question, setQuestion] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [offset, setOffset] = useState(0);
  const [paused, setPaused] = useState(false);
  const nextId = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);

  // Beispiele wechseln dynamisch
  useEffect(() => {
    if (paused || examples.length <= VISIBLE) return;
    const id = setInterval(() => setOffset((o) => (o + VISIBLE) % examples.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [paused, examples.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [entries]);

  const visible = Array.from({ length: Math.min(VISIBLE, examples.length) }, (_, i) => examples[(offset + i) % examples.length]);

  async function ask(text: string) {
    const value = text.trim();
    if (!value) return;
    const id = nextId.current++;
    setEntries((list) => [...list, { id, question: value, pending: true }]);
    setQuestion("");
    try {
      const res = await fetch("/api/admin/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: value }),
      });
      const data = await res.json();
      setEntries((list) =>
        list.map((e) =>
          e.id === id
            ? res.ok
              ? { ...e, pending: false, result: data as Answer }
              : { ...e, pending: false, error: data?.error ?? "Das hat nicht geklappt." }
            : e,
        ),
      );
    } catch {
      setEntries((list) =>
        list.map((e) => (e.id === id ? { ...e, pending: false, error: "Keine Verbindung." } : e)),
      );
    }
  }

  return (
    <section
      aria-label="Admin-Copilot"
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-6"
    >
      <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-gold/15 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold/10 text-gold">
            <SparkleIcon className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-zinc-50">Admin-Copilot</h2>
            <p className="text-[11px] text-zinc-500">Frag in normaler Sprache nach deinen Nutzerdaten.</p>
          </div>
        </div>

        {entries.length > 0 && (
          <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1" role="log" aria-live="polite">
            {entries.map((e) => (
              <div key={e.id} className="space-y-2">
                <div className="flex justify-end">
                  <p className="max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-b from-gold-light to-gold px-4 py-2 text-sm font-medium text-zinc-950">
                    {e.question}
                  </p>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="max-w-[92%] rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.06] px-4 py-3 text-sm leading-relaxed text-zinc-100"
                >
                  {e.pending ? (
                    <span className="inline-flex gap-1.5" aria-label="Copilot denkt nach">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-gold"
                          animate={{ opacity: [0.25, 1, 0.25] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </span>
                  ) : e.error ? (
                    <span className="text-rose">{e.error}</span>
                  ) : (
                    <>
                      <p>{e.result?.answer}</p>
                      {e.result?.items && e.result.items.length > 0 && (
                        <ul className="mt-2 divide-y divide-white/5 rounded-xl border border-white/10 bg-zinc-950/40">
                          {e.result.items.map((item, i) => (
                            <li key={i} className="flex items-baseline justify-between gap-4 px-3 py-2 text-[13px]">
                              <span className="text-zinc-200">{item.label}</span>
                              {item.value && <span className="text-right text-zinc-400">{item.value}</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </motion.div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        )}

        <form
          onSubmit={(ev) => {
            ev.preventDefault();
            ask(question);
          }}
          className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/60 p-1.5 focus-within:border-gold/60"
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Frag mich etwas, zum Beispiel „Wer hat sich heute eingeloggt?“"
            aria-label="Frage an den Copilot"
            maxLength={300}
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Frage senden"
            disabled={!question.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold text-zinc-950 transition hover:bg-gold-light active:scale-95 disabled:opacity-40"
          >
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </form>

        {/* Rotierende Beispielfragen */}
        <div
          className="mt-3 min-h-[2.25rem]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={offset}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap gap-2"
            >
              {visible.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => ask(example)}
                  className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-zinc-300 transition-colors hover:border-gold/50 hover:text-gold"
                >
                  {example}
                </button>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
