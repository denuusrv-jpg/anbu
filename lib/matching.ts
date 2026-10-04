// Matching: wer passt zu wem? Reine Berechnung ohne Datenbankzugriff, damit sie sich leicht testen lässt.
// Regeln: gleiche Art (Community oder Business), mindestens ein gemeinsamer Hub, gleiche gewünschte Gruppengröße,
// die Geschlechtswünsche aller stimmen, und es gibt mindestens eine Gemeinsamkeit bei Interessen oder Vibe.

import {
  GOALS,
  GROUP_SIZES,
  INTERESTS,
  REGIONS,
  SECTORS,
  VIBES,
  choiceLabels,
  labelOf,
  type BusinessData,
  type Choice,
} from "@/lib/onboarding";

export const MAX_ACTIVE_CHATS = 4;
export const SIZE_OF: Record<string, number> = { duo: 2, crew: 4, squad: 8 };

export type Candidate = {
  userId: string;
  createdAt: string;
  hubs: string[]; // Ids oder eigener Text, höchstens zwei
  city: string | null;
  groupSize: string | null;
  track: "community" | "business";
  gender: string | null;
  matchGender: string | null;
  interests: Choice;
  vibes: Choice;
  business: BusinessData | null;
  activeChats: number;
};

export type Proposal = {
  members: Candidate[];
  hub: string;
  track: "community" | "business";
  shared: { interests: string[]; vibes: string[]; sector?: string; goals: string[] };
  score: number;
};

const norm = (t: string) => t.trim().toLowerCase();
const keys = (c: Choice) => [...c.ids, ...c.custom].map(norm);

function intersect(a: string[], b: string[]): string[] {
  return a.filter((x) => b.indexOf(x) >= 0);
}

/** Passt die gewünschte Person zum Geschlecht des Gegenübers? "Egal" passt immer. */
export function genderOk(wish: string | null, other: string | null): boolean {
  if (!wish || wish === "any") return true;
  return other === wish; // wer sich nicht angibt oder anders beschreibt, passt zu einem festen Wunsch nicht
}

export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function sizeOf(c: Candidate): number {
  return SIZE_OF[c.groupSize ?? "duo"] ?? 2;
}

/** Punkte für ein Paar, oder null wenn sie nicht zusammenpassen. */
export function pairScore(a: Candidate, b: Candidate): number | null {
  if (a.userId === b.userId) return null;
  if (a.track !== b.track) return null;
  if (sizeOf(a) !== sizeOf(b)) return null;
  if (intersect(a.hubs.map(norm), b.hubs.map(norm)).length === 0) return null;
  if (!genderOk(a.matchGender, b.gender) || !genderOk(b.matchGender, a.gender)) return null;

  const interests = intersect(keys(a.interests), keys(b.interests)).length;
  const vibes = intersect(keys(a.vibes), keys(b.vibes)).length;
  let business = 0;
  if (a.track === "business" && a.business && b.business) {
    if (norm(a.business.sector) === norm(b.business.sector)) business += 2;
    business += intersect(keys(a.business.goals), keys(b.business.goals)).length;
  }
  // Ohne jede Gemeinsamkeit kein Match
  if (interests + vibes + business === 0) return null;
  let score = interests * 2 + vibes + business;
  if (a.city && b.city && norm(a.city) === norm(b.city)) score += 1;
  return score;
}

export function commonHub(members: Candidate[]): string | null {
  let common = members[0].hubs.map(norm);
  for (const m of members.slice(1)) common = intersect(common, m.hubs.map(norm));
  if (common.length === 0) return null;
  // Original-Schreibweise des ersten Mitglieds zurückgeben
  return members[0].hubs.find((h) => norm(h) === common[0]) ?? common[0];
}

export function sharedOf(members: Candidate[]): Proposal["shared"] {
  const count = (pick: (c: Candidate) => string[]) => {
    const tally = new Map<string, number>();
    for (const m of members) for (const k of pick(m)) tally.set(k, (tally.get(k) ?? 0) + 1);
    const need = members.length === 2 ? 2 : Math.ceil(members.length / 2);
    return Array.from(tally.entries())
      .filter(([, n]) => n >= need)
      .sort((x, y) => y[1] - x[1])
      .map(([k]) => k);
  };
  const business = members.every((m) => m.business);
  return {
    interests: count((c) => keys(c.interests)),
    vibes: count((c) => keys(c.vibes)),
    sector: business && new Set(members.map((m) => norm((m.business as BusinessData).sector))).size === 1
      ? (members[0].business as BusinessData).sector
      : undefined,
    goals: business ? count((c) => keys((c.business as BusinessData).goals)) : [],
  };
}

/**
 * Bildet Gruppen: pro Person höchstens eine Gruppe pro Durchlauf, nur Personen mit freiem Chat-Platz.
 * Die Zusammensetzung ist gierig (immer die bestpassende Person als Nächstes), reicht für den Start.
 * existingPairs: Paare, die schon zusammen in einem Chat sind (werden nicht noch einmal gematcht).
 */
export function formGroups(candidates: Candidate[], existingPairs: Set<string>): Proposal[] {
  const pool = candidates
    .filter((c) => c.activeChats < MAX_ACTIVE_CHATS && c.hubs.length > 0)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const used = new Set<string>();
  const proposals: Proposal[] = [];

  const fits = (members: Candidate[], c: Candidate): number | null => {
    let total = 0;
    for (const m of members) {
      if (existingPairs.has(pairKey(m.userId, c.userId))) return null;
      const s = pairScore(m, c);
      if (s === null) return null;
      total += s;
    }
    if (!commonHub([...members, c])) return null;
    return total / members.length;
  };

  for (const seed of pool) {
    if (used.has(seed.userId)) continue;
    const size = sizeOf(seed);
    const members: Candidate[] = [seed];
    let score = 0;
    while (members.length < size) {
      let best: { c: Candidate; s: number } | null = null;
      for (const c of pool) {
        if (used.has(c.userId) || members.some((m) => m.userId === c.userId)) continue;
        const s = fits(members, c);
        if (s !== null && (!best || s > best.s)) best = { c, s };
      }
      if (!best) break;
      members.push(best.c);
      score += best.s;
    }
    if (members.length < size) continue; // nicht genug passende Personen: keine halbe Gruppe
    members.forEach((m) => used.add(m.userId));
    proposals.push({
      members,
      hub: commonHub(members) as string,
      track: seed.track,
      shared: sharedOf(members),
      score,
    });
  }
  return proposals;
}

const label = (id: string, options: { id: string; label: string }[]) => labelOf(id, options);

/** Der Match-Steckbrief als Text: warum wurden diese Personen zusammengebracht? */
export function matchSummary(p: Pick<Proposal, "hub" | "track" | "shared"> & { size: number }): string {
  const parts: string[] = [];
  parts.push(
    `${p.size === 2 ? "Ihr zwei" : `Ihr ${p.size}`} seid im Hub ${label(p.hub, REGIONS)} und wolltet beide in einer ${
      p.size === 2 ? "2er" : `${p.size}er`
    }-Gruppe Leute treffen.`,
  );
  if (p.shared.interests.length > 0) {
    parts.push(`Das verbindet euch: ${p.shared.interests.map((i) => label(i, INTERESTS)).join(", ")}.`);
  }
  if (p.shared.vibes.length > 0) {
    parts.push(`Ähnlicher Vibe: ${p.shared.vibes.map((v) => label(v, VIBES)).join(", ")}.`);
  }
  if (p.track === "business") {
    if (p.shared.sector) parts.push(`Gleiche Branche: ${label(p.shared.sector, SECTORS)}.`);
    if (p.shared.goals.length > 0) parts.push(`Ähnliche Ziele: ${p.shared.goals.map((g) => label(g, GOALS)).join(", ")}.`);
    parts.unshift("Business-Match.");
  }
  return parts.join(" ");
}

export const sizeLabel = (id: string | null) => (id ? labelOf(id, GROUP_SIZES) : "Duo (2er Gruppe)");
export { choiceLabels };
