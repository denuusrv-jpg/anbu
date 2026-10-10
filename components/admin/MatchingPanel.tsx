"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChatMetrics } from "@/lib/chatRooms";

type Pair = { a: string; b: string; total: number; text: string; minutes: number | null };
type Proposal = { id: string; hub: string; track: string; score: number; quality: "good" | "mid"; summary: string; members: string[]; pairs: Pair[] };
type HubRow = { hub: string; label: string; total: number; complete: number; approved: boolean };
type Overview = { thresholds: { good: number; mid: number }; hubs: HubRow[]; proposals: Proposal[]; decided: { approved: number; rejected: number } };
type Report = {
  hub: string;
  label: string;
  approved: boolean;
  total: number;
  complete: number;
  findings: string[];
  summary: string | null;
  registrants: { userId: string; email: string; name: string; createdAt: string; age: number | null; city: string | null; complete: boolean; missing: string[]; flags: string[] }[];
};

const pct = (v: number | null) => (v === null ? "–" : `${Math.round(v * 100)} %`);
const num = (v: number | null) => (v === null ? "–" : String(v));

// Matching, Freigaben und Chat-Qualität. Nichts wird automatisch zum Chat: Hubs und jeder einzelne Match-Vorschlag brauchen die Freigabe
// des Admins. Die Qualitätszahlen sind anonym: nur Zählungen und Anteile, niemals Nachrichteninhalte.
export default function MatchingPanel({ metrics }: { metrics: ChatMetrics | null }) {
  const [busy, setBusy] = useState(false);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [includeMedium, setIncludeMedium] = useState(false);
  const [message, setMessage] = useState("");
  const [emails, setEmails] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const call = useCallback(async (body: Record<string, unknown>) => {
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
  }, []);

  const load = useCallback(async () => {
    const json = await call({ action: "overview" });
    if (json) setOverview(json as Overview);
  }, [call]);

  useEffect(() => {
    load();
  }, [load]);

  async function compute() {
    const json = await call({ action: "compute", includeMedium });
    if (!json) return;
    setOverview(json as Overview);
    const c = json.computed as { found: number; incomplete: number } | null;
    if (c) {
      setMessage(
        `${c.found} Vorschlag/Vorschläge berechnet.${c.incomplete > 0 ? ` ${c.incomplete} Person(en) in freigegebenen Hubs sind noch unvollständig.` : ""} Es sind noch keine Chats angelegt.`,
      );
    }
  }

  async function decide(id: string, action: "approve" | "reject") {
    const json = await call({ action, id });
    if (json) {
      setMessage(action === "approve" ? "Freigegeben: Der Chat ist angelegt." : "Abgelehnt: Das Paar wird nicht noch einmal vorgeschlagen.");
      await load();
    }
  }

  async function toggleHub(hub: string, approved: boolean) {
    const json = await call({ action: "hub", hub, approved });
    if (json) await load();
  }

  async function showReport(hub: string) {
    setReport(null);
    const json = await call({ action: "report", hub });
    if (json?.report) setReport(json.report as Report);
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
        <p className="text-sm font-medium text-zinc-100">Hubs freigeben</p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          Ein Hub nimmt erst am Matching teil, wenn du ihn freigibst. Der Bericht zeigt die Anmeldungen und Auffälligkeiten (doppelte Adressen, Wegwerf-Mails, Serien, identische Profile).
        </p>
        <div className="mt-3 space-y-2">
          {overview?.hubs.length === 0 && <p className="text-xs text-zinc-500">Noch keine Anmeldungen.</p>}
          {overview?.hubs.map((h) => (
            <div key={h.hub} className={box}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-zinc-100">
                    {h.label} <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] ${h.approved ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-zinc-400"}`}>{h.approved ? "freigegeben" : "geschlossen"}</span>
                  </p>
                  <p className="text-[11px] text-zinc-500">{h.total} Anmeldung(en), {h.complete} vollständig</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" disabled={busy} onClick={() => showReport(h.hub)} className={pill}>Bericht</button>
                  <button type="button" disabled={busy} onClick={() => toggleHub(h.hub, !h.approved)} className={pill}>
                    {h.approved ? "Schließen" : "Freigeben"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {report && (
          <div className="mt-3 rounded-2xl border border-gold/25 bg-gold/[0.05] p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-zinc-100">Bericht: {report.label} ({report.total} Anmeldungen, {report.complete} vollständig)</p>
              <button type="button" onClick={() => setReport(null)} className="text-xs text-zinc-500 hover:text-zinc-300">Schließen</button>
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-zinc-300">
              {report.findings.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            {report.summary && <p className="mt-3 rounded-xl bg-white/5 p-3 text-xs leading-relaxed text-zinc-200"><span className="font-semibold text-gold">KI-Einschätzung:</span> {report.summary}</p>}
            <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-[11px] text-zinc-300">
                <thead className="sticky top-0 bg-zinc-900 text-zinc-500">
                  <tr><th className="p-2">Name</th><th className="p-2">E-Mail</th><th className="p-2">Alter</th><th className="p-2">Ort</th><th className="p-2">Hinweise</th></tr>
                </thead>
                <tbody>
                  {report.registrants.map((r) => (
                    <tr key={r.userId} className="border-t border-white/5 align-top">
                      <td className="p-2">{r.name}</td>
                      <td className="p-2">{r.email}</td>
                      <td className="p-2">{r.age ?? "–"}</td>
                      <td className="p-2">{r.city ?? "–"}</td>
                      <td className="p-2 text-amber-300">{[...r.flags, ...(r.complete ? [] : [`unvollständig: ${r.missing.join(", ")}`])].join("; ") || <span className="text-zinc-600">–</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="mt-7 border-t border-white/10 pt-5">
        <p className="text-sm font-medium text-zinc-100">Match-Vorschläge zur Freigabe</p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          Die KI berechnet Vorschläge aus den Antworten (Punkte von 0 bis 100). Ab {overview?.thresholds.good ?? 60} Punkten gilt ein Match als gut. Erst mit deiner Freigabe entsteht der Chat. Der tägliche Lauf berechnet neue Vorschläge automatisch, legt aber nie Chats an.
        </p>
        <label className="mt-3 flex items-center gap-2 text-xs text-zinc-300">
          <input type="checkbox" checked={includeMedium} onChange={(e) => setIncludeMedium(e.target.checked)} className="accent-[#f2a65a]" />
          Auch mittlere Matches zeigen ({overview?.thresholds.mid ?? 45} bis {(overview?.thresholds.good ?? 60) - 1} Punkte)
        </label>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" disabled={busy} onClick={compute} className={pill}>Vorschläge neu berechnen</button>
          {overview && <span className="text-[11px] text-zinc-500">Bisher freigegeben: {overview.decided.approved} · abgelehnt: {overview.decided.rejected}</span>}
        </div>

        <div className="mt-4 space-y-3">
          {overview && overview.proposals.length === 0 && <p className="text-xs text-zinc-500">Keine offenen Vorschläge. Gib erst einen Hub frei und berechne dann neu.</p>}
          {overview?.proposals.map((p) => (
            <div key={p.id} className={box}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm text-zinc-100">{p.members.join("  +  ")}</p>
                  <p className="mt-1 text-[11px] text-zinc-500">Hub {p.hub}{p.track === "business" ? " · Business" : " · Friends"}</p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${p.quality === "good" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                  {p.score} Punkte · {p.quality === "good" ? "gut" : "mittel"}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-zinc-300">{p.summary}</p>
              <button type="button" onClick={() => setOpen(open === p.id ? null : p.id)} className="mt-2 text-[11px] text-gold hover:underline">
                {open === p.id ? "Grundlage ausblenden" : "Grundlage des Matches ansehen"}
              </button>
              {open === p.id && (
                <ul className="mt-2 space-y-1.5 rounded-xl bg-white/[0.03] p-3 text-[11px] leading-relaxed text-zinc-400">
                  {p.pairs.map((x, i) => (
                    <li key={i}>
                      <span className="text-zinc-200">{x.a} ↔ {x.b}</span>: {x.total} Punkte{x.minutes ? `, ca. ${x.minutes} Min. Fahrzeit` : ""}. {x.text}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 flex gap-2">
                <button type="button" disabled={busy} onClick={() => decide(p.id, "approve")} className="rounded-full bg-gradient-to-b from-gold-light to-gold px-4 py-1.5 text-xs font-semibold text-zinc-950 disabled:opacity-40">
                  Freigeben und Chat anlegen
                </button>
                <button type="button" disabled={busy} onClick={() => decide(p.id, "reject")} className={pill}>Ablehnen</button>
              </div>
            </div>
          ))}
        </div>

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
