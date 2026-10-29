"use client";

import { useLanguage, useTx } from "@/lib/LanguageContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import FlowingWaveBackground from "@/components/FlowingWaveBackground";
import type { RoomSummary } from "@/lib/chatRooms";

type Search = { friends: boolean; business: boolean; canBusiness: boolean };
type ListData = { rooms: RoomSummary[]; slotsUsed: number; limit: number; search?: Search };

const EASE = [0.16, 1, 0.3, 1] as const;
const times = {
  de: new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
  en: new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
  ta: new Intl.DateTimeFormat("ta-IN", { timeZone: "Europe/Berlin", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
};

// Übersicht der eigenen Chats mit den belegten Plätzen (höchstens 4 gleichzeitig)
export default function ChatList({ sample }: { sample?: ListData }) {
  const tx = useTx();
  const { language } = useLanguage();
  const [data, setData] = useState<ListData | null>(sample ?? null);
  const [error, setError] = useState("");
  const [savingSide, setSavingSide] = useState<"" | "friends" | "business">("");

  useEffect(() => {
    if (sample) return;
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/chats", { cache: "no-store" });
        if (!res.ok) throw new Error("failed");
        const json = (await res.json()) as ListData;
        if (alive) {
          setData(json);
          setError("");
        }
      } catch {
        if (alive) setError(tx("Die Chats konnten nicht geladen werden."));
      }
    }
    load();
    const id = setInterval(() => {
      if (!document.hidden) load();
    }, 15000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [sample]);

  // Suche pro Seite an/aus (Friends / Business). Neue Chats entstehen nur, solange ein Platz frei ist und eine Suche an ist.
  async function toggleSide(side: "friends" | "business") {
    if (!data?.search || savingSide || sample) return;
    const next = !data.search[side];
    setSavingSide(side);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(side === "friends" ? { friendsActive: next } : { businessActive: next }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "failed");
      }
      setData((d) => (d && d.search ? { ...d, search: { ...d.search, [side]: next } } : d));
    } catch (e) {
      setError(e instanceof Error && e.message !== "failed" ? tx(e.message) : tx("Das hat nicht geklappt. Bitte versuch es noch einmal."));
    } finally {
      setSavingSide("");
    }
  }

  const card = "rounded-3xl border border-white/10 bg-zinc-950/75 backdrop-blur-md";

  return (
    <main className="relative isolate min-h-screen bg-zinc-950 px-5 py-10 sm:px-8 sm:py-14">
      <FlowingWaveBackground pulses={false} fixed />
      <div className="mx-auto flex max-w-2xl flex-col gap-5">
        <header className="hidden items-center justify-between gap-4 sm:flex">
          <div>
            <Link
              href={sample ? "#" : "/dashboard"}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-5 py-3 text-base font-semibold text-zinc-50 backdrop-blur-md transition-colors hover:border-gold/50 hover:text-gold"
            >
              <span aria-hidden className="text-xl leading-none">←</span>
              {tx("Profil")}
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-zinc-50 sm:text-3xl">{tx("Deine Chats")}</h1>
          </div>
          {data && (
            <div className="text-right" title={tx("Du kannst höchstens vier Chats gleichzeitig führen")}>
              <div className="flex justify-end gap-1.5" aria-hidden>
                {Array.from({ length: data.limit }, (_, i) => (
                  <span
                    key={i}
                    className={`h-2.5 w-6 rounded-full ${i < data.slotsUsed ? "bg-gold shadow-[0_0_10px_rgba(242,166,90,0.6)]" : "bg-white/10"}`}
                  />
                ))}
              </div>
              <p className="mt-1.5 text-sm font-medium text-zinc-50">
                {tx("{n} von {max} Plätzen belegt", { n: data.slotsUsed, max: data.limit })}
              </p>
            </div>
          )}
        </header>

        <p className="hidden text-base leading-relaxed text-zinc-50 sm:block">
          {tx("Du kannst höchstens {max} Chats gleichzeitig führen, damit jedes Gespräch Raum bekommt. Verlässt du einen Chat, wird ein Platz für ein neues Match frei.", { max: data?.limit ?? 4 })}
        </p>

        {error && (
          <p role="alert" className="text-sm text-rose">
            {error}
          </p>
        )}

        {data?.search && (
          <section className={`${card} order-last p-5 sm:order-none`}>
            <h2 className="text-base font-semibold text-zinc-50">{tx("Neue Chats")}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">
              {data.slotsUsed >= data.limit
                ? tx("Alle Plätze sind belegt. Verlässt du einen Chat, wird ein Platz frei und wir suchen ein neues Match für dich.")
                : data.search.friends || data.search.business
                  ? tx("Du hast noch freie Plätze. Solange die Suche an ist, schlagen wir dir automatisch passende Leute vor. Neue Chats erscheinen hier und du bekommst eine E-Mail.")
                  : tx("Die Suche ist ausgeschaltet. Schalte sie ein, damit wir dir neue Leute vorschlagen.")}
            </p>
            <div className="mt-4 grid gap-2.5">
              {(
                [
                  { id: "friends" as const, label: "Friends-Community", on: data.search.friends },
                  { id: "business" as const, label: "Business-Community", on: data.search.business },
                ]
              ).map((side) => (
                <div key={side.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-50">{tx(side.label)}</p>
                    <p className="text-sm text-zinc-300">{side.on ? tx("Suche an") : tx("Suche aus")}</p>
                  </div>
                  {side.id === "business" && !data.search?.canBusiness && !side.on ? (
                    <Link href="/dashboard" className="shrink-0 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-2 text-sm font-medium text-zinc-100 hover:border-gold/50">
                      {tx("Business einrichten")}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={side.on}
                      aria-label={tx(side.label)}
                      disabled={Boolean(savingSide)}
                      onClick={() => toggleSide(side.id)}
                      className={`relative h-8 w-14 shrink-0 rounded-full border transition-colors duration-200 disabled:opacity-60 ${
                        side.on ? "border-gold/60 bg-gold" : "border-white/20 bg-white/10"
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${side.on ? "translate-x-6" : "translate-x-0"}`} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {data && data.rooms.length === 0 && (
          <div className={`${card} hidden p-8 text-center sm:block`}>
            <h2 className="text-lg font-semibold text-zinc-50">{tx("Noch keine Chats")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">
              {tx("Sobald dein Hub öffnet und wir passende Menschen für dich gefunden haben, startet hier dein erster Chat, mit einem Eisbrecher, der zu euren Gemeinsamkeiten passt.")}
            </p>
          </div>
        )}

        <ul className="hidden space-y-3 sm:block">
          {data?.rooms.map((room, i) => (
            <motion.li
              key={room.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE, delay: i * 0.05 }}
            >
              <Link
                href={sample ? "#" : `/dashboard/chats/${room.id}`}
                className={`${card} block p-5 transition-[border-color,box-shadow] duration-300 hover:border-gold/40 hover:shadow-[0_0_28px_-10px_rgba(242,166,90,0.4)]`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-zinc-50">
                      {room.members.filter((m) => !m.isMe).map((m) => m.label).join(", ") || tx("Allein im Chat")}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {room.kind === "duo" ? tx("Duo") : tx("Gruppe · {n} Personen", { n: room.members.length })}
                      {room.track === "business" ? tx(" · Business") : ""}
                      {room.dissolved ? tx(" · beendet") : ""}
                    </p>
                  </div>
                  {room.unread > 0 && (
                    <span className="shrink-0 rounded-full bg-gold px-2.5 py-0.5 text-xs font-bold text-zinc-950">{room.unread}</span>
                  )}
                </div>
                {room.last && (
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-300">
                    {room.last.kind === "icebreaker" ? "✨ " : ""}
                    {room.last.kind === "system" ? tx(room.last.body) : room.last.body}
                  </p>
                )}
                {room.last && <p className="mt-2 text-xs text-zinc-400">{times[language].format(new Date(room.last.createdAt))}</p>}
              </Link>
            </motion.li>
          ))}
        </ul>

        {/* Handy: Chat-Liste im Stil von Instagram-Nachrichten */}
        <div className="sm:hidden">
          <div className="flex items-end justify-between gap-3">
            <h1 className="text-2xl font-bold text-zinc-50">{tx("Chats")}</h1>
            {data && (
              <div className="text-right" title={tx("Du kannst höchstens vier Chats gleichzeitig führen")}>
                <div className="flex justify-end gap-1" aria-hidden>
                  {Array.from({ length: data.limit }, (_, i) => (
                    <span key={i} className={`h-2 w-5 rounded-full ${i < data.slotsUsed ? "bg-gold shadow-[0_0_10px_rgba(242,166,90,0.6)]" : "bg-white/10"}`} />
                  ))}
                </div>
                <p className="mt-1 text-xs text-zinc-300">{tx("{n} von {max} Plätzen belegt", { n: data.slotsUsed, max: data.limit })}</p>
              </div>
            )}
          </div>

          {data && data.rooms.length === 0 && (
            <div className="mt-10 flex flex-col items-center px-4 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-white/25 text-zinc-100">
                <svg viewBox="0 0 24 24" className="h-11 w-11" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h7A2.5 2.5 0 0 1 16 6.5v3A2.5 2.5 0 0 1 13.5 12H10l-3 2.5V12h-.5A2.5 2.5 0 0 1 4 9.5z" />
                  <path d="M16 9h1.5A2.5 2.5 0 0 1 20 11.5v3a2.5 2.5 0 0 1-2.5 2.5H17v2.5L14 17h-3.5a2.5 2.5 0 0 1-2.4-1.8" />
                </svg>
              </div>
              <h2 className="mt-5 text-lg font-semibold text-zinc-50">{tx("Noch keine Chats")}</h2>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-300">
                {tx("Sobald dein Hub öffnet und wir passende Menschen für dich gefunden haben, startet hier dein erster Chat, mit einem Eisbrecher, der zu euren Gemeinsamkeiten passt.")}
              </p>
            </div>
          )}

          {data && data.rooms.length > 0 && (
            <ul className="mt-4 divide-y divide-white/[0.06]">
              {data.rooms.map((room) => {
                const others = room.members.filter((m) => !m.isMe);
                const title = others.map((m) => m.label).join(", ") || tx("Allein im Chat");
                const unread = room.unread > 0;
                return (
                  <li key={room.id}>
                    <Link href={sample ? "#" : `/dashboard/chats/${room.id}`} className="flex items-center gap-3.5 py-3 active:bg-white/[0.04]">
                      <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-gold via-rose to-[#6b1233] text-xl font-bold text-white">
                        {room.kind === "group" ? "👥" : (others[0]?.label ?? "?").slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-[15px] ${unread ? "font-bold text-zinc-50" : "font-medium text-zinc-100"}`}>{title}</span>
                        <span className={`mt-0.5 block truncate text-sm ${unread ? "font-semibold text-zinc-100" : "text-zinc-400"}`}>
                          {room.last
                            ? `${room.last.kind === "icebreaker" ? "✨ " : ""}${room.last.kind === "system" ? tx(room.last.body) : room.last.body}`
                            : room.kind === "duo"
                              ? tx("Duo")
                              : tx("Gruppe · {n} Personen", { n: room.members.length })}
                          {room.last ? ` · ${times[language].format(new Date(room.last.createdAt))}` : ""}
                        </span>
                      </span>
                      {unread ? (
                        <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-gold px-1.5 text-xs font-bold text-zinc-950">{room.unread}</span>
                      ) : room.dissolved ? (
                        <span className="shrink-0 text-xs text-zinc-500">{tx("beendet")}</span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
