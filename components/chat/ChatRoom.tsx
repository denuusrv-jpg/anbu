"use client";

import { useLanguage, useTx } from "@/lib/LanguageContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import FlowingWaveBackground from "@/components/FlowingWaveBackground";
import type { RoomDetail, RoomMessage } from "@/lib/chatRooms";

const EASE = [0.16, 1, 0.3, 1] as const;
const times = {
  de: new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" }),
  en: new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" }),
  ta: new Intl.DateTimeFormat("ta-IN", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" }),
};
const POLL_MS = 3000;

// Ein Chat: oben fixiert der Match-Steckbrief, darunter die Nachrichten, der Eisbrecher-Button und das Eingabefeld.
// Neue Nachrichten werden alle paar Sekunden nachgeladen. Im Vorschau-Modus (sample) wird nichts gesendet.
export default function ChatRoom({ roomId, sample }: { roomId: string; sample?: RoomDetail }) {
  const tx = useTx();
  const { language } = useLanguage();
  const router = useRouter();
  const [detail, setDetail] = useState<RoomDetail | null>(sample ?? null);
  const [messages, setMessages] = useState<RoomMessage[]>(sample?.messages ?? []);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [sparkBusy, setSparkBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("");
  const [reportNote, setReportNote] = useState("");
  const [feedbackDone, setFeedbackDone] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const lastAt = useRef<string | undefined>(sample?.messages.at(-1)?.createdAt);
  const stick = useRef(true);

  const append = useCallback((incoming: RoomMessage[]) => {
    if (incoming.length === 0) return;
    setMessages((list) => {
      const seen = new Set(list.map((m) => m.id));
      const fresh = incoming.filter((m) => !seen.has(m.id));
      return fresh.length ? [...list, ...fresh] : list;
    });
    lastAt.current = incoming[incoming.length - 1].createdAt;
  }, []);

  const load = useCallback(
    async (initial: boolean) => {
      try {
        const res = await fetch(`/api/chats/${roomId}${!initial && lastAt.current ? `?after=${encodeURIComponent(lastAt.current)}` : ""}`, {
          cache: "no-store",
        });
        if (res.status === 404) {
          router.replace("/dashboard/chats");
          return;
        }
        if (!res.ok) return;
        const json = (await res.json()) as RoomDetail;
        setDetail((d) => ({ ...json, messages: [] , myFeedback: d?.myFeedback ?? json.myFeedback }));
        append(json.messages);
      } catch {
        // nächster Versuch beim nächsten Takt
      }
    },
    [roomId, router, append],
  );

  useEffect(() => {
    if (sample) return;
    load(true);
    const id = setInterval(() => {
      if (!document.hidden) load(false);
    }, POLL_MS);
    return () => clearInterval(id);
  }, [load, sample]);

  // Nach unten scrollen, wenn neue Nachrichten kommen und man schon unten war
  useEffect(() => {
    if (stick.current) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  function onScroll() {
    const el = scroller.current;
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  async function call(path: string, body?: unknown) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    return { ok: res.ok, json };
  }

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const value = text.trim();
    if (!value || busy || !detail || detail.room.dissolved) return;
    setNotice("");
    if (sample) {
      append([{ id: `s${Date.now()}`, kind: "user", body: value, createdAt: new Date().toISOString(), mine: true, sender: "Du" }]);
      setText("");
      return;
    }
    setBusy(true);
    const { ok, json } = await call(`/api/chats/${roomId}`, { body: value });
    setBusy(false);
    if (!ok) {
      setNotice(tx(json?.error ?? "Senden hat nicht geklappt."));
      return;
    }
    stick.current = true;
    append([json.message as RoomMessage]);
    setText("");
  }

  async function spark() {
    if (sparkBusy || !detail || detail.room.dissolved) return;
    setNotice("");
    if (sample) {
      append([{ id: `k${Date.now()}`, kind: "icebreaker", body: "Welches Training macht dir am meisten Spaß, und was motiviert dich dabei?", createdAt: new Date().toISOString(), mine: false, sender: null }]);
      return;
    }
    setSparkBusy(true);
    const { ok, json } = await call(`/api/chats/${roomId}/icebreaker`);
    setSparkBusy(false);
    if (!ok) {
      setNotice(tx(json?.error ?? "Der Impuls konnte nicht geholt werden."));
      return;
    }
    stick.current = true;
    append([json.message as RoomMessage]);
  }

  async function leave() {
    if (sample) {
      setConfirmLeave(false);
      return;
    }
    setBusy(true);
    const { ok } = await call(`/api/chats/${roomId}/leave`);
    setBusy(false);
    if (ok) router.push("/dashboard/chats");
    else setNotice(tx("Verlassen hat nicht geklappt."));
  }

  async function sendReport() {
    if (!reason) return;
    if (sample) {
      setReporting(false);
      return;
    }
    setBusy(true);
    const { ok, json } = await call(`/api/chats/${roomId}/report`, { reason, note: reportNote });
    setBusy(false);
    if (ok) router.push("/dashboard/chats");
    else setNotice(tx(json?.error ?? "Die Meldung hat nicht geklappt."));
  }

  async function feedback(value: "good" | "ok" | "bad") {
    setFeedbackDone(true);
    if (!sample) await call(`/api/chats/${roomId}/feedback`, { value });
  }

  if (!detail) {
    return (
      <main className="relative isolate flex min-h-screen items-center justify-center bg-zinc-950 text-sm text-white/80">
        <FlowingWaveBackground pulses={false} fixed />
        {tx("Chat wird geladen …")}
      </main>
    );
  }

  const othersList = detail.members.filter((m) => !m.isMe);
  const dissolved = detail.room.dissolved;
  const userMessages = messages.filter((m) => m.kind === "user").length;
  const askFeedback = !dissolved && !detail.myFeedback && !feedbackDone && userMessages >= 6;

  return (
    <main className="relative isolate flex h-[100dvh] flex-col bg-zinc-950 sm:p-6">
      <FlowingWaveBackground pulses={false} fixed />
      <div className="mx-auto flex h-full w-full max-w-2xl flex-col overflow-hidden bg-zinc-950/75 px-4 backdrop-blur-md sm:rounded-3xl sm:border sm:border-white/10 sm:px-6 sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_40px_100px_-30px_rgba(0,0,0,0.6)]">
        {/* Kopf */}
        <header className="flex items-center justify-between gap-3 py-4">
          <div className="min-w-0">
            <Link href={sample ? "#" : "/dashboard/chats"} className="text-xs text-zinc-500 hover:text-zinc-300">
              {tx("← Chats")}
            </Link>
            <h1 className="mt-1 truncate text-lg font-semibold text-zinc-50">
              {othersList.length === 0
                ? "Chat"
                : othersList.map((m, i) => (
                    <span key={m.label + i}>
                      {i > 0 && ", "}
                      {m.userId && !sample ? (
                        <Link href={`/profil/${m.userId}`} className="underline-offset-2 hover:text-gold hover:underline" title={tx("Profil ansehen")}>
                          {m.label}
                        </Link>
                      ) : (
                        m.label
                      )}
                    </span>
                  ))}
            </h1>
            <p className="text-[11px] text-zinc-500">
              {detail.room.kind === "duo" ? tx("Duo") : tx("Gruppe · {n} Personen", { n: detail.members.length })}
              {detail.room.track === "business" ? tx(" · Business") : ""}
            </p>
          </div>
          {!confirmLeave ? (
            <div className="flex shrink-0 items-center gap-2">
              {!dissolved && (
                <button type="button" onClick={() => setReporting((v) => !v)} className="text-xs text-zinc-500 transition-colors hover:text-rose">
                  {tx("Melden")}
                </button>
              )}
            <button
              type="button"
              onClick={() => setConfirmLeave(true)}
              className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-zinc-300 transition-colors hover:border-rose/40 hover:text-rose"
            >
              {dissolved ? tx("Chat entfernen") : tx("Verlassen")}
            </button>
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-2 text-xs">
              <span className="max-w-[9rem] text-right leading-snug text-zinc-400">
                {dissolved ? tx("Chat endgültig entfernen?") : tx("Wirklich verlassen? Der Platz wird frei.")}
              </span>
              <button type="button" onClick={() => setConfirmLeave(false)} className="text-zinc-500 hover:text-zinc-300">
                {tx("Nein")}
              </button>
              <button
                type="button"
                onClick={leave}
                disabled={busy}
                className="rounded-full border border-rose/40 bg-rose/10 px-3 py-1 font-semibold text-rose disabled:opacity-50"
              >
                {tx("Ja")}
              </button>
            </div>
          )}
        </header>

        {reporting && !dissolved && (
          <div className="mb-3 rounded-2xl border border-rose/30 bg-rose/[0.06] px-4 py-3">
            <p className="text-sm font-medium text-zinc-100">{tx("Was ist passiert?")}</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-400">
              {tx("Wir lesen keine Nachrichten mit, ein kurzer Hinweis hilft uns. Du verlässt danach den Chat und wirst mit dieser Person nicht noch einmal zusammengebracht.")}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {[
                ["unangenehm", tx("Unangenehm oder respektlos")],
                ["belaestigung", tx("Belästigung")],
                ["spam", tx("Spam oder Werbung")],
                ["fake", tx("Fake-Profil")],
                ["sonstiges", tx("Etwas anderes")],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setReason(id)}
                  aria-pressed={reason === id}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${reason === id ? "border-rose/60 bg-rose/15 text-rose" : "border-white/10 bg-white/5 text-zinc-300 hover:border-rose/40"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <textarea
              value={reportNote}
              onChange={(e) => setReportNote(e.target.value.slice(0, 300))}
              rows={2}
              placeholder={tx("Kurzer Hinweis (optional)")}
              aria-label={tx("Kurzer Hinweis zur Meldung")}
              className="mt-2.5 w-full resize-none rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-xs text-white placeholder:text-white/40 focus:border-rose/50 focus:outline-none"
            />
            <div className="mt-2.5 flex items-center gap-3">
              <button type="button" disabled={!reason || busy} onClick={sendReport} className="rounded-full border border-rose/40 bg-rose/10 px-4 py-1.5 text-xs font-semibold text-rose disabled:opacity-40">
                {tx("Melden und Chat verlassen")}
              </button>
              <button type="button" onClick={() => setReporting(false)} className="text-xs text-zinc-500 hover:text-zinc-300">
                {tx("Abbrechen")}
              </button>
            </div>
          </div>
        )}

        {/* Temporärer Match-Steckbrief, oben fixiert */}
        {detail.steckbrief && (
          <motion.aside
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="mb-3 rounded-2xl border border-gold/25 bg-gold/[0.06] px-4 py-3 backdrop-blur-xl"
            aria-label={tx("Match-Steckbrief")}
          >
            <p className="text-[10px] font-semibold tracking-wide text-gold uppercase">{tx("Warum ihr gematcht wurdet")}</p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-200">{detail.steckbrief}</p>
            <p className="mt-1.5 text-[10px] text-zinc-500">{tx("Dieser Steckbrief wird gelöscht, sobald der Chat endet.")}</p>
          </motion.aside>
        )}

        {/* Nachrichten */}
        <div ref={scroller} onScroll={onScroll} className="relative -mx-1 flex-1 space-y-3 overflow-y-auto px-1 py-2" role="log" aria-live="polite">
          <AnimatePresence initial={false}>
            {messages.map((m) =>
              m.kind === "icebreaker" ? (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  className="mx-auto max-w-[92%] rounded-2xl border border-gold/30 bg-gradient-to-b from-gold/[0.12] to-gold/[0.04] px-4 py-3 text-center shadow-[0_0_30px_-12px_rgba(242,166,90,0.5)]"
                >
                  <p className="text-[10px] font-semibold tracking-wide text-gold uppercase">✨ Spark</p>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-100">{m.body}</p>
                </motion.div>
              ) : m.kind === "system" ? (
                <p key={m.id} className="text-center text-xs text-zinc-500">
                  {m.body}
                </p>
              ) : (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className={`flex ${m.mine ? "justify-end" : "justify-start"}`}
                >
                  <div className="max-w-[82%]">
                    {!m.mine && detail.members.length > 2 && <p className="mb-0.5 px-1 text-[11px] text-zinc-500">{m.sender}</p>}
                    <div
                      className={
                        m.mine
                          ? "rounded-2xl rounded-br-md bg-gradient-to-b from-gold-light to-gold px-4 py-2.5 text-sm leading-relaxed font-medium break-words whitespace-pre-wrap text-zinc-950"
                          : "rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap text-zinc-100 backdrop-blur-xl"
                      }
                    >
                      {m.body}
                    </div>
                    <p className={`mt-0.5 px-1 text-[10px] text-zinc-600 ${m.mine ? "text-right" : ""}`}>{times[language].format(new Date(m.createdAt))}</p>
                  </div>
                </motion.div>
              ),
            )}
          </AnimatePresence>
          <div ref={endRef} />
        </div>

        {/* Feedback */}
        {askFeedback && (
          <div className="mb-2 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-400">
            <span>{tx("Wie fühlt sich dieser Chat an?")}</span>
            {(
              [
                ["good", tx("Gut")],
                ["ok", tx("Geht so")],
                ["bad", tx("Nicht gut")],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => feedback(v)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 transition-colors hover:border-gold/50 hover:text-gold"
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {notice && (
          <p role="alert" className="mb-2 text-center text-xs text-rose">
            {notice}
          </p>
        )}

        {/* Eingabe */}
        {dissolved ? (
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm text-zinc-400">
            {tx("Dieser Chat ist beendet. Du kannst ihn oben entfernen, dann ist er endgültig gelöscht.")}
          </div>
        ) : (
          <div className="pb-4">
            <button
              type="button"
              onClick={spark}
              disabled={sparkBusy}
              className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1.5 text-xs font-semibold text-gold transition-colors hover:bg-gold/20 disabled:opacity-60"
            >
              ✨ {sparkBusy ? tx("Spark denkt nach …") : tx("Eisbrecher")}
            </button>
            <form onSubmit={send} className="flex items-end gap-2 rounded-2xl border border-white/10 bg-zinc-900/70 p-1.5 backdrop-blur-xl focus-within:border-gold/60">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 2000))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder={tx("Schreib eine Nachricht …")}
                aria-label={tx("Nachricht")}
                className="max-h-32 min-h-[2.5rem] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!text.trim() || busy}
                aria-label={tx("Senden")}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold text-zinc-950 transition hover:bg-gold-light active:scale-95 disabled:opacity-40"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
