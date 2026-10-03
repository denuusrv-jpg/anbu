"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  GOALS,
  GROUP_SIZES,
  INTERESTS,
  LANGUAGES,
  PHASES,
  REGIONS,
  SECTORS,
  VIBES,
  VISIBILITIES,
  choiceLabels,
  labelOf,
  type BusinessData,
  type OnboardingAnswers,
} from "@/lib/onboarding";
import type { AdminDraft, AdminProfile, AdminWaitlist, AdminWish } from "@/lib/adminData";

const RETENTION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

type Tab = "profiles" | "waitlist" | "drafts" | "deleted";
type Confirm = { id: string; action: "delete" | "purge" | "waitlist" | "draft" } | null;

const date = (value: string) =>
  new Date(value).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });

const daysLeft = (deletedAt: string) =>
  Math.max(0, Math.ceil((new Date(deletedAt).getTime() + RETENTION_DAYS * DAY_MS - Date.now()) / DAY_MS));

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "gold" | "rose" }) {
  const styles = {
    neutral: "border-white/10 bg-white/5 text-zinc-300",
    gold: "border-gold/40 bg-gold/10 text-gold",
    rose: "border-rose/40 bg-rose/10 text-rose",
  }[tone];
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${styles}`}>{children}</span>
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
  wishes,
  visibility,
  onClose,
}: {
  email: string;
  answers: OnboardingAnswers;
  wishes: string[];
  visibility?: string;
  onClose: () => void;
}) {
  const p = answers.profile;
  const e = answers.extras;
  const allWishes = [...wishes, ...(e?.wishes && !wishes.includes(e.wishes) ? [e.wishes] : [])];
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
          <Line label="Gruppengröße" value={answers.groupSize ? labelOf(answers.groupSize, GROUP_SIZES) : undefined} />
          <Line label="Region" value={labelOf(answers.region, REGIONS)} />
          <Line label="Stadt" value={answers.city} />
          <Line label="Interessen" value={choiceLabels(answers.interests, INTERESTS).join(", ")} />
          <Line label="Vibe" value={choiceLabels(answers.vibes, VIBES).join(", ")} />
          <Line label="Modus" value={answers.mode === "profile" ? "Profil" : "Anonym"} />
          <Line label="Art" value={answers.track === "business" ? "Business & Co-Founding" : "Privat / Community"} />
          <Line label="Sichtbarkeit" value={visibility ? labelOf(visibility, VISIBILITIES) : undefined} />
        </Section>

        {answers.business && (
          <Section title="Business & Light-CV">
            <Line label="Branche" value={labelOf(answers.business.sector, SECTORS)} />
            <Line label="Rolle" value={answers.business.role} />
            <Line label="Ziele" value={choiceLabels(answers.business.goals, GOALS).join(", ")} />
            <Line label="Expertise" value={answers.business.cv.expertise} />
            {answers.business.cv.achievements.length > 0 && (
              <ul className="list-disc space-y-1 pl-5">
                {answers.business.cv.achievements.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            )}
            <Line label="Links" value={answers.business.cv.links.join(", ")} />
          </Section>
        )}

        {p && (
          <Section title="Profil">
            <Line label="Anzeigename" value={p.displayName} />
            <Line label="Alter" value={p.age} />
            <Line label="Lebensphase" value={p.phase ? labelOf(p.phase, PHASES) : undefined} />
            <Line label="Sprachen" value={choiceLabels(p.languages, LANGUAGES).join(", ")} />
            <Line label="Hobbys" value={p.hobbies.join(", ")} />
            <Line label="Fun Fact" value={p.funFact} />
            <Line label="Frag mich nach" value={p.askMeAbout} />
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

        {allWishes.length > 0 && (
          <Section title="Wünsche & Ideen für DSpora">
            {allWishes.map((w, i) => (
              <p key={i} className="whitespace-pre-wrap">
                {w}
              </p>
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}

function answersOf(row: AdminProfile): OnboardingAnswers {
  return {
    groupSize: row.group_size ?? undefined,
    region: row.region,
    city: row.city ?? undefined,
    interests: row.interests,
    vibes: row.vibes,
    mode: row.mode as OnboardingAnswers["mode"],
    track: row.track,
    business: (row.business as BusinessData | null) ?? undefined,
    profile: row.profile ?? undefined,
    extras: row.extras ?? undefined,
  };
}

export default function AdminTable({
  waitlist,
  profiles,
  drafts,
  wishes,
}: {
  waitlist: AdminWaitlist[];
  profiles: AdminProfile[];
  drafts: AdminDraft[];
  wishes: AdminWish[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profiles");
  const [query, setQuery] = useState("");
  const [confirming, setConfirming] = useState<Confirm>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<{ email: string; answers: OnboardingAnswers; wishes: string[]; visibility?: string } | null>(null);

  const active = useMemo(() => profiles.filter((p) => !p.deleted_at), [profiles]);
  const deleted = useMemo(
    () =>
      profiles
        .filter((p) => p.deleted_at)
        .sort((a, b) => (b.deleted_at as string).localeCompare(a.deleted_at as string)),
    [profiles],
  );

  const q = query.trim().toLowerCase();
  const nameOf = (p: AdminProfile) => p.profile?.displayName ?? "Anonym";
  const matches = (p: AdminProfile) =>
    !q || p.email.toLowerCase().includes(q) || nameOf(p).toLowerCase().includes(q) || (p.city ?? "").toLowerCase().includes(q);

  const activeRows = active.filter(matches);
  const deletedRows = deleted.filter(matches);
  const waitlistRows = waitlist.filter((r) => !q || r.email.toLowerCase().includes(q));
  const draftRows = drafts.filter((r) => !q || r.email.toLowerCase().includes(q));

  function openDetail(row: AdminProfile) {
    setDetail({
      email: row.email,
      answers: answersOf(row),
      wishes: wishes.filter((w) => w.user_id === row.user_id).map((w) => w.wish),
      visibility: row.visibility,
    });
  }

  async function call(id: string, url: string, init: RequestInit) {
    setBusy(id);
    setError("");
    try {
      const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Das hat nicht geklappt.");
        return;
      }
      setConfirming(null);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const account = (id: string, action: "delete" | "restore" | "purge") =>
    call(id, "/api/admin/accounts", { method: "POST", body: JSON.stringify({ action, id }) });
  const entry = (id: string, kind: "waitlist" | "draft") =>
    call(id, "/api/admin/entries", { method: "DELETE", body: JSON.stringify({ kind, id }) });

  // Zeile "Löschen" mit Sicherheitsabfrage
  function renderDelete(
    id: string,
    kind: NonNullable<Confirm>["action"],
    onConfirm: () => void,
    label = "Löschen",
    confirmLabel = "Ja, löschen",
  ) {
    if (confirming?.id === id && confirming.action === kind) {
      return (
        <span className="inline-flex items-center gap-2 text-xs">
          <button
            type="button"
            disabled={busy === id}
            onClick={onConfirm}
            className="rounded-full bg-rose/90 px-3 py-1 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy === id ? "Moment …" : confirmLabel}
          </button>
          <button type="button" onClick={() => setConfirming(null)} className="text-zinc-400 transition-colors hover:text-zinc-200">
            Abbrechen
          </button>
        </span>
      );
    }
    return (
      <button
        type="button"
        onClick={() => setConfirming({ id, action: kind })}
        className="text-xs text-zinc-500 transition-colors hover:text-rose"
      >
        {label}
      </button>
    );
  }

  const th = "px-4 py-3 text-left text-[11px] font-semibold tracking-wide text-zinc-500 uppercase";
  const td = "px-4 py-3 align-middle text-sm text-zinc-200";
  const detailBtn = "text-xs text-zinc-300 transition-colors hover:text-gold";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-xl">
          {(
            [
              { id: "profiles", label: `User (${active.length})` },
              { id: "waitlist", label: `Warteliste (${waitlist.length})` },
              { id: "drafts", label: `Entwürfe (${drafts.length})` },
              { id: "deleted", label: `Gelöscht (${deleted.length})` },
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
        {tab === "profiles" && (
          <table className="w-full min-w-[820px] border-collapse">
            <thead className="border-b border-white/10">
              <tr>
                <th className={th}>Profilname</th>
                <th className={th}>E-Mail</th>
                <th className={th}>Status</th>
                <th className={th}>Letzter Login</th>
                <th className={th}>Region</th>
                <th className={`${th} text-right`}>Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {activeRows.map((row) => (
                <tr key={row.user_id} className="transition-colors hover:bg-white/[0.03]">
                  <td className={td}>{nameOf(row)}</td>
                  <td className={td}>{row.email || "–"}</td>
                  <td className={td}>
                    <span className="inline-flex items-center gap-1.5">
                      <Badge tone="gold">Aktiv</Badge>
                      <Badge>{row.mode === "profile" ? "Profil" : "Anonym"}</Badge>
                      {row.track === "business" && <Badge tone="gold">Business</Badge>}
                    </span>
                  </td>
                  <td className={`${td} text-zinc-400`}>{row.last_sign_in_at ? date(row.last_sign_in_at) : "–"}</td>
                  <td className={td}>
                    {labelOf(row.region, REGIONS)}
                    {row.city ? <span className="text-zinc-500"> · {row.city}</span> : null}
                  </td>
                  <td className={`${td} text-right`}>
                    <span className="inline-flex items-center gap-4">
                      <button type="button" onClick={() => openDetail(row)} className={detailBtn}>
                        Details
                      </button>
                      {renderDelete(
                        row.user_id,
                        "delete",
                        () => account(row.user_id, "delete"),
                        "Konto löschen",
                        "Ja, löschen (30 Tage)",
                      )}
                    </span>
                  </td>
                </tr>
              ))}
              {activeRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-500">
                    Keine User.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {tab === "waitlist" && (
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
                    {renderDelete(row.id, "waitlist", () => entry(row.id, "waitlist"))}
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
        )}

        {tab === "drafts" && (
          <table className="w-full min-w-[700px] border-collapse">
            <thead className="border-b border-white/10">
              <tr>
                <th className={th}>E-Mail</th>
                <th className={th}>Region</th>
                <th className={th}>Modus</th>
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
                  <td className={`${td} text-zinc-400`}>{date(row.created_at)}</td>
                  <td className={`${td} text-right`}>
                    <span className="inline-flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setDetail({ email: row.email, answers: row.answers, wishes: [] })}
                        className={detailBtn}
                      >
                        Details
                      </button>
                      {renderDelete(row.email, "draft", () => entry(row.email, "draft"))}
                    </span>
                  </td>
                </tr>
              ))}
              {draftRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-zinc-500">
                    Keine offenen Entwürfe.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {tab === "deleted" && (
          <table className="w-full min-w-[820px] border-collapse">
            <thead className="border-b border-white/10">
              <tr>
                <th className={th}>Profilname</th>
                <th className={th}>E-Mail</th>
                <th className={th}>Gelöscht am</th>
                <th className={th}>Endgültig in</th>
                <th className={`${th} text-right`}>Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {deletedRows.map((row) => (
                <tr key={row.user_id} className="transition-colors hover:bg-white/[0.03]">
                  <td className={td}>{nameOf(row)}</td>
                  <td className={td}>{row.email || "–"}</td>
                  <td className={`${td} text-zinc-400`}>{date(row.deleted_at as string)}</td>
                  <td className={td}>
                    <Badge tone="rose">{daysLeft(row.deleted_at as string)} Tage</Badge>
                  </td>
                  <td className={`${td} text-right`}>
                    <span className="inline-flex items-center gap-4">
                      <button type="button" onClick={() => openDetail(row)} className={detailBtn}>
                        Details
                      </button>
                      <button
                        type="button"
                        disabled={busy === row.user_id}
                        onClick={() => account(row.user_id, "restore")}
                        className="text-xs text-zinc-300 transition-colors hover:text-gold disabled:opacity-50"
                      >
                        Wiederherstellen
                      </button>
                      {renderDelete(
                        row.user_id,
                        "purge",
                        () => account(row.user_id, "purge"),
                        "Endgültig löschen",
                        "Ja, endgültig",
                      )}
                    </span>
                  </td>
                </tr>
              ))}
              {deletedRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-zinc-500">
                    Keine gelöschten Accounts.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-zinc-600">
        {tab === "deleted"
          ? `Gelöschte Accounts bleiben ${RETENTION_DAYS} Tage für den Support sichtbar und werden danach automatisch und endgültig entfernt (Recht auf Vergessenwerden).`
          : tab === "drafts"
            ? "Entwürfe sind fertig ausgefüllte Chats, deren Anmelde-Link noch nicht angeklickt wurde. Nach 7 Tagen werden sie nicht mehr übernommen."
            : tab === "profiles"
              ? `„Konto löschen“ sperrt den Account sofort. Er bleibt ${RETENTION_DAYS} Tage unter „Gelöscht“ erhalten.`
              : ""}
      </p>
      {detail && (
        <Detail
          email={detail.email}
          answers={detail.answers}
          wishes={detail.wishes}
          visibility={detail.visibility}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}
