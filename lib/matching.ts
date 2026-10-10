// Matching: wer passt zu wem? Reine Berechnung ohne Datenbankzugriff, damit sie sich leicht testen lässt.
//
// Stufe 1, Filter (sonst kein Match): gleiche Richtung, Online/Aktivitäten passt, Geschlechtswunsch in beide Richtungen,
//   Alter in der Spanne des anderen (beidseitig), gemeinsame Sprache, Gruppengröße, Fahrzeit mit dem Auto (nur Aktivitäten).
// Stufe 2, Punkte von 0 bis 100: Interessen, Vibe, (Branche, Ziele), Sprache, Lebensphase, Alter, Nähe, Treffhäufigkeit.
//   Dazu KI-Resonanz (bis +3), Wartebonus (bis +5) und Abzüge für No-Gos (bis -20).
// Stufe 3, Schwellen: ab 60 "gut" (wird zur Freigabe vorgeschlagen), 45 bis 59 "mittel", darunter kein Match.
// Gruppen entstehen mit den besten Paaren zuerst, Leute mit "Egal" bei der Größe füllen Lücken.

import { conceptLabel, matchConcepts, relation, type ConceptMatch } from "@/lib/concepts";
import { genderGroup, labelOf, ALL_HUBS, GOALS, SECTORS, type BusinessData } from "@/lib/onboarding";
import { travelMinutes } from "@/lib/geo";

export const MAX_ACTIVE_CHATS = 4;
export const SIZE_OF: Record<string, number> = { duo: 2, crew: 4, squad: 8 };

export const SCORE_GOOD = 60;
export const SCORE_MID = 45;

export type AiTags = { communication: Tag3; energy: Tag3; planning: Tag3 };
// Jeder Wert-Tag hat zwei Pole und "balanced" (ausgeglichen)
export type Tag3 = "a" | "b" | "balanced";
export type AiProfile = { tags?: AiTags; noGos?: string[]; summary?: string };

export type Candidate = {
  userId: string;
  createdAt: string;
  hub: string; // Heimat-Hub (Id), "online" oder "warteliste"
  city: string | null;
  lat: number | null;
  lng: number | null;
  groupSize: "duo" | "crew" | "squad" | "any" | null;
  track: "community" | "business";
  gender: string | null;
  matchGender: string | null;
  age: number | null;
  ageMin: number | null;
  ageMax: number | null;
  meetMode: "online" | "activities" | null;
  travelMinutes: number | null; // null = egal
  languages: string[]; // klein geschrieben
  lifePhase: string | null;
  frequency: string | null;
  interests: string[]; // Begriffe (siehe lib/concepts.ts)
  vibes: string[];
  business: BusinessData | null;
  ai: AiProfile | null;
  activeChats: number;
  waitingDays: number;
};

export type Breakdown = {
  interests: number;
  vibe: number;
  sector: number;
  goals: number;
  language: number;
  phase: number;
  age: number;
  near: number;
  frequency: number;
  resonance: number;
  nogo: number;
  wait: number;
  total: number;
  minutes: number | null; // geschätzte Fahrzeit
  sharedInterests: ConceptMatch[];
  sharedVibes: ConceptMatch[];
  sharedLanguages: string[];
  sharedGoals: string[];
};

export type Proposal = {
  members: Candidate[];
  hub: string;
  track: "community" | "business";
  shared: Shared;
  score: number;
  quality: "good" | "mid";
  pairs: { a: string; b: string; breakdown: Breakdown }[];
};

export type Shared = {
  interests: string[]; // Begriffe
  vibes: string[];
  sector?: string;
  goals: string[];
  languages: string[];
  minutes?: number; // größte geschätzte Fahrzeit in der Gruppe
  online: boolean;
};

const norm = (t: string) => t.trim().toLowerCase();

export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function sizeOf(c: Pick<Candidate, "groupSize">): number | null {
  return c.groupSize && c.groupSize !== "any" ? SIZE_OF[c.groupSize] : null; // null = egal
}

/** Alle Pflichtangaben vorhanden? Wer unvollständig ist, wird nicht gematcht. */
export function missingFields(c: Candidate): string[] {
  const miss: string[] = [];
  if (!c.groupSize) miss.push("Gruppengröße");
  if (!c.gender) miss.push("Geschlecht");
  if (!c.matchGender) miss.push("Geschlechtswunsch");
  if (c.age === null) miss.push("Alter");
  if (c.ageMin === null || c.ageMax === null) miss.push("Altersspanne");
  if (!c.meetMode) miss.push("Art der Freundschaft");
  if (c.languages.length === 0) miss.push("Sprachen");
  if (c.interests.length === 0) miss.push("Interessen");
  if (c.meetMode === "activities" && (c.lat === null || c.lng === null)) miss.push("Ort");
  return miss;
}

/** Passt der Geschlechtswunsch von "wish" zur Person "other"? "Egal" und "Gemischt" passen auf Paarebene immer. */
export function genderOk(wish: string | null, other: string | null): boolean {
  if (!wish || wish === "any" || wish === "mixed") return true;
  const g = genderGroup(other);
  if (wish === "male") return g === "male";
  if (wish === "female") return g === "female";
  if (wish === "other") return g === "other";
  return true;
}

function groupSizeCompatible(a: Candidate, b: Candidate): boolean {
  const x = sizeOf(a);
  const y = sizeOf(b);
  return x === null || y === null || x === y;
}

function languagesShared(a: string[], b: string[]): string[] {
  // "Mix aus allem" passt zu jeder Sprache
  const aMix = a.indexOf("mix") >= 0;
  const bMix = b.indexOf("mix") >= 0;
  if (aMix && bMix) return ["mix"];
  if (aMix) return b.filter((l) => l !== "mix");
  if (bMix) return a.filter((l) => l !== "mix");
  return a.filter((l) => b.indexOf(l) >= 0);
}

/** Warum zwei Personen nicht zusammenpassen (Filter), oder null wenn alle Filter bestanden sind. */
export function filterReason(a: Candidate, b: Candidate): string | null {
  if (a.userId === b.userId) return "gleiche Person";
  if (a.track !== b.track) return "andere Richtung";
  if (!groupSizeCompatible(a, b)) return "Gruppengröße";
  if (a.meetMode !== b.meetMode) return "online/Aktivitäten";
  if (!genderOk(a.matchGender, b.gender) || !genderOk(b.matchGender, a.gender)) return "Geschlechtswunsch";
  if (a.age === null || b.age === null || a.ageMin === null || a.ageMax === null || b.ageMin === null || b.ageMax === null) return "Alter fehlt";
  if (b.age < a.ageMin || b.age > a.ageMax || a.age < b.ageMin || a.age > b.ageMax) return "Alter";
  if (languagesShared(a.languages, b.languages).length === 0) return "Sprache";
  if (a.meetMode === "activities") {
    if (a.lat === null || a.lng === null || b.lat === null || b.lng === null) return "Ort fehlt";
    const limit = limitOf(a, b);
    if (limit !== null && travelMinutes(a.lat, a.lng, b.lat, b.lng) > limit) return "Entfernung";
  }
  return null;
}

/** Gemeinsame Obergrenze der Fahrzeit (der kleinere Wert zählt). null = beide egal. */
function limitOf(a: Candidate, b: Candidate): number | null {
  if (a.travelMinutes === null) return b.travelMinutes;
  if (b.travelMinutes === null) return a.travelMinutes;
  return Math.min(a.travelMinutes, b.travelMinutes);
}

// ——— Punkte ———

type Weights = { interests: number; vibe: number; sector: number; goals: number; language: number; phase: number; age: number; near: number; freq: number };
const FRIENDS: Weights = { interests: 35, vibe: 15, sector: 0, goals: 0, language: 10, phase: 5, age: 10, near: 15, freq: 10 };
const BUSINESS: Weights = { interests: 20, vibe: 10, sector: 15, goals: 20, language: 5, phase: 0, age: 5, near: 15, freq: 10 };
// Punkte je Treffer: gleicher Begriff, gleiche Gruppe, gleiches Gebiet
const INTEREST_POINTS: Record<"community" | "business", [number, number, number]> = { community: [9, 5, 3], business: [7, 4, 2] };
const VIBE_POINTS = [5, 3] as const;
const GOAL_POINT = 7;
const SECTOR_FAMILIES = [["tech", "media"], ["finance", "consulting", "realestate"], ["commerce", "food"], ["health", "education"], ["industry", "realestate"]];
const FREQ_ORDER = ["rare", "monthly", "weekly", "often"];
const LEGACY_FREQ: Record<string, string> = { weekend: "monthly", multi: "often", flexible: "weekly" };

export function frequencyIndex(value: string | null): number | null {
  if (!value) return null;
  const v = LEGACY_FREQ[value] ?? value;
  const i = FREQ_ORDER.indexOf(v);
  return i < 0 ? null : i;
}

function ageFactor(a: number, b: number): number {
  const d = Math.abs(a - b);
  return d <= 2 ? 1 : d <= 4 ? 0.7 : d <= 7 ? 0.4 : 0;
}

function tagPoints(a: AiProfile | null, b: AiProfile | null): number {
  if (!a?.tags || !b?.tags) return 0;
  let sum = 0;
  (["communication", "energy", "planning"] as const).forEach((k) => {
    const x = a.tags![k];
    const y = b.tags![k];
    if (x === y && x !== "balanced") sum += 1;
    else if (x === "balanced" || y === "balanced") sum += 0.5;
  });
  return Math.min(3, sum);
}

function noGoPenalty(a: Candidate, b: Candidate): number {
  let hits = 0;
  const check = (nogos: string[] | undefined, interests: string[]) => {
    for (const g of nogos ?? []) if (interests.some((i) => relation(g, i, "interest") >= 2)) hits += 1;
  };
  check(a.ai?.noGos, b.interests);
  check(b.ai?.noGos, a.interests);
  return Math.min(20, hits * 10);
}

const sectorKey = (b: BusinessData | null) => (b ? norm(b.sector) : "");
const goalKeys = (b: BusinessData | null) => (b ? [...b.goals.ids, ...b.goals.custom].map(norm) : []);

/** Punkte für ein Paar, oder null wenn ein Filter nicht besteht oder die Mindest-Gemeinsamkeit fehlt oder die Gesamtpunkte unter der Schwelle liegen. */
export function pairScore(a: Candidate, b: Candidate): Breakdown | null {
  if (filterReason(a, b) !== null) return null;
  const track = a.track;
  const w = track === "business" ? BUSINESS : FRIENDS;
  const online = a.meetMode === "online";

  const sharedInterests = matchConcepts(a.interests, b.interests, "interest");
  const ip = INTEREST_POINTS[track];
  let interests = 0;
  for (const m of sharedInterests) interests += m.level === 3 ? ip[0] : m.level === 2 ? ip[1] : ip[2];
  interests = Math.min(w.interests, interests);

  const sharedVibes = matchConcepts(a.vibes, b.vibes, "vibe");
  let vibe = 0;
  for (const m of sharedVibes) vibe += m.level === 3 ? VIBE_POINTS[0] : m.level === 2 ? VIBE_POINTS[1] : 0;
  vibe = Math.min(w.vibe, vibe);

  let sector = 0;
  let goals = 0;
  let sharedGoals: string[] = [];
  if (track === "business") {
    const sa = sectorKey(a.business);
    const sb = sectorKey(b.business);
    if (sa && sa === sb) sector = w.sector;
    else if (sa && sb && SECTOR_FAMILIES.some((f) => f.indexOf(sa) >= 0 && f.indexOf(sb) >= 0)) sector = Math.round(w.sector / 2);
    sharedGoals = goalKeys(a.business).filter((g) => goalKeys(b.business).indexOf(g) >= 0);
    goals = Math.min(w.goals, sharedGoals.length * GOAL_POINT);
  }

  const sharedLanguages = languagesShared(a.languages, b.languages);
  const language = Math.round(w.language * (sharedLanguages.length >= 2 || sharedLanguages[0] === "mix" ? 1 : 0.6));
  const phase = track === "community" && a.lifePhase && a.lifePhase === b.lifePhase && a.lifePhase !== "sonstiges" ? w.phase : 0;
  const age = Math.round(w.age * ageFactor(a.age as number, b.age as number));

  let near = 0;
  let frequency = 0;
  let minutes: number | null = null;
  if (!online) {
    minutes = travelMinutes(a.lat as number, a.lng as number, b.lat as number, b.lng as number);
    const limit = limitOf(a, b);
    const f = limit === null ? (minutes <= 25 ? 1 : minutes <= 60 ? 0.7 : 0.4) : minutes / limit <= 0.25 ? 1 : minutes / limit <= 0.5 ? 0.7 : 0.4;
    near = Math.round(w.near * f);
    const fa = frequencyIndex(a.frequency);
    const fb = frequencyIndex(b.frequency);
    if (fa !== null && fb !== null) frequency = Math.round(w.freq * (fa === fb ? 1 : Math.abs(fa - fb) === 1 ? 0.5 : 0));
  }

  // Mindest-Gemeinsamkeit: Alter und Nähe allein reichen nie
  if (track === "business") {
    if (sector + goals < 7) return null;
  } else if (interests < 9) {
    return null;
  }

  const raw = interests + vibe + sector + goals + language + phase + age + near + frequency;
  // Online-Freundschaften haben keine Nähe und keine Treffhäufigkeit: Rest auf 100 hochrechnen
  const maxRaw = w.interests + w.vibe + w.sector + w.goals + w.language + w.phase + w.age + (online ? 0 : w.near + w.freq);
  const base = Math.round((raw * 100) / maxRaw);
  const resonance = tagPoints(a.ai, b.ai);
  const nogo = noGoPenalty(a, b);
  const wait = base >= 50 ? Math.min(5, Math.floor((a.waitingDays + b.waitingDays) / 2 / 7)) : 0;
  const total = Math.max(0, Math.min(100, Math.round((base + resonance + wait - nogo) * 10) / 10));
  if (total < SCORE_MID) return null;

  return { interests, vibe, sector, goals, language, phase, age, near, frequency, resonance, nogo, wait, total, minutes, sharedInterests, sharedVibes, sharedLanguages, sharedGoals };
}

// ——— Gruppen ———

const sameKind = (list: Candidate[]) => list.every((m) => m.track === list[0].track);

/** Gemischte Gruppe: wer "Gemischt" wünscht, braucht mindestens zwei verschiedene Geschlechtsgruppen in der Gruppe. */
export function compositionOk(members: Candidate[]): boolean {
  if (!members.some((m) => m.matchGender === "mixed")) return true;
  const groups: string[] = [];
  for (const m of members) {
    const g = genderGroup(m.gender);
    if (g !== "unknown" && groups.indexOf(g) < 0) groups.push(g);
  }
  return groups.length >= 2;
}

export function commonHub(members: Candidate[]): string {
  const tally: Record<string, number> = {};
  for (const m of members) tally[m.hub] = (tally[m.hub] ?? 0) + 1;
  return Object.keys(tally).sort((x, y) => tally[y] - tally[x])[0];
}

export function sharedOf(members: Candidate[], pairs: { breakdown: Breakdown }[]): Shared {
  const tally = (pick: (c: Candidate) => string[]) => {
    const counts: Record<string, number> = {};
    for (const m of members) for (const k of pick(m)) counts[k] = (counts[k] ?? 0) + 1;
    const need = members.length === 2 ? 2 : Math.ceil(members.length / 2);
    return Object.keys(counts).filter((k) => counts[k] >= need).sort((x, y) => counts[y] - counts[x]);
  };
  // Bei Paaren zusätzlich ähnliche Begriffe (z. B. Tennis und Padel) nennen
  const interests = tally((c) => c.interests);
  const fromPairs: string[] = [];
  for (const p of pairs) for (const m of p.breakdown.sharedInterests) {
    if (fromPairs.indexOf(m.a) < 0) fromPairs.push(m.a);
    if (fromPairs.indexOf(m.b) < 0) fromPairs.push(m.b);
  }
  const mergedInterests = interests.length > 0 ? interests : fromPairs;
  const business = members.every((m) => m.business);
  const sectors = members.map((m) => (m.business ? norm(m.business.sector) : ""));
  const maxMinutes = pairs.reduce((mx, p) => Math.max(mx, p.breakdown.minutes ?? 0), 0);
  return {
    interests: mergedInterests,
    vibes: tally((c) => c.vibes),
    sector: business && sectors.every((s) => s === sectors[0]) ? (members[0].business as BusinessData).sector : undefined,
    goals: business ? tally((c) => goalKeys(c.business)) : [],
    languages: tally((c) => c.languages).filter((l) => l !== "mix"),
    minutes: maxMinutes > 0 ? maxMinutes : undefined,
    online: members.every((m) => m.meetMode === "online"),
  };
}

/**
 * Bildet Gruppen mit den besten Paaren zuerst. Pro Person höchstens eine Gruppe pro Durchlauf, nur mit freiem Chat-Platz.
 * existingPairs: Paare, die schon zusammen in einem Chat waren. includeMedium: auch "mittlere" Matches (45 bis 59) vorschlagen.
 * Wer bei der Größe "Egal" gewählt hat, füllt Lücken (zuerst in Gruppen mit fester Größe, dann als Duo).
 */
export function formGroups(candidates: Candidate[], existingPairs: Set<string>, opts: { includeMedium?: boolean } = {}): Proposal[] {
  const threshold = opts.includeMedium ? SCORE_MID : SCORE_GOOD;
  const pool = candidates
    .filter((c) => c.activeChats < MAX_ACTIVE_CHATS && missingFields(c).length === 0)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  // Paarwerte einmal berechnen (nur Paare, die alle Filter bestehen und die Schwelle des Paares erreichen)
  const scores: Record<string, Breakdown> = {};
  const neighbours: Record<string, string[]> = {};
  const byId: Record<string, Candidate> = {};
  for (const c of pool) {
    byId[c.userId] = c;
    neighbours[c.userId] = [];
  }
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      const a = pool[i];
      const b = pool[j];
      if (existingPairs.has(pairKey(a.userId, b.userId))) continue;
      const s = pairScore(a, b);
      if (!s || s.total < SCORE_MID) continue;
      scores[pairKey(a.userId, b.userId)] = s;
      neighbours[a.userId].push(b.userId);
      neighbours[b.userId].push(a.userId);
    }
  }
  const score = (x: string, y: string): number | null => {
    const s = scores[pairKey(x, y)];
    return s ? s.total : null;
  };

  const used: Record<string, boolean> = {};
  const proposals: Proposal[] = [];

  const build = (size: number, allowed: (c: Candidate) => boolean, needFixed: boolean) => {
    // Alle Paare der erlaubten Personen, beste zuerst
    const list: { a: string; b: string; s: number }[] = [];
    for (const id of Object.keys(neighbours)) {
      if (used[id] || !allowed(byId[id])) continue;
      for (const other of neighbours[id]) {
        if (id < other && !used[other] && allowed(byId[other])) list.push({ a: id, b: other, s: score(id, other) as number });
      }
    }
    list.sort((x, y) => y.s - x.s);
    for (const seed of list) {
      if (used[seed.a] || used[seed.b]) continue;
      const members: Candidate[] = [byId[seed.a], byId[seed.b]];
      let ok = true;
      while (members.length < size) {
        let best: { c: Candidate; avg: number } | null = null;
        for (const id of Object.keys(neighbours)) {
          const c = byId[id];
          if (used[id] || !allowed(c) || members.some((m) => m.userId === id)) continue;
          let total = 0;
          let fits = true;
          for (const m of members) {
            const v = score(m.userId, id);
            if (v === null) {
              fits = false;
              break;
            }
            total += v;
          }
          if (!fits) continue;
          // Der letzte Platz muss die Zusammensetzung (gemischt) erfüllen
          if (members.length === size - 1 && !compositionOk([...members, c])) continue;
          const avg = total / members.length;
          if (!best || avg > best.avg) best = { c, avg };
        }
        if (!best) {
          ok = false;
          break;
        }
        members.push(best.c);
      }
      if (!ok || members.length < size || !compositionOk(members) || !sameKind(members)) continue;
      if (needFixed && !members.some((m) => sizeOf(m) === size)) continue;
      // Gruppenwert = Durchschnitt aller Paare, jedes Paar muss die Mindestschwelle erreichen
      const pairs: Proposal["pairs"] = [];
      let sum = 0;
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const b = scores[pairKey(members[i].userId, members[j].userId)];
          pairs.push({ a: members[i].userId, b: members[j].userId, breakdown: b });
          sum += b.total;
        }
      }
      const avg = Math.round((sum / pairs.length) * 10) / 10;
      if (avg < threshold) continue;
      members.forEach((m) => (used[m.userId] = true));
      proposals.push({
        members,
        hub: commonHub(members),
        track: members[0].track,
        shared: sharedOf(members, pairs),
        score: avg,
        quality: avg >= SCORE_GOOD ? "good" : "mid",
        pairs,
      });
    }
  };

  // 1) Gruppen mit fester Größe nur aus Leuten, die genau diese Größe gewählt haben
  for (const size of [2, 4, 8]) build(size, (c) => sizeOf(c) === size, false);
  // 2) Lücken füllen: "Egal"-Leute ergänzen Gruppen, in denen mindestens eine Person die feste Größe gewählt hat
  for (const size of [2, 4, 8]) build(size, (c) => sizeOf(c) === size || sizeOf(c) === null, true);
  // 3) Übrige "Egal"-Leute untereinander als Duo
  build(2, (c) => sizeOf(c) === null, false);

  return proposals.sort((x, y) => y.score - x.score);
}

// ——— Texte ———

const label = (id: string, options: { id: string; label: string }[]) => labelOf(id, options);

/** Der Match-Steckbrief als Text: warum wurden diese Personen zusammengebracht? */
export function matchSummary(p: { hub: string; track: "community" | "business"; shared: Shared; size: number }): string {
  const parts: string[] = [];
  const who = p.size === 2 ? "Ihr zwei" : `Ihr ${p.size}`;
  if (p.shared.online) {
    parts.push(`${who} wolltet euch erst einmal online kennenlernen.`);
  } else {
    parts.push(`${who} wohnt nah beieinander (Hub ${label(p.hub, ALL_HUBS)}${p.shared.minutes ? `, höchstens etwa ${p.shared.minutes} Minuten Fahrzeit` : ""}).`);
  }
  if (p.shared.interests.length > 0) {
    parts.push(`Das verbindet euch: ${p.shared.interests.slice(0, 5).map((i) => conceptLabel(i, "interest")).join(", ")}.`);
  }
  if (p.shared.vibes.length > 0) {
    parts.push(`Ähnlicher Vibe: ${p.shared.vibes.slice(0, 3).map((v) => conceptLabel(v, "vibe")).join(", ")}.`);
  }
  if (p.shared.languages.length > 0) {
    parts.push(`Ihr sprecht beide: ${p.shared.languages.slice(0, 3).map((l) => l.charAt(0).toUpperCase() + l.slice(1)).join(", ")}.`);
  }
  if (p.track === "business") {
    if (p.shared.sector) parts.push(`Gleiche Branche: ${label(p.shared.sector, SECTORS)}.`);
    if (p.shared.goals.length > 0) parts.push(`Ähnliche Ziele: ${p.shared.goals.map((g) => label(g, GOALS)).join(", ")}.`);
    parts.unshift("Business-Match.");
  }
  return parts.join(" ");
}

/** Kurzer Bericht für die Freigabe im Admin: wie setzt sich die Punktzahl zusammen? */
export function describeBreakdown(b: Breakdown): string {
  const lines: string[] = [];
  const add = (name: string, value: number) => {
    if (value !== 0) lines.push(`${name} ${value > 0 ? "+" : ""}${value}`);
  };
  add("Interessen", b.interests);
  add("Vibe", b.vibe);
  add("Branche", b.sector);
  add("Ziele", b.goals);
  add("Sprache", b.language);
  add("Lebensphase", b.phase);
  add("Alter", b.age);
  add("Nähe", b.near);
  add("Treffhäufigkeit", b.frequency);
  add("KI-Resonanz", b.resonance);
  add("Wartebonus", b.wait);
  add("No-Go", -b.nogo);
  return lines.join(", ");
}

export const sizeLabel = (id: string | null) => (id === "crew" ? "Crew (4er Gruppe)" : id === "squad" ? "Squad (8er Gruppe)" : id === "any" ? "Egal" : "Duo (2er Gruppe)");
