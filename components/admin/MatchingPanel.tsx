"use client";

import { useState } from "react";
import type { ChatMetrics } from "@/lib/chatRooms";

type Proposal = { hub: string; track: string; members: string[]; interests: string[]; vibes: string[] };
type Preview = { applied: boolean; created: number; skipped: number; threshold: number; openHubs: string[]; proposals: Proposal[] };

const pct = (v: number | null) => (v === null ? "–" : `${Math.round(v * 100)} %`);
const num = (v: number | null) => (v === null ? "–" : String(v));

// Matching starten und Chat-Qualität ansehen. Die Qualitätszahlen sind anonym: nur Zählungen und Anteile,
// niemals Nachrichteninhalte. Namen und E-Mail-Adressen erscheinen nur in der Matching-Vorschau (wie überall im Admin).
export default function MatchingPanel({ metrics }: { metrics: ChatMetrics | null }) {
  const [force, setForce] = useState(true);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [message, setMessage] = useState("");
  const [emails, setEmails] = useState("");

  async function call(body: Record<string, unknown>) {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/matching", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json?.error ?? "Das hat nicht geklappt.");
        return null;
      }
      return json;
    } catch {
      setMessage("Keine Verbindung.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function run(action: "preview" | "apply") {
    const json = await call({ action, force });
    if (json) {
      setPreview(json as Preview);
      if (action === "apply") setMessage(`${json.created} Chat${json.created === 1 ? "" : "s"} angelegt, ${json.skipped} übersprungen. Zahlen oben aktualisieren sich beim Neuladen.`);
    }
  }

  async function manual() {
    const list = emails.split(/[\s,;]+/).filter(Boolean);
    const json = await call({ action: "manual", emails: list });
    if (json?.ok) {
      setMessage(`Chat angelegt. Steckbrief: ${json.summary}`);
      setEmails("");
    }
  }

  const box = "rounded-2xl border border-white/10 bg-white/[0.04] p-4";
  const pill = "rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-gold/50 hover:text-gold disabled:opacity-50";

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-7">
      <h3 className="text-lg font-semibold text-zinc-50">Matching &amp; Chat-Qualität</h3>
      <p className="mt-1 text-xs leading-relaxed text-zinc-500">
        Anonyme Zahlen zu den Chats. Es werden nie Nachrichteninhalte gelesen, nur Zählungen: wer hat geschrieben, wie oft, wie viele Eisbrecher,
        wie ist das Feedback.
      </p>

      {metrics ? (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Aktive Chats", String(metrics.roomsActive)],
              ["Neu (30 Tage)", String(metrics.createdLast30)],
              ["Beendet (30 Tage)", String(metrics.ended30)],
              ["Nutzer in Chats", String(metrics.usersWithChats)],
              ["Antwortquote", pct(metrics.activeRoomsReplyRate)],
              ["Stille Chats", String(metrics.activeRoomsSilent)],
              ["Ø Nachrichten/Chat", num(metrics.avgMessagesPerActiveRoom)],
              ["Eisbrecher (30 T.)", String(metrics.icebreakerClicks30)],
            ].map(([label, value]) => (
              <div key={label} className={box}>
                <p className="text-[11px] text-zinc-500">{label}</p>
                <p className="mt-1 text-xl font-semibold text-zinc-50">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className={box}>
              <p className="text-[11px] text-zinc-500">Feedback (30 Tage)</p>
              <p className="mt-1 text-sm text-zinc-200">
                Gut {metrics.feedback30.good} · Geht so {metrics.feedback30.ok} · Nicht gut {metrics.feedback30.bad}
              </p>
            </div>
            <div className={box}>
              <p className="text-[11px] text-zinc-500">Beendete Chats mit Antworten · früh beendet (&lt; 48 h)</p>
              <p className="mt-1 text-sm text-zinc-200">
                {pct(metrics.endedReplyRate)} · {pct(metrics.earlyLeaveRate)}
              </p>
            </div>
            <div className={box}>
              <p className="text-[11px] text-zinc-500">Belegte Plätze (Nutzer) · am Limit: {metrics.usersAtLimit}</p>
              <p className="mt-1 text-sm text-zinc-200">
                {metrics.slotHistogram.map((h) => `${h.slots}: ${h.users}`).join(" · ")}
              </p>
            </div>
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm text-zinc-400">Die Chat-Tabellen sind noch nicht eingerichtet (supabase/schema.sql, Abschnitt 13).</p>
      )}

      <div className="mt-7 border-t border-white/10 pt-5">
        <p className="text-sm font-medium text-zinc-100">Matching</p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          Der tägliche Lauf bildet Matches nur in Hubs ab einer Schwelle von Personen. Hier kannst du es auch früher anstoßen: erst berechnen, dann anlegen.
        </p>
        <label className="mt-3 flex items-center gap-2 text-xs text-zinc-300">
          <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} className="accent-[#f2a65a]" />
          Alle Hubs berücksichtigen, auch unter der Schwelle (zum Testen und für den Start)
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => run("preview")} className={pill}>
            Vorschlag berechnen
          </button>
          <button
            type="button"
            disabled={busy || !preview || preview.proposals.length === 0 || preview.applied}
            onClick={() => run("apply")}
            className="rounded-full bg-gradient-to-b from-gold-light to-gold px-4 py-1.5 text-xs font-semibold text-zinc-950 disabled:opacity-40"
          >
            Chats anlegen
          </button>
        </div>

        {preview && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-zinc-400">
              {preview.proposals.length} Vorschlag/Vorschläge. Geöffnete Hubs: {preview.openHubs.length ? preview.openHubs.join(", ") : `keine (Schwelle ${preview.threshold})`}
            </p>
            {preview.proposals.map((p, i) => (
              <div key={i} className={box}>
                <p className="text-sm text-zinc-100">{p.members.join("  +  ")}</p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Hub {p.hub}
                  {p.track === "business" ? " · Business" : ""}
                  {p.interests.length ? ` · ${p.interests.join(", ")}` : ""}
                  {p.vibes.length ? ` · ${p.vibes.join(", ")}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6">
          <p className="text-sm font-medium text-zinc-100">Match von Hand</p>
          <p className="mt-1 text-xs text-zinc-500">2 bis 8 E-Mail-Adressen, getrennt durch Komma oder Leerzeichen.</p>
          <div className="mt-2 flex gap-2">
            <input
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="a@beispiel.de, b@beispiel.de"
              aria-label="E-Mail-Adressen für ein Match von Hand"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-gold/60 focus:outline-none"
            />
            <button type="button" disabled={busy || !emails.trim()} onClick={manual} className={pill}>
              Chat anlegen
            </button>
          </div>
        </div>

        {message && (
          <p role="status" className="mt-3 text-xs leading-relaxed text-zinc-300">
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
