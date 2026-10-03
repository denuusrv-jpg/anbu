"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { INTERESTS, REGIONS, choiceLabels, type Choice } from "@/lib/onboarding";

export type WaitlistRow = { id: string; email: string; status: string; created_at: string };
export type ProfileRow = {
  user_id: string;
  email: string;
  region: string;
  city: string | null;
  mode: string;
  status: string;
  created_at: string;
  interests: Choice;
};

type Tab = "waitlist" | "profiles";

const date = (value: string) =>
  new Date(value).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "gold" }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
        tone === "gold"
          ? "border-gold/40 bg-gold/10 text-gold"
          : "border-white/10 bg-white/5 text-zinc-300"
      }`}
    >
      {children}
    </span>
  );
}

export default function AdminTable({
  waitlist,
  profiles,
}: {
  waitlist: WaitlistRow[];
  profiles: ProfileRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("waitlist");
  const [query, setQuery] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const q = query.trim().toLowerCase();
  const waitlistRows = useMemo(
    () => waitlist.filter((r) => !q || r.email.toLowerCase().includes(q)),
    [waitlist, q],
  );
  const profileRows = useMemo(
    () =>
      profiles.filter(
        (r) => !q || r.email.toLowerCase().includes(q) || (r.city ?? "").toLowerCase().includes(q),
      ),
    [profiles, q],
  );

  async function remove(kind: "waitlist" | "profile", id: string) {
    setBusy(id);
    setError("");
    try {
      const res = await fetch("/api/admin/entries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Löschen hat nicht geklappt.");
        return;
      }
      setConfirming(null);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  function DeleteCell({ id, kind }: { id: string; kind: "waitlist" | "profile" }) {
    if (confirming === id) {
      return (
        <span className="inline-flex items-center gap-2 text-xs">
          <button
            type="button"
            disabled={busy === id}
            onClick={() => remove(kind, id)}
            className="rounded-full bg-rose/90 px-3 py-1 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy === id ? "Lösche …" : "Ja, löschen"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(null)}
            className="text-zinc-400 transition-colors hover:text-zinc-200"
          >
            Abbrechen
          </button>
        </span>
      );
    }
    return (
      <button
        type="button"
        onClick={() => setConfirming(id)}
        className="text-xs text-zinc-500 transition-colors hover:text-rose"
      >
        Löschen
      </button>
    );
  }

  const th = "px-4 py-3 text-left text-[11px] font-semibold tracking-wide text-zinc-500 uppercase";
  const td = "px-4 py-3 align-middle text-sm text-zinc-200";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-xl">
          {(
            [
              { id: "waitlist", label: `Warteliste (${waitlist.length})` },
              { id: "profiles", label: `Profile (${profiles.length})` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setConfirming(null);
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                tab === t.id ? "bg-gold text-zinc-950" : "text-zinc-300 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suchen …"
          aria-label="Suchen"
          className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 backdrop-blur-xl focus:border-gold/60 focus:outline-none sm:w-56"
        />
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs text-rose">
          {error}
        </p>
      )}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
        {tab === "waitlist" ? (
          <table className="w-full min-w-[560px] border-collapse">
            <thead className="border-b border-white/10">
              <tr>
                <th className={th}>E-Mail</th>
                <th className={th}>Status</th>
                <th className={th}>Eingetragen</th>
                <th className={`${th} text-right`}>Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {waitlistRows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-white/[0.03]">
                  <td className={td}>{row.email}</td>
                  <td className={td}>
                    <Badge tone={row.status === "onboarded" ? "gold" : "neutral"}>
                      {row.status === "onboarded" ? "Onboarding fertig" : "Wartet"}
                    </Badge>
                  </td>
                  <td className={`${td} text-zinc-400`}>{date(row.created_at)}</td>
                  <td className={`${td} text-right`}>
                    <DeleteCell id={row.id} kind="waitlist" />
                  </td>
                </tr>
              ))}
              {waitlistRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-zinc-500">
                    Keine Einträge.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full min-w-[760px] border-collapse">
            <thead className="border-b border-white/10">
              <tr>
                <th className={th}>E-Mail</th>
                <th className={th}>Region</th>
                <th className={th}>Interessen</th>
                <th className={th}>Modus</th>
                <th className={th}>Erstellt</th>
                <th className={`${th} text-right`}>Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {profileRows.map((row) => (
                <tr key={row.user_id} className="transition-colors hover:bg-white/[0.03]">
                  <td className={td}>{row.email || "–"}</td>
                  <td className={td}>
                    {REGIONS.find((r) => r.id === row.region)?.label ?? row.region}
                    {row.city ? <span className="text-zinc-500"> · {row.city}</span> : null}
                  </td>
                  <td className={`${td} max-w-[220px] truncate text-zinc-400`}>
                    {choiceLabels(row.interests, INTERESTS).join(", ") || "–"}
                  </td>
                  <td className={td}>
                    <Badge tone={row.mode === "profile" ? "gold" : "neutral"}>
                      {row.mode === "profile" ? "Profil" : "Anonym"}
                    </Badge>
                  </td>
                  <td className={`${td} text-zinc-400`}>{date(row.created_at)}</td>
                  <td className={`${td} text-right`}>
                    <DeleteCell id={row.user_id} kind="profile" />
                  </td>
                </tr>
              ))}
              {profileRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-500">
                    Keine Profile.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      <p className="mt-3 text-xs text-zinc-600">
        Beim Löschen eines Profils werden der Nutzer, seine Antworten und seine Fotos endgültig entfernt.
      </p>
    </div>
  );
}
