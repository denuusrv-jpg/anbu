"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  INTERESTS,
  LANGUAGES,
  PHASES,
  REGIONS,
  VIBES,
  VISIBILITIES,
  choiceLabels,
  labelOf,
  type Choice,
  type OnboardingAnswers,
  type ProfileData,
} from "@/lib/onboarding";

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
  vibes: Choice;
  profile: ProfileData | null;
  extras: OnboardingAnswers["extras"] | null;
};
export type DraftRow = { email: string; created_at: string; answers: OnboardingAnswers };

type Tab = "waitlist" | "profiles" | "drafts";

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-white/10 pt-4">
      <h3 className="text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">{title}</h3>
      <div className="mt-2 space-y-1.5 text-sm leading-relaxed text-zinc-200">{children}</div>
    </div>
  );
}

function Line({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <p>
      <span className="text-zinc-500">{label}: </span>
      {value}
    </p>
  );
}

// Alle Antworten einer Person (Profil oder Entwurf) im Detail
function Detail({
  email,
  answers,
  onClose,
}: {
  email: string;
  answers: OnboardingAnswers;
  onClose: () => void;
}) {
  const p = answers.profile;
  const e = answers.extras;
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-md"
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Details"
        className="max-h-full w-full max-w-lg space-y-4 overflow-y-auto rounded-3xl border border-white/10 bg-zinc-900/80 p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-gold uppercase">Antworten</p>
            <h2 className="mt-1 text-lg font-semibold text-zinc-50">{email || "Ohne E-Mail"}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="text-xl leading-none text-zinc-500 transition-colors hover:text-zinc-200"
          >
            ×
          </button>
        </div>

        <Section title="Basis">
          <Line label="Region" value={labelOf(answers.region, REGIONS)} />
          <Line label="Stadt" value={answers.city} />
          <Line label="Interessen" value={choiceLabels(answers.interests, INTERESTS).join(", ")} />
          <Line label="Vibe" value={choiceLabels(answers.vibes, VIBES).join(", ")} />
          <Line label="Modus" value={answers.mode === "profile" ? "Profil" : "Anonym"} />
        </Section>

        {p && (
          <Section title="Profil">
            <Line label="Anzeigename" value={p.displayName} />
            <Line label="Alter" value={p.age} />
            <Line label="Lebensphase" value={p.phase ? labelOf(p.phase, PHASES) : undefined} />
            <Line label="Sprachen" value={choiceLabels(p.languages, LANGUAGES).join(", ")} />
            <Line label="Hobbys" value={p.hobbies.join(", ")} />
            <Line label="Fun Fact" value={p.funFact} />
            <Line label="Frag mich nach" value={p.askMeAbout} />
            <Line label="Sichtbar für" value={labelOf(p.visibility, VISIBILITIES)} />
            <Line label="Fotos" value={p.photoCount} />
          </Section>
        )}

        {e?.freeText && (
          <Section title="Freitext">
            <p className="whitespace-pre-wrap">{e.freeText}</p>
          </Section>
        )}

        {e?.followUps && e.followUps.length > 0 && (
          <Section title="Folgefragen">
            {e.followUps.map((f, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-zinc-500">{f.question}</p>
                <p className="mt-1 whitespace-pre-wrap">{f.answer}</p>
              </div>
            ))}
          </Section>
        )}

        {e?.wishes && (
          <Section title="Wünsche & Ideen für DSpora">
            <p className="whitespace-pre-wrap">{e.wishes}</p>
          </Section>
        )}
      </div>
    </div>
  );
}

export default function AdminTable({
  waitlist,
  profiles,
  drafts = [],
}: {
  waitlist: WaitlistRow[];
  profiles: ProfileRow[];
  drafts?: DraftRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("waitlist");
  const [query, setQuery] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<{ email: string; answers: OnboardingAnswers } | null>(null);

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

  const draftRows = useMemo(
    () => drafts.filter((r) => !q || r.email.toLowerCase().includes(q)),
    [drafts, q],
  );

  async function remove(kind: "waitlist" | "profile" | "draft", id: string) {
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

  function DeleteCell({ id, kind }: { id: string; kind: "waitlist" | "profile" | "draft" }) {
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
              { id: "drafts", label: `Entwürfe (${drafts.length})` },
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
        ) : tab === "profiles" ? (
          <table className="w-full min-w-[900px] border-collapse">
            <thead className="border-b border-white/10">
              <tr>
                <th className={th}>E-Mail</th>
                <th className={th}>Region</th>
                <th className={th}>Interessen</th>
                <th className={th}>Modus</th>
                <th className={th}>Wünsche</th>
                <th className={th}>Erstellt</th>
                <th className={`${th} text-right`}>Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {profileRows.map((row) => (
                <tr key={row.user_id} className="transition-colors hover:bg-white/[0.03]">
                  <td className={td}>{row.email || "–"}</td>
                  <td className={td}>
                    {labelOf(row.region, REGIONS)}
                    {row.city ? <span className="text-zinc-500"> · {row.city}</span> : null}
                  </td>
                  <td className={`${td} max-w-[200px] truncate text-zinc-400`}>
                    {choiceLabels(row.interests, INTERESTS).join(", ") || "–"}
                  </td>
                  <td className={td}>
                    <Badge tone={row.mode === "profile" ? "gold" : "neutral"}>
                      {row.mode === "profile" ? "Profil" : "Anonym"}
                    </Badge>
                  </td>
                  <td className={`${td} max-w-[200px] truncate text-zinc-400`}>{row.extras?.wishes || "–"}</td>
                  <td className={`${td} text-zinc-400`}>{date(row.created_at)}</td>
                  <td className={`${td} text-right`}>
                    <span className="inline-flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          setDetail({
                            email: row.email,
                            answers: {
                              region: row.region,
                              city: row.city ?? undefined,
                              interests: row.interests,
                              vibes: row.vibes,
                              mode: row.mode as OnboardingAnswers["mode"],
                              profile: row.profile ?? undefined,
                              extras: row.extras ?? undefined,
                            },
                          })
                        }
                        className="text-xs text-zinc-300 transition-colors hover:text-gold"
                      >
                        Details
                      </button>
                      <DeleteCell id={row.user_id} kind="profile" />
                    </span>
                  </td>
                </tr>
              ))}
              {profileRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-zinc-500">
                    Keine Profile.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full min-w-[700px] border-collapse">
            <thead className="border-b border-white/10">
              <tr>
                <th className={th}>E-Mail</th>
                <th className={th}>Region</th>
                <th className={th}>Modus</th>
                <th className={th}>Wünsche</th>
                <th className={th}>Eingereicht</th>
                <th className={`${th} text-right`}>Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {draftRows.map((row) => (
                <tr key={row.email} className="transition-colors hover:bg-white/[0.03]">
                  <td className={td}>{row.email}</td>
                  <td className={td}>{labelOf(row.answers.region, REGIONS)}</td>
                  <td className={td}>
                    <Badge tone={row.answers.mode === "profile" ? "gold" : "neutral"}>
                      {row.answers.mode === "profile" ? "Profil" : "Anonym"}
                    </Badge>
                  </td>
                  <td className={`${td} max-w-[200px] truncate text-zinc-400`}>{row.answers.extras?.wishes || "–"}</td>
                  <td className={`${td} text-zinc-400`}>{date(row.created_at)}</td>
                  <td className={`${td} text-right`}>
                    <span className="inline-flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setDetail({ email: row.email, answers: row.answers })}
                        className="text-xs text-zinc-300 transition-colors hover:text-gold"
                      >
                        Details
                      </button>
                      <DeleteCell id={row.email} kind="draft" />
                    </span>
                  </td>
                </tr>
              ))}
              {draftRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-500">
                    Keine offenen Entwürfe.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      <p className="mt-3 text-xs text-zinc-600">
        {tab === "drafts"
          ? "Entwürfe sind fertig ausgefüllte Chats, deren Anmelde-Link noch nicht angeklickt wurde. Nach 7 Tagen werden sie nicht mehr übernommen."
          : "Beim Löschen eines Profils werden der Nutzer, seine Antworten und seine Fotos endgültig entfernt."}
      </p>
      {detail && <Detail email={detail.email} answers={detail.answers} onClose={() => setDetail(null)} />}
    </div>
  );
}
