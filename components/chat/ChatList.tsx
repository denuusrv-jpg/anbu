"use client";

import { useLanguage, useTx } from "@/lib/LanguageContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import FlowingWaveBackground from "@/components/FlowingWaveBackground";
import type { RoomSummary } from "@/lib/chatRooms";

type ListData = { rooms: RoomSummary[]; slotsUsed: number; limit: number };

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

  const card = "rounded-3xl border border-white/10 bg-zinc-950/75 backdrop-blur-md";

  return (
    <main className="relative isolate min-h-screen bg-zinc-950 px-5 py-10 sm:px-8 sm:py-14">
      <FlowingWaveBackground pulses={false} fixed />
      <div className="mx-auto max-w-2xl space-y-5">
        <header className="flex items-center justify-between gap-4">
          <div>
            <Link href={sample ? "#" : "/dashboard"} className="text-xs text-white/70 hover:text-white">
              {tx("← Profil")}
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
              <p className="mt-1.5 text-xs text-zinc-500">
                {tx("{n} von {max} Plätzen belegt", { n: data.slotsUsed, max: data.limit })}
              </p>
            </div>
          )}
        </header>

        <p className="text-xs leading-relaxed text-zinc-500">
          {tx("Du kannst höchstens {max} Chats gleichzeitig führen, damit jedes Gespräch Raum bekommt. Verlässt du einen Chat, wird ein Platz für ein neues Match frei.", { max: data?.limit ?? 4 })}
        </p>

        {error && (
          <p role="alert" className="text-sm text-rose">
            {error}
          </p>
        )}

        {data && data.rooms.length === 0 && (
          <div className={`${card} p-8 text-center`}>
            <h2 className="text-lg font-semibold text-zinc-50">{tx("Noch keine Chats")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {tx("Sobald dein Hub öffnet und wir passende Menschen für dich gefunden haben, startet hier dein erster Chat, mit einem Eisbrecher, der zu euren Gemeinsamkeiten passt.")}
            </p>
          </div>
        )}

        <ul className="space-y-3">
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
                    <p className="mt-0.5 text-xs text-zinc-500">
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
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-400">
                    {room.last.kind === "icebreaker" ? "✨ " : ""}
                    {room.last.body}
                  </p>
                )}
                {room.last && <p className="mt-2 text-[11px] text-zinc-600">{times[language].format(new Date(room.last.createdAt))}</p>}
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>
    </main>
  );
}
